import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto } from "./create-employee.dto";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { MailService } from "../mail/mail.service";

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) {}

  async findAll(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }
async setPassword(token: string, password: string) {
  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&]).{8,}$/;

  if (!strongPassword.test(password)) {
    throw new BadRequestException(
      "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
    );
  }

  const employee = await this.prisma.employee.findFirst({
    where: {
      passwordToken: token,
      passwordTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!employee) {
    throw new BadRequestException("Invalid or expired password token");
  }

  const hashed = await bcrypt.hash(password, 12);

  await this.prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: employee.userId },
      data: { password: hashed },
    });

    await tx.employee.update({
      where: { id: employee.id },
      data: {
        passwordToken: null,
        passwordTokenExpiresAt: null,
      },
    });
  });

  return {
    message: "Password set successfully. You can now log in.",
  };
}

  async create(companyId: string, dto: CreateEmployeeDto) {
    if (!process.env.ENCRYPTION_KEY || !process.env.APP_PUBLIC_URL) {
      throw new Error("Missing env variables");
    }

    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let sinEncrypted = cipher.update(dto.sin, "utf8", "hex");
    sinEncrypted += cipher.final("hex");

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const confirmationToken = crypto.randomUUID();

    const employee = await this.prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          fullName: `${dto.firstName} ${dto.lastName}`,
          email: dto.email,
          password: hashedPassword,
          role: "EMPLOYEE",
          companyId,
        },
      });

      return tx.employee.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: new Date(dto.dateOfBirth),
          sinEncrypted,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          hireDate: new Date(dto.hireDate),
          position: dto.position,
          employmentType: dto.employmentType,
          hourlyRate: dto.hourlyRate,

          status: "PENDING",
          confirmationToken,

          companyId,
          userId: user.id,
        },
      });
    });

    const confirmLink =
      `${process.env.APP_PUBLIC_URL}/employee/confirm/${confirmationToken}`;

    await this.mailService.sendEmployeeConfirmation(
      dto.email,
      `${dto.firstName} ${dto.lastName}`,
      confirmLink
    );

    return {
      message: "Employee created. Confirmation email sent.",
      employee,
    };
  }

  async confirmEmployee(token: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { confirmationToken: token },
    });

    if (!employee) {
      throw new Error("Invalid or expired confirmation token");
    }

    const passwordToken = crypto.randomUUID();

    return this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        status: "ACTIVE",
        confirmationToken: null,
        passwordToken,
        passwordTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });
  }

  async sendPasswordSetupEmail(
    email: string,
    name: string,
    link: string
  ) {
    return this.mailService.sendSetPasswordEmail(email, name, link);
  }

  async editEmployee(employeeId: string, dto: any) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) throw new Error("Employee not found");

    if (employee.status !== "ACTIVE") {
      throw new ForbiddenException(
        "Only active employees can be edited"
      );
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: dto,
    });
  }

async deleteEmployee(employeeId: string) {
  return this.prisma.$transaction(async tx => {
    const employee = await tx.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    await tx.user.delete({
      where: { id: employee.userId },
    });

    return { success: true };
  });
}

}
