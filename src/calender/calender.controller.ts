import {
  Controller,
  Get,
  Req,
  Query,
  UseGuards
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private prisma: PrismaService) {}

  @Get("/calendar")
async getCalendar(
  @Req() req,
  @Query("start") start: string,
  @Query("end") end: string,
) {
  const companyId = req.user.companyId;

  // Safety check
  if (!start || !end) {
    return [];
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const jobs = await this.prisma.job.findMany({
    where: {
      companyId,
      status: {
        in: ["CONFIRMED", "IN_PROGRESS", "CANCELLED", "COMPLETED"],
      },
      quotation: {
        startAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      quotation: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: {
      quotation: {
        startAt: "asc",
      },
    },
  });

  return jobs.map(j => ({
    id: j.id,
    jobNumber: j.jobNumber,
    customerName: j.quotation?.customer?.fullName || "",
    fromAddress: j.quotation?.pickupAddress || "",
    toAddress: j.quotation?.dropoffAddress || "",
    date: j.quotation?.startAt
    ? j.quotation.startAt.toISOString()
    : null,
    time: j.quotation?.startAt
      ? j.quotation.startAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    endTime: j.quotation?.endAt
      ? j.quotation.endAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    status: j.status,
    title:
      j.title ||
      `${j.quotation?.customer?.fullName || "Customer"} Move`,
    crew: Array.isArray(j.quotation?.workers)
      ? j.quotation.workers.length
      : 0,
    color:
      j.status === "CONFIRMED"
        ? "#2A9D8F"
        : j.status === "IN_PROGRESS"
        ? "#457B9D"
        : j.status === "COMPLETED"
        ? "#6C757D"
        : "#E63946",
  }));
}

}
