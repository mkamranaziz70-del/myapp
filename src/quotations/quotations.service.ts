import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "crypto";
import * as nodemailer from "nodemailer";
import Twilio from "twilio";
import { Prisma } from "@prisma/client";
import { PdfService } from "../pdf/pdf.service";

@Injectable()
export class QuotationsService {
  private mailer?: nodemailer.Transporter;
  private twilio?: any;

  constructor(private prisma: PrismaService,    private pdfService: PdfService, // 👈 MUST be here
) {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.mailer = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    if (
      process.env.TWILIO_SID &&
      process.env.TWILIO_TOKEN
    ) {
      this.twilio = Twilio(
        process.env.TWILIO_SID,
        process.env.TWILIO_TOKEN
      );
    }
  }

  
 async createQuote(user: any, data: any) {
  if (!data.customerId)
    throw new BadRequestException("Customer is required");
  if (!data.serviceType)
    throw new BadRequestException("Service type is required");

  return this.prisma.quotation.create({
    data: {
      quoteNumber: null,          // 👈 NEVER generate here
      status: "IN_PROGRESS",
      customerId: data.customerId,
      movingDate: data.movingDate ? new Date(data.movingDate) : null,
      startTime: data.startTime || null,
      serviceType: data.serviceType,
      companyId: user.companyId,
      createdById: user.id,
      workers: 1,
      trucks: 1,
      pricingMethod: "HOURLY",
      total: 0,
    },
  });
}

private async generateQuoteNumber(companyId: string): Promise<number> {
  const last = await this.prisma.quotation.findFirst({
    where: {
      companyId,
      quoteNumber: { not: null },
    },
    orderBy: { quoteNumber: "desc" },
  });

  if (!last || last.quoteNumber === null) {
    return 1001;
  }

  return last.quoteNumber + 1;
}


async updateQuote(user: any, id: string, data: any) {
  const quote = await this.prisma.quotation.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!quote) throw new NotFoundException("Quotation not found");
 if (!["IN_PROGRESS", "DRAFT"].includes(quote.status)) {
  throw new BadRequestException("Quotation cannot be edited");
}
  delete data.status;


  const safe = (v: any) =>
    typeof v === "number" && !isNaN(v) ? v : undefined;


  const finalMovingDate = data.movingDate
    ? new Date(data.movingDate)
    : quote.movingDate;

  const finalStartTime = data.startTime ?? quote.startTime;

  const finalEstimatedHours =
    data.estimatedHours ?? quote.estimatedHours;

