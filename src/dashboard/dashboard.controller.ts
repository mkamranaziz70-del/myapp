import {
  Controller,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get("owner")
  async ownerDashboard(@Req() req: any) {
    // ✅ company context MUST come from token
    const companyId = req.user.companyId;

    /* =========================
       JOB STATS (LIVE COUNTS)
    ========================= */
    const grouped = await this.prisma.job.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { _all: true },
    });

    const count: Record<string, number> = {};
    grouped.forEach(g => {
      count[g.status] = g._count._all;
    });

    /* =========================
       QUOTATIONS
    ========================= */
    const quotationsCount = await this.prisma.quotation.count({
      where: { companyId },
    });

    const draftCount = await this.prisma.quotation.count({
      where: {
        companyId,
        status: "DRAFT",
      },
    });

    /* =========================
       RESPONSE
    ========================= */
    return {
      stats: {
        pending: count["PENDING"] || 0,
        cancelled: count["CANCELLED"] || 0,
        moves:
          (count["CONFIRMED"] || 0) +
          (count["IN_PROGRESS"] || 0) +
          (count["COMPLETED"] || 0) +
          (count["AUTO_ENDED"] || 0),
      },

      quotationsCount,
      draftCount,
    };
  }
}
