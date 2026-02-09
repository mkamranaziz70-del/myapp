import {
  Body,
  Controller,
  Post,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ServiceType, Plan } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

type TempUser = {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
};

const tempUsers = new Map<string, TempUser>();
const otpStore = new Map<string, string>();

@Controller('auth')
export class AuthController {
 constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService, 
  ) {}

  @Post('signup/step-1')
  async signupStep1(@Body() body: any) {
    const {
      legalBusinessName,
      primaryServiceType,
      headquartersAddress,
    } = body;

    if (!legalBusinessName || !primaryServiceType || !headquartersAddress) {
      throw new BadRequestException('Missing required fields');
    }

    const company = await this.prisma.company.create({
      data: {
        name: legalBusinessName.trim(),
        primaryServiceType: primaryServiceType as ServiceType,
        headquartersAddress: headquartersAddress.trim(),

        operatingDays: [],
        operatingStartTime: '00:00',
        operatingEndTime: '00:00',
        payoutMethod: null,

        plan: Plan.STARTER,
      },
    });

    return { success: true, companyId: company.id };
  }

  @Post('signup/step-2')
  async signupStep2(@Body() body: any) {
    const { companyId, fullName, email, phone, password } = body;

    if (!companyId || !fullName || !email || !password) {
      throw new BadRequestException('Missing required fields');
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    tempUsers.set(companyId, {
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone || null,
      password: hashedPassword,
    });

    otpStore.set(normalizedEmail, '0000'); 

    return {
      success: true,
      email: normalizedEmail,
      otpSent: true,
    };
  }

  @Post('signup/verify-otp')
  async verifyOtp(@Body() body: any) {
    const { email, otp } = body;
    const normalizedEmail = email?.toLowerCase();

    if (!normalizedEmail || !otp) {
      throw new BadRequestException('Email and OTP required');
    }

    if (process.env.NODE_ENV !== 'production' && otp === '0000') {
      return { verified: true };
    }

    const storedOtp = otpStore.get(normalizedEmail);
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    return { verified: true };
  }

  @Post('signup/step-4')
  async signupStep4(@Body() body: any) {
    const {
      companyId,
      operatingDays,
      operatingStartTime,
      operatingEndTime,
      payoutMethod,
    } = body;

    if (
      !companyId ||
      !operatingDays ||
      !operatingStartTime ||
      !operatingEndTime
    ) {
      throw new BadRequestException('Missing required fields');
    }

    const tempUser = tempUsers.get(companyId);
    if (!tempUser) {
      throw new BadRequestException('Signup session expired');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: tempUser.email },
    });

    if (existingUser) {
      return { success: true };
    }

    await this.prisma.$transaction([
      this.prisma.company.update({
        where: { id: companyId },
        data: {
          operatingDays,
          operatingStartTime,
          operatingEndTime,
          payoutMethod: payoutMethod || null,
        },
      }),
      this.prisma.user.create({
        data: {
          fullName: tempUser.fullName,
          email: tempUser.email,
          phone: tempUser.phone,
          password: tempUser.password,
          role: Role.OWNER,
          companyId,
        },
      }),
    ]);

    tempUsers.delete(companyId);

    return { success: true, companyId };
  }

@Post('login')
async login(@Body() body: any) {
  const { email, password } = body;

  if (!email || !password) {
    throw new BadRequestException('Email and password required');
  }

  const user = await this.prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { company: true ,    employee: true,  },
  });

  
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  let employeeId: string | null = null;

  if (user.role === Role.EMPLOYEE) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!employee) {
      throw new UnauthorizedException(
        'Employee record not found'
      );
    }

    employeeId = employee.id;
  }

  const token = this.jwt.sign({
    sub: user.id,
    companyId: user.companyId,
    role: user.role,
    employeeId,
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl, // 🔥 ADD THIS LINE

    },
    company: {
      id: user.company.id,
      name: user.company.name,
      plan: user.company.plan,
    },
  };
}


}