  let startAtUpdate: Date | undefined = undefined;
  let endAtUpdate: Date | undefined = undefined;

if (
  finalMovingDate &&
  finalStartTime &&
  finalEstimatedHours &&
  finalEstimatedHours > 0
) {
  const [hh, mm] = finalStartTime.split(":");

const [year, month, day] = finalMovingDate
  .toISOString()
  .slice(0, 10)
  .split("-")
  .map(Number);

const startAt = new Date(
  year,
  month - 1,
  day,
  Number(hh),
  Number(mm),
  0,
  0
);



  if (!isNaN(startAt.getTime())) {
const endAt = new Date(
  startAt.getTime() +
    finalEstimatedHours * 60 * 60 * 1000
);



    startAtUpdate = startAt;
    endAtUpdate = endAt;
  }
}

const inventoryItems =
  data.inventoryItems ??
  (Array.isArray(data.inventory)
    ? data.inventory.reduce(
        (sum: number, i: any) => sum + (i.quantity || 0),
        0
      )
    : undefined);
  return this.prisma.quotation.update({
    where: { id },
    data: {
      movingDate: data.movingDate
        ? new Date(data.movingDate)
        : undefined,
startTime:
  data.startTime !== undefined
    ? data.startTime
    : undefined,

      ...(startAtUpdate && { startAt: startAtUpdate }),
      ...(endAtUpdate && { endAt: endAtUpdate }),

      serviceType: data.serviceType,
      pricingMethod: data.pricingMethod,

      workers: safe(data.workers),
      trucks: safe(data.trucks),
      truckSize: data.truckSize,

      hourlyRate: safe(data.hourlyRate),
      estimatedHours: safe(data.estimatedHours),
      fixedPrice: safe(data.fixedPrice),

      travelCost: safe(data.travelCost),
      materialsCost: safe(data.materialsCost),
      otherFees: safe(data.otherFees),
      discount: safe(data.discount),

      taxTPS: safe(data.taxTPS),
      taxTVQ: safe(data.taxTVQ),
      total: safe(data.total),

      estimatedVolumeCft: safe(data.estimatedVolumeCft),
      estimatedWeightLbs: safe(data.estimatedWeightLbs),
      inventoryNotes: data.inventoryNotes,
inventoryJson:
  Array.isArray(data.inventory)
    ? data.inventory
    : undefined,

inventoryItems:
  typeof inventoryItems === "number"
    ? inventoryItems
    : undefined,

      pickupAddress: data.pickupAddress,
      pickupUnit: data.pickupUnit,
pickupFloor:
  data.pickupFloor !== undefined ? data.pickupFloor : undefined,

dropoffFloor:
  data.dropoffFloor !== undefined ? data.dropoffFloor : undefined,
      pickupElevator: data.pickupElevator,
      pickupLoadingDock: data.pickupLoadingDock,
      parkingDifficulty: data.parkingDifficulty,
      walkingDistance: safe(data.walkingDistance),
      stairsWidth: data.stairsWidth,
      pickupAccessNotes: data.pickupAccessNotes,

      dropoffAddress: data.dropoffAddress,
      dropoffUnit: data.dropoffUnit,
      dropoffElevator: data.dropoffElevator,
      dropoffLoadingDock: data.dropoffLoadingDock,
      dropoffParkingDifficulty: data.dropoffParkingDifficulty,
      dropoffWalkingDistance: safe(data.dropoffWalkingDistance),
      dropoffStairsWidth: data.dropoffStairsWidth,
      dropoffAccessNotes: data.dropoffAccessNotes,

      termsText: data.termsText,
      internalNotes: data.internalNotes,
      validityDays: safe(data.validityDays),

      notes: data.notes,
    },
  });
}
async saveDraft(user: any, id: string) {
  const quote = await this.prisma.quotation.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!quote) throw new NotFoundException("Quotation not found");
  if (quote.status !== "IN_PROGRESS")
    throw new BadRequestException("Only in-progress quotations can be saved");

  const quoteNumber =
    quote.quoteNumber ?? (await this.generateQuoteNumber(user.companyId));

  return this.prisma.quotation.update({
    where: { id },
    data: {
      status: "DRAFT",
      quoteNumber,   // 👈 FINAL HERE
    },
  });
}
async sendQuote(user: any, id: string) {
  // 🔍 1️⃣ FETCH QUOTATION

  
  const quote = await this.prisma.quotation.findFirst({
    where: { id, companyId: user.companyId },
    include: { customer: true, company: true },
  });

  if (!quote) {
    throw new NotFoundException("Quotation not found");
  }

  if (!["IN_PROGRESS", "DRAFT"].includes(quote.status)) {
    throw new BadRequestException("Quotation cannot be sent");
  }

  if (!quote.validityDays) {
    throw new BadRequestException("Validity period missing");
  }

  if (!quote.startAt || !quote.endAt) {
    throw new BadRequestException(
      "Set moving date, start time and estimated hours before sending quotation"
    );
  }
// 🔒 PLAN CHECK — SEND QUOTATION
const plan = quote.company.plan;

// ❌ Starter can send BUT watermark only
const allowSignature = ["PRO", "ELITE"].includes(plan);

  // 🔢 2️⃣ FINAL QUOTE NUMBER
  const quoteNumber =
    quote.quoteNumber ?? (await this.generateQuoteNumber(user.companyId));

  // ⏳ 3️⃣ EXPIRY DATE
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + quote.validityDays);

  // 🔗 4️⃣ PUBLIC LINK
  const token = randomUUID();
  const publicLink = `${process.env.APP_PUBLIC_URL}/public/quotation/${token}`;

  // 🧾 5️⃣ GENERATE PDF (ABSOLUTE + URL)
 // 🧾 5️⃣ GENERATE PDF (ABSOLUTE + URL)
