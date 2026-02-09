import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("public/quotation")
export class PublicQuotationController {
  constructor(private prisma: PrismaService) {}

  @Get(":token")
  async view(@Param("token") token: string) {
    const quote = await this.prisma.quotation.findFirst({
      where: {
        publicToken: token,
        status: "SENT",
        expiresAt: { gt: new Date() },
      },
      include: {
        customer: true,
        company: true,
      },
    });

    if (!quote) {
      throw new NotFoundException("Quotation expired or invalid");
    }

    return quote;
  }
}
