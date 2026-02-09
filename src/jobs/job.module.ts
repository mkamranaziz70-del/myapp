import { Module } from "@nestjs/common";
import { JobController } from "./job.controller";
import { JobsCronService } from "./jobs-cron.service";

import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [
    PrismaModule,       
    NotificationsModule, 
    InvoicesModule
  ],
  controllers: [JobController],
  providers: [
    JobsCronService,     
  ],
})
export class JobModule {}
