import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Query,
  Patch,
  Body,
  NotFoundException,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JobRole, JobStatus } from "@prisma/client";
import { UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/auth1/jwt.guard";
import { NotificationsService } from "../notifications/notifications.service";
import { sendPush } from "../utils/push";
import { InvoicesService } from "../invoices/invoices.service";


@Controller("jobs")
export class JobController {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private invoicesService: InvoicesService, // ✅ ADD THIS

  ) {}
@Post(":id/start")
@UseGuards(JwtGuard)
async startJob(@Req() req: any, @Param("id") jobId: string) {
const assignment = await this.prisma.jobEmployee.findUnique({
  where: {
    jobId_employeeId: {
      jobId,
      employeeId: req.user.employeeId,
    },
  },
});

if (!assignment) {
  throw new ForbiddenException("You are not assigned to this job");
}

  const job = await this.prisma.job.findUnique({
    where: { id: jobId },
    include: { quotation: true },
  });

  if (!job) throw new NotFoundException("Job not found");

  if (job.status === "IN_PROGRESS") {
    return job;
  }
if (req.user.role !== "EMPLOYEE") {
  throw new ForbiddenException("Only employees can start jobs");
}

  const estimatedHours = job.quotation?.estimatedHours || 0;
  const totalSeconds = estimatedHours * 3600;

  const updated = await this.prisma.job.update({
    where: { id: jobId },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
      totalSeconds, 
    },
  });
await this.notificationsService.createEmployeeNotification({
  employeeId: req.user.employeeId,
  companyId: job.companyId,
  title: "Job Started",
  message: `Job #${job.jobNumber} has been started`,
  type: "JOB_STARTED",
  jobId: job.id,
});
const user = await this.prisma.user.findFirst({
  where: {
    employee: {
      id: req.user.employeeId, 
    },
  },
  select: {
    pushToken: true,
  },
});

if (user?.pushToken) {
  await sendPush(
    user.pushToken,
    "Job Started",
    `Job #${job.jobNumber} has been started`,
    job.id
  );
}



  return updated;
}

@Get(":id/invoice-draft")
@UseGuards(JwtGuard)
async getInvoiceDraftFromJob(
  @Param("id") id: string,
  @Req() req: any
) {
  return this.invoicesService.getInvoicePreview(
    id,
    req.user.companyId
  );
}



@Post(":id/end")
@UseGuards(JwtGuard)
async endJob(@Req() req: any, @Param("id") jobId: string) {
  const job = await this.prisma.job.findUnique({
    where: { id: jobId },
    include: {
      employees: true, 
    },
  });

  if (!job) {
    throw new NotFoundException("Job not found");
  }

  
  const updated = await this.prisma.job.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
    },
  });

  await Promise.all(
    job.employees.map(async (e) => {

      await this.notificationsService.createEmployeeNotification({
        employeeId: e.employeeId,
        companyId: job.companyId,
        title: "Job Completed",
        message: `Job #${job.jobNumber} has been completed`,
        type: "JOB_COMPLETED",
        jobId: job.id,
      });

      const user = await this.prisma.user.findFirst({
        where: {
          employee: {
            id: e.employeeId,
          },
        },
        select: {
          pushToken: true,
        },
      });

      if (user?.pushToken) {
        await sendPush(
          user.pushToken,
          "Job Completed",
          `Job #${job.jobNumber} has been completed`,
          job.id
        );
      }
    })
  );

  return updated;
}
@Post(":id/cancel")
@UseGuards(JwtGuard)
async cancelJob(@Req() req: any, @Param("id") jobId: string) {

  // 🔐 Only OWNER / MANAGER
  if (!["OWNER", "MANAGER"].includes(req.user.role)) {
    throw new ForbiddenException("Only owner or manager can cancel jobs");
  }

  const job = await this.prisma.job.findUnique({
    where: { id: jobId },
    include: {
      employees: true,
    },
  });

  if (!job) {
    throw new NotFoundException("Job not found");
  }

  // ❌ Already final
  if (["COMPLETED", "CANCELLED"].includes(job.status)) {
    throw new ForbiddenException("Job is already finalized");
  }

  // 🟡 Cancel job
  const cancelledJob = await this.prisma.job.update({
    where: { id: jobId },
    data: {
      status: "CANCELLED",
      endedAt: new Date(),
    },
  });

  // 🧹 Unassign all employees
  await this.prisma.jobEmployee.deleteMany({
    where: { jobId },
  });

  // 🔔 Notify employees
  await Promise.all(
    job.employees.map(async (e) => {
      await this.notificationsService.createEmployeeNotification({
        employeeId: e.employeeId,
        companyId: job.companyId,
        title: "Job Cancelled",
        message: `Job #${job.jobNumber} has been cancelled`,
        type: "JOB_CANCELLED",
        jobId: job.id,
      });

      const user = await this.prisma.user.findFirst({
        where: { employee: { id: e.employeeId } },
        select: { pushToken: true },
      });

      if (user?.pushToken) {
        await sendPush(
          user.pushToken,
          "Job Cancelled",
          `Job #${job.jobNumber} has been cancelled`,
          job.id
        );
      }
    })
  );

  return cancelledJob;
}