const pdf = await this.pdfService.generateQuotationPdf({
  quoteNumber,
  quote,
  customer: quote.customer,
  company: {
    ...quote.company,
    logoUrl: `${process.env.APP_PUBLIC_URL}/uploads/company-logo.jpeg`,
  },
  signed: false,
    watermark: plan === "STARTER", // 🔥 IMPORTANT

});

  // pdf = { url, absolutePath }

  // 🧠 6️⃣ UPDATE QUOTATION (SINGLE SOURCE OF TRUTH)
  const updated = await this.prisma.quotation.update({
    where: { id },
    data: {
      status: "SENT",
      quoteNumber,
      publicToken: token,
      sentAt: new Date(),
      expiresAt,
      sentPdfUrl: pdf.url,
      pdfGeneratedAt: new Date(),
    },
  });

  // 📧 8️⃣ SEND EMAIL WITH PDF ATTACHMENT
  if (this.mailer && quote.customer?.email) {
    await this.mailer.sendMail({
      from: `"BoxxPilot" <${process.env.SMTP_USER}>`,
      to: quote.customer.email,
      subject: `Quotation #${updated.quoteNumber}`,
      html: `
        <p>Hello ${quote.customer.fullName},</p>

        <p>Your moving quotation is ready.</p>

        <p>
          <a href="${publicLink}" style="
            display:inline-block;
            padding:12px 18px;
            background:#2563EB;
            color:#ffffff;
            border-radius:6px;
            text-decoration:none;
            font-weight:600;
          ">
            View & Sign Quotation
          </a>
        </p>

        <p style="margin-top:12px">
          Valid until <b>${expiresAt.toDateString()}</b>
        </p>

        <p style="color:#6B7280;font-size:13px;margin-top:24px">
          — BoxxPilot
        </p>
      `,
      attachments: [
        {
          filename: `Quotation-${updated.quoteNumber}.pdf`,
          path: pdf.absolutePath, // ✅ REAL FILE PATH
        },
      ],
    });
  }

  // ✅ 9️⃣ FINAL RESPONSE
  return {
    success: true,
    quoteNumber: updated.quoteNumber,
    link: publicLink,
    expiresAt,
    pdfUrl: pdf.url,
  };
}



  async getAllQuotes(user: any) {
    return this.prisma.quotation.findMany({
where: {
  companyId: user.companyId,
  status: {
    in: ["DRAFT", "SENT", "SIGNED", "REJECTED", "EXPIRED"],
  },
},
      orderBy: { updatedAt: "desc" },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
            pickupAddress: true,
            dropoffAddress: true,
          },
        },
      },
    });
  }
  async getQuoteById(user: any, id: string) {
    const quote = await this.prisma.quotation.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        customer: true,
        createdBy: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!quote) throw new NotFoundException("Quotation not found");
    return quote;
  }


async duplicateQuote(user: any, id: string) {
  const quote = await this.getQuoteById(user, id);

  return this.prisma.quotation.create({
    data: {
      companyId: user.companyId,
      customerId: quote.customerId,
      createdById: user.id,

      status: "IN_PROGRESS",
      quoteNumber: null,

      movingDate: quote.movingDate,
      startTime: quote.startTime,
      serviceType: quote.serviceType,

      workers: quote.workers,
      trucks: quote.trucks,
      truckSize: quote.truckSize,

      pricingMethod: quote.pricingMethod,
      hourlyRate: quote.hourlyRate,
      fixedPrice: quote.fixedPrice,

      travelCost: quote.travelCost,
      materialsCost: quote.materialsCost,
      otherFees: quote.otherFees,
      discount: quote.discount,

      taxTPS: quote.taxTPS,
      taxTVQ: quote.taxTVQ,
      total: quote.total,

      estimatedVolumeCft: quote.estimatedVolumeCft,
      estimatedWeightLbs: quote.estimatedWeightLbs,
inventoryJson:
  quote.inventoryJson ?? Prisma.DbNull,
      inventoryItems: quote.inventoryItems,
      inventoryNotes: quote.inventoryNotes,

      pickupAddress: quote.pickupAddress,
      pickupUnit: quote.pickupUnit,
      pickupFloor: quote.pickupFloor,
      pickupElevator: quote.pickupElevator,
      pickupLoadingDock: quote.pickupLoadingDock,
      pickupAccessNotes: quote.pickupAccessNotes,

      dropoffAddress: quote.dropoffAddress,
      dropoffUnit: quote.dropoffUnit,
      dropoffFloor: quote.dropoffFloor,
      dropoffElevator: quote.dropoffElevator,
      dropoffLoadingDock: quote.dropoffLoadingDock,
      dropoffAccessNotes: quote.dropoffAccessNotes,

      notes: quote.notes,
      termsText: quote.termsText,
      internalNotes: quote.internalNotes,
    },
  });
}


async archiveQuote(user: any, id: string) {
  const quote = await this.prisma.quotation.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!quote) throw new NotFoundException("Quotation not found");

  if (quote.status === "SIGNED") {
    throw new BadRequestException("Signed quotations cannot be archived");
  }

  return this.prisma.quotation.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

