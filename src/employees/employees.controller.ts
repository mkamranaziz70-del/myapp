import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtGuard } from "../auth/auth1/jwt.guard";
import { EmployeesService } from "./employees.service";
import { CreateEmployeeDto } from "./create-employee.dto";

@Controller("employees")
export class EmployeesController {
  constructor(
    private prisma: PrismaService,
    private employeesService: EmployeesService
  ) {}

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Req() req: any) {
    const companyId = req.user.companyId;

    return this.prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        position: true,
        status: true,
        
      },
    });
  }

  @Post()
  @UseGuards(JwtGuard)
  async createEmployee(
    @Req() req: any,
    @Body() dto: CreateEmployeeDto
  ) {
    const companyId = req.user.companyId;

    return this.employeesService.create(companyId, dto);
  }

  @Get("home")
  @UseGuards(JwtGuard)
  async home(@Req() req: any) {
 const employeeId = req.user.employeeId;

if (!employeeId) {
  throw new NotFoundException(
    "Employee not linked to token"
  );
}

const employee = await this.prisma.employee.findUnique({
  where: { id: employeeId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
});


    if (!employee) {
      throw new NotFoundException(
        "Employee not found for this user"
      );
    }

    const jobs = await this.prisma.jobEmployee.findMany({
      where: {
        employeeId: employee.id,
        job: {
          status: {
            in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"],
          },
        },
      },
      select: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            quotation: {
              select: {
                serviceType: true,
                startAt: true,
                endAt: true,
                movingDate: true,
                startTime: true,
                estimatedHours: true,
                pickupAddress: true,
                dropoffAddress: true,
              },
            },
          },
        },
      },
    });

    const mapped = jobs
      .map(j => {
        const q = j.job.quotation;
        if (!q) return null;

        let startAt = q.startAt;
        if (!startAt && q.movingDate && q.startTime) {
          const day =
            q.movingDate.toISOString().split("T")[0];
          startAt = new Date(`${day}T${q.startTime}`);
        }
        if (!startAt) return null;

        return {
          id: j.job.id,
          jobNumber: j.job.jobNumber,
          status: j.job.status,
          serviceType: q.serviceType,
          startAt,
          movingDate: q.movingDate,
          time: q.startTime,
          endTime: q.endAt
            ? new Date(q.endAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null,
          estimatedHours: q.estimatedHours ?? null,
          pickupAddress: q.pickupAddress ?? null,
          dropoffAddress: q.dropoffAddress ?? null,
        };
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime()
      );

    return {
      employee,
      nextJob: mapped[0] || null,
      upcoming: mapped.slice(1, 4),
    };
  }
}