@Get()
@UseGuards(JwtGuard)
async getJobs(
  @Req() req: any,
  @Query("status") status?: JobStatus
) {
  if (req.user.role === "EMPLOYEE") {
 const rows = await this.prisma.jobEmployee.findMany({
  where: {
    employeeId: req.user.employeeId,
    job: {
      companyId: req.user.companyId,   // 🔐 IMPORTANT
      ...(status ? { status } : {}),
    },
  },
  include: {
    job: {
      include: {
        quotation: { include: { customer: true } },
      },
    },
  },
  orderBy: {
    job: { createdAt: "desc" },
  },
});


  return rows.map(r => {
  const job = r.job;
  const q = job.quotation;
  const start = q?.startAt;
  const estimatedHours = q?.estimatedHours || 0;

  let end: Date | null = null;
  if (start && estimatedHours) {
    end = new Date(start);
    end.setHours(end.getHours() + estimatedHours);
  }

  return {
    id: job.id,
    jobNumber: job.jobNumber,
    status: job.status,

    serviceType: q?.serviceType || "MOVING",
    pickupAddress: q?.pickupAddress || "",
    dropoffAddress: q?.dropoffAddress || "",

    movingDate: q?.movingDate
      ? q.movingDate.toISOString().split("T")[0]
      : null,

    time: start
      ? start.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--",

    endTime: end
      ? end.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--",

    estimatedHours,
  };
});

}


const jobs = await this.prisma.job.findMany({
  where: {
    companyId: req.user.companyId,   // 🔒 MAIN FIX
    ...(status ? { status } : {}),
  },
  include: {
    quotation: {
      include: { customer: true },
    },
  },
  orderBy: { createdAt: "desc" },
});


return jobs.map(job => {
  const q = job.quotation;
  const start = q?.startAt;

  return {
    id: job.id,
    jobNumber: job.jobNumber,
    status: job.status,

    customerName: q?.customer?.fullName || "",
    pickupAddress: q?.pickupAddress || "",
    dropoffAddress: q?.dropoffAddress || "",

    date: q?.movingDate
      ? q.movingDate.toISOString().split("T")[0]
      : null,

    time: start
      ? start.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--",
  };
});


}



@Get(":id")
@UseGuards(JwtGuard)
async getJobById(@Req() req, @Param("id") id: string) {
  const job = await this.prisma.job.findUnique({
    where: { id },
    include: {
      quotation: {
        include: {
          customer: true,
        },
      },
      employees: {
        include: {
          employee: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundException("Job not found");
  }

  const start = job.quotation?.startAt;
  const estimatedHours = job.quotation?.estimatedHours || 0;

  let end: Date | null = null;
  if (start && estimatedHours) {
    end = new Date(start.getTime());
    end.setHours(end.getHours() + estimatedHours);
  }

  return {
    ...job,
  viewerRole: req.user.role, 

    time: start
      ? start.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--",

    endTime: end
      ? end.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--",
  };
}
@Post(":id/employees")
async assignEmployeeToJob(
  @Param("id") jobId: string,
  @Body() body: { employeeId: string; role: string }
) {
 
  const rawRole = body.role?.toString().trim().toUpperCase();

  let finalRole: JobRole;

  if (rawRole === "TEAM_LEADER" || rawRole === "TEAM_LEAD") {
    finalRole = JobRole.TEAM_LEAD;
  } else if (rawRole === "DRIVER") {
    finalRole = JobRole.DRIVER;
  } else if (rawRole === "MOVER") {
    finalRole = JobRole.MOVER;
  } else {
    console.log("❌ Invalid job role received:", body.role);
    finalRole = JobRole.MOVER; // 🔥 SAFE FALLBACK
  }

  const employee = await this.prisma.employee.findUnique({
    where: { id: body.employeeId },
  });

  if (!employee) {
    throw new NotFoundException("Employee not found");
  }

  const job = await this.prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: true,
      quotation: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!job) {
    throw new NotFoundException("Job not found");
  }

  const exists = await this.prisma.jobEmployee.findUnique({
    where: {
      jobId_employeeId: {
        jobId,
        employeeId: body.employeeId,
      },
    },
  });

  let assignment;

  if (exists) {
    assignment = await this.prisma.jobEmployee.update({
      where: {
        jobId_employeeId: {
          jobId,
          employeeId: body.employeeId,
        },
      },
      data: {
        role: finalRole,
      },
    });
  } else {
    assignment = await this.prisma.jobEmployee.create({
      data: {
        jobId,
        employeeId: body.employeeId,
        role: finalRole,
      },
    });
  }

  await this.notificationsService.createEmployeeNotification({
    employeeId: employee.id,
    companyId: job.companyId,
    title: "New Job Assigned",
    message: `You have been assigned to Job #${job.jobNumber}`,
    type: "JOB_ASSIGNED",
    jobId: job.id,
  });

  const admins = await this.prisma.user.findMany({
    where: {
      companyId: job.companyId,
      role: { in: ["OWNER", "MANAGER"] },
    },
    include: {
      employee: true,
    },
  });

  await Promise.all(
    admins
      .filter(a => a.employee) 
      .map(admin =>
        this.notificationsService.createEmployeeNotification({
          employeeId: admin.employee!.id,
          companyId: job.companyId,
          title: "Team Assigned",
          message: `${employee.firstName} ${employee.lastName} assigned to Job #${job.jobNumber}`,
          type: "SYSTEM",
          jobId: job.id,
        })
      )
  );

  return assignment;
}

@Get("profile")
@UseGuards(JwtGuard)
async getEmployeeProfile(@Req() req: any) {
  const employee = await this.prisma.employee.findUnique({
    where: { id: req.user.employeeId },
    select: {
      firstName: true,
      lastName: true,
    }
  });

  if (!employee) {
    throw new NotFoundException("Employee not found");
  }

  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
  };
}



@Get(":id/available-employees")
async getAvailableEmployees(@Param("id") jobId: string) {
  const job = await this.prisma.job.findUnique({
    where: { id: jobId },
    select: {
      companyId: true,
      quotation: { select: { startAt: true, endAt: true } },
    },
  });

  if (!job) throw new NotFoundException("Job not found");

  const busyEmployees = await this.prisma.jobEmployee.findMany({
    where: {
      job: {
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        NOT: { id: jobId },
      },
    },
    select: {
      employeeId: true,
      job: { select: { jobNumber: true } },
    },
  });

  const busyMap = Object.fromEntries(
    busyEmployees.map(b => [b.employeeId, b.job.jobNumber])
  );

  const employees = await this.prisma.employee.findMany({
    where: {
      companyId: job.companyId,
      status: "ACTIVE",
    },
    orderBy: { firstName: "asc" },
  });

  return employees.map(e => ({
    ...e,
    conflict: !!busyMap[e.id],
    conflictJob: busyMap[e.id] || null,
  }));
}

@Delete(":jobId/employees/:employeeId")
async removeEmployeeFromJob(
  @Param("jobId") jobId: string,
  @Param("employeeId") employeeId: string
) {
  const record = await this.prisma.jobEmployee.findFirst({
    where: { jobId, employeeId },
  });

  if (!record) {
    throw new NotFoundException("Employee not assigned");
  }

  return this.prisma.jobEmployee.delete({
    where: { id: record.id },
  });
}


  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: JobStatus
  ) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    return this.prisma.job.update({
      where: { id },
      data: { status },
    });
  }
}