async renewQuote(user: any, id: string) {
  const quote = await this.prisma.quotation.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!quote) throw new NotFoundException("Quotation not found");

  if (quote.status !== "EXPIRED") {
    throw new BadRequestException("Only expired quotations can be renewed");
  }

  return this.prisma.quotation.create({
    data: {
      companyId: user.companyId,
      customerId: quote.customerId,
      createdById: user.id,

      status: "IN_PROGRESS",
      quoteNumber: null,

      movingDate: quote.movingDate,
      startTime: quote.startTime,
      serviceType: quote.serviceType,

      workers: quote.workers,
      trucks: quote.trucks,
      truckSize: quote.truckSize,

      pricingMethod: quote.pricingMethod,
      hourlyRate: quote.hourlyRate,
      fixedPrice: quote.fixedPrice,

      travelCost: quote.travelCost,
      materialsCost: quote.materialsCost,
      otherFees: quote.otherFees,
      discount: quote.discount,

      taxTPS: quote.taxTPS,
      taxTVQ: quote.taxTVQ,
      total: quote.total,

      estimatedVolumeCft: quote.estimatedVolumeCft,
      estimatedWeightLbs: quote.estimatedWeightLbs,

      inventoryJson:
        quote.inventoryJson ?? Prisma.DbNull,
      inventoryItems: quote.inventoryItems ?? undefined,
      inventoryNotes: quote.inventoryNotes,

      pickupAddress: quote.pickupAddress,
      pickupUnit: quote.pickupUnit,
      pickupFloor: quote.pickupFloor,
      pickupElevator: quote.pickupElevator,
      pickupLoadingDock: quote.pickupLoadingDock,
      pickupAccessNotes: quote.pickupAccessNotes,

      dropoffAddress: quote.dropoffAddress,
      dropoffUnit: quote.dropoffUnit,
      dropoffFloor: quote.dropoffFloor,
      dropoffElevator: quote.dropoffElevator,
      dropoffLoadingDock: quote.dropoffLoadingDock,
      dropoffAccessNotes: quote.dropoffAccessNotes,

      notes: quote.notes,
      termsText: quote.termsText,
      internalNotes: quote.internalNotes,
      validityDays: quote.validityDays,
    },
  });
}

async sendReminder(user: any, id: string) {
  const quote = await this.prisma.quotation.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      customer: true,
      company: true,
    },
  });

  if (!quote) throw new NotFoundException("Quotation not found");

  if (quote.status !== "SENT") {
    throw new BadRequestException("Reminder allowed only for sent quotations");
  }

  // 🔒 PLAN CHECK
  if (!["PRO", "ELITE"].includes(quote.company.plan)) {
    throw new BadRequestException(
      "Reminders are available only on Pro or Elite plans"
    );
  }

  // 🛑 Throttle: 1 reminder / 24h
  if (
    quote.lastReminderAt &&
    Date.now() - quote.lastReminderAt.getTime() < 24 * 60 * 60 * 1000
  ) {
    throw new BadRequestException(
      "Reminder already sent in last 24 hours"
    );
  }

  // 📩 EMAIL
  if (this.mailer && quote.customer?.email) {
    await this.mailer.sendMail({
      to: quote.customer.email,
      subject: `Reminder: Quotation #${quote.quoteNumber}`,
      html: `
        <p>Hello ${quote.customer.fullName},</p>
        <p>This is a reminder regarding your moving quotation.</p>
        <p>Please review and sign if you wish to proceed.</p>
      `,
    });
  }

  // 📱 SMS
  if (this.twilio && quote.customer?.phone) {
    await this.twilio.messages.create({
      to: quote.customer.phone,
      from: process.env.TWILIO_NUMBER,
      body: `Reminder: Your quotation #${quote.quoteNumber} is awaiting your response.`,
    });
  }

  // 📝 SAVE LOG
  await this.prisma.quotation.update({
    where: { id },
    data: { lastReminderAt: new Date() },
  });

  return { success: true };
}



  async deleteQuote(user: any, id: string) {
    const quote = await this.prisma.quotation.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!quote) throw new NotFoundException("Quotation not found");
if (["SENT", "SIGNED"].includes(quote.status)) {
  throw new BadRequestException("Cannot delete sent quotations");
}

    await this.prisma.quotation.delete({ where: { id } });
    return { success: true };
  }
}
