import { Module } from "@nestjs/common";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";
import { PrismaModule } from "../prisma/prisma.module";
import { MailModule } from "../mail/mail.module"; 
import { EmployeesPublicController } from "../employees/employees.public.controller"; 

@Module({
  imports: [
    PrismaModule,
    MailModule, 
  ],
  controllers: [EmployeesController,EmployeesPublicController, 
],
  providers: [EmployeesService],
})
export class EmployeesModule {}
