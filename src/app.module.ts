import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthController } from "./auth/auth1/auth.controller";
import { DashboardController } from "./dashboard/dashboard.controller";
import { ChatModule } from "./chat/chat.module";
import { QuotationsModule } from "./quotations/quotations.module";
import { AuthModule } from "./auth/auth1/auth.module";
import { PublicModule } from "./modules/public/public.module";
import { CustomersModule } from "./customers/customers.module";
import { CalendarModule } from "./calender/calender.module";
import { JobModule } from "./jobs/job.module";
import { EmployeesModule } from "./employees/employees.module";
import { PrismaModule } from "./prisma/prisma.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { VolumeModule } from "./volume/volume.module";
import { PdfModule } from "./pdf/pdf.module";
import { MailModule } from "./mail/mail.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { UsersController } from "./users/users.controller";
import { CompanyModule } from "./company/company.module";

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ChatModule,
    AuthModule,
    PdfModule,
    MailModule,
    PublicModule,
    JobModule,
    CompanyModule,
    EmployeesModule,
    InvoicesModule,
    NotificationsModule, 
    CustomersModule,
    QuotationsModule,
    CalendarModule,
    VolumeModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    DashboardController,
  ],
})
export class AppModule {}
