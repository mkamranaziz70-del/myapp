import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVolumeDto } from "./dto/create-volume.dto";
import {
  calculateTotalVolume,
  calculateEstimatedWeight,
  getSuggestedTruck,
  getSuggestedWorkers,
} from "./utils/volume-calculator.util";

@Injectable()
export class VolumeService {
  constructor(private readonly prisma: PrismaService) {}

  
  async create(user: any, dto: CreateVolumeDto) {
  const company = await this.prisma.company.findUnique({
    where: { id: user.companyId },
    select: { plan: true },
  });

  if (company?.plan === "STARTER") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usedThisMonth =
      await this.prisma.volumeCalculation.count({
        where: {
          companyId: user.companyId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

    if (usedThisMonth >= 3) {
      throw new ForbiddenException({
        code: "UPGRADE_REQUIRED_VOLUME",
        message:
          "Upgrade to Pro to calculate unlimited volumes",
      });
    }
  }

  // ❌ Inventory validation
  if (!dto.inventory || dto.inventory.length === 0) {
    throw new ForbiddenException(
      "At least one inventory item is required for volume calculation"
    );
  }

  // ✅ CALCULATIONS
  const totalVolume = calculateTotalVolume(dto.inventory);
  const estimatedWeight =
    calculateEstimatedWeight(dto.inventory);

  const suggestedTruck =
    getSuggestedTruck(totalVolume);
  const suggestedWorkers =
    getSuggestedWorkers(totalVolume);

  // ✅ RESPONSE (NO SAVE HERE — JUST CALCULATION)
  return {
    totalVolumeCft: totalVolume,
    estimatedWeightLbs: estimatedWeight,
    suggestedTruck,
    suggestedWorkers,
    inventory: dto.inventory,
    notes: dto.notes ?? null,
  };
}


  /**
   * Import inventory from an existing quotation
   */
  async importPrevious(user: any, quotationId: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: {
        id: quotationId,
        companyId: user.companyId,
inventoryJson: {
  not: Prisma.JsonNull,
}
      },
      select: {
        id: true,
        quoteNumber: true,
        estimatedVolumeCft: true,
        estimatedWeightLbs: true,
        inventoryJson: true,
        truckSize: true,
        workers: true,
        createdAt: true,
      },
    });

    if (!quotation) {
      throw new NotFoundException(
        "No previous volume calculation found"
      );
    }

    return {
      sourceQuotationId: quotation.id,
      quoteNumber: quotation.quoteNumber,
      totalVolumeCft: quotation.estimatedVolumeCft,
      estimatedWeightLbs: quotation.estimatedWeightLbs,
      suggestedTruck: quotation.truckSize,
      suggestedWorkers: quotation.workers,
      inventory: quotation.inventoryJson,
      createdAt: quotation.createdAt,
    };
  }

async save(user: any, payload: any) {
  return this.prisma.volumeCalculation.create({
    data: {
      companyId: user.companyId,
      userId: user.id,

      customerId: payload.customerId ?? null,
      customerName: payload.customerName ?? null,

      inventoryJson: payload.inventory,      // ✅ MATCH MODEL
      breakdownJson: payload.breakdown,      // ✅ MATCH MODEL

      totalVolumeCft: payload.totalVolumeCft,
      estimatedWeightLbs: payload.estimatedWeightLbs,

      suggestedTruck: payload.suggestedTruck,
      suggestedWorkers: payload.suggestedWorkers,

     truckCapacityPercent:
        payload.truckCapacityPercent ??
        Math.min(
          Math.round((payload.totalVolumeCft / 1700) * 100),
          100
        ),
      createdAt: payload.createdAt
        ? new Date(payload.createdAt)
        : new Date(),
    },
  });
}


  /**
   * Get volume calculation history (for import screen)
   */
async getHistory(user: any) {
  return this.prisma.volumeCalculation.findMany({
    where: {
      companyId: user.companyId,
    },
    select: {
      id: true,
      customerName: true,
      totalVolumeCft: true,
      estimatedWeightLbs: true,
      suggestedTruck: true,
      suggestedWorkers: true,
      truckCapacityPercent: true,
      createdAt: true,
      inventoryJson: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async delete(user: any, id: string) {
  const volume = await this.prisma.volumeCalculation.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
  });

  if (!volume) {
    throw new NotFoundException("Volume calculation not found");
  }

  return this.prisma.volumeCalculation.delete({
    where: { id },
  });
}
async getById(user: any, id: string) {
  const volume = await this.prisma.volumeCalculation.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
  });

  if (!volume) {
    throw new NotFoundException("Volume calculation not found");
  }

  return volume;
}

  /**
   * Attach volume calculation to a quotation
   */
  async attachToQuotation(
    user: any,
    quotationId: string,
    inventory: any[],
  ) {
    const quotation = await this.prisma.quotation.findFirst({
      where: {
        id: quotationId,
        companyId: user.companyId,
      },
    });

    if (!quotation) {
      throw new NotFoundException("Quotation not found");
    }
  const inventoryItems = inventory.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
    const totalVolume = calculateTotalVolume(inventory);
    const estimatedWeight = calculateEstimatedWeight(inventory);

    const suggestedTruck = getSuggestedTruck(totalVolume);
    const suggestedWorkers = getSuggestedWorkers(totalVolume);

    return this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        inventoryJson: inventory,
        estimatedVolumeCft: totalVolume,
        inventoryItems,        
    estimatedWeightLbs:
        estimatedWeight > 0
          ? estimatedWeight
          : quotation.estimatedWeightLbs,
        truckSize: suggestedTruck,
        workers: suggestedWorkers,
      },
    });
  }
}
