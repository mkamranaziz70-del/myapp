import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, PrismaService],
})
export class CustomersModule {}
