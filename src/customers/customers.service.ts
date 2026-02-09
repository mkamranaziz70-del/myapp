import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    // 🔹 2. Starter plan limit check
    if (company?.plan === 'STARTER') {
      const customersCount = await this.prisma.customer.count({
        where: { companyId },
      });

      if (customersCount >= 3) {
        throw new ForbiddenException({
          code: 'UPGRADE_REQUIRED_CUSTOMERS',
          message: 'Customer limit reached. Upgrade to PRO.',
          requiredPlan: 'PRO',
        });
      }
    }

    return this.prisma.customer.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email ?? null,

        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        floor: data.floor,
        elevator: data.elevator,
        parking: data.parking,
        notes: data.notes ?? null,

        companyId,
      },
    });
  }
async findOne(companyId: string, customerId: string) {
  return this.prisma.customer.findFirst({
    where: {
      id: customerId,
      companyId, // 🔐 security (important)
    },
  });
}

  async findAll(companyId: string) {
    return this.prisma.customer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
