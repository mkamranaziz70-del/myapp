import { Module } from "@nestjs/common";
import { CalendarController } from "./calender.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
