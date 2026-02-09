import { Module } from "@nestjs/common";
import { PublicQuotationController } from "./public-quotation.controller";
import { PublicSignController } from "./public-signin.controller";
import { PrismaService } from "../../prisma/prisma.service";  // DIRECT SERVICE
import { PdfService } from "../../pdf/pdf.service";              // DIRECT SERVICE
import { MailService } from "../../mail/mail.service";          // DIRECT SERVICE

@Module({
  providers: [PrismaService, PdfService, MailService],     // 🔥 NO MODULE IMPORTS
  controllers: [PublicQuotationController, PublicSignController],
})
export class PublicModule {}