import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { PdfService } from "../pdf/pdf.service";
import { MailService } from "../mail/mail.service";
import * as fs from "fs";

/* =========================
   TYPES
   ========================= */
type InvoicePreviewItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};


@Injectable()
export class InvoicesService {

  constructor(private prisma: PrismaService,  private pdfService: PdfService,  private mailService: MailService, // ✅ ADD

) {}


  /* =========================
     LIST INVOICES
     ========================= */
  async findAll(companyId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { fullName: true } },
        payments: { select: { method: true } },
      },
    });

    return invoices.map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      customerName: i.customer?.fullName ?? "—",
      total: i.total,
      status: i.status,
      dueDate: i.dueDate,
      paidAmount: i.paidAmount,
      createdAt: i.createdAt,
      paymentMethod: i.payments[0]?.method ?? null,
    }));
  }

  /* =========================
     GET SINGLE INVOICE
     ========================= */
  async findOne(id: string, companyId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: true,
        payments: true,
        job: true,
      },
    });

    if (!invoice) {
      throw new BadRequestException("Invoice not found");
    }

    return invoice;
  }

 


  async create(dto: CreateInvoiceDto, companyId: string) {
  if (!dto.items || dto.items.length === 0) {
    throw new BadRequestException(
      "Invoice must have at least one item",
    );
  }

  /* -------- Calculations -------- */
  const subtotal = dto.items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0,
  );

  const fuel = dto.fuelSurcharge ?? 0;
  const discount = dto.discount ?? 0;

  const taxTPS = subtotal * 0.05;
  const taxTVQ = subtotal * 0.09975;

  const total = subtotal + fuel + taxTPS + taxTVQ - discount;

  /* -------- Invoice Number -------- */
  const lastInvoice = await this.prisma.invoice.findFirst({
    where: { companyId },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  const invoiceNumber = (lastInvoice?.invoiceNumber ?? 1000) + 1;

  /* -------- Create Invoice -------- */
  const invoice = await this.prisma.invoice.create({
  data: {
    invoiceNumber,
    companyId,

    customerId: dto.customerId,
    jobId: dto.jobId ?? null,
    quotationId: dto.quotationId ?? null,

    issueDate: new Date(dto.issueDate),
    dueDate: new Date(dto.dueDate),

    subtotal,
    taxTPS,
    taxTVQ,
    discount,
    fuelSurcharge: fuel,   // ✅ Prisma field must exist
    total,

    paidAmount: 0,         // ✅ draft invoice starts unpaid
    status: "DRAFT",       // ✅ correct initial status

    items: {
      create: dto.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.quantity * i.unitPrice,
      })),
    },
  },

  // ✅ REQUIRED for PDF + frontend usage
  include: {
    customer: true,
    items: true,
  },
});


  /* -------- Generate PDF -------- */
  const pdf = await this.pdfService.generateInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,

    company: {
      name: "Company Name", // future: company table
    },

    customer: invoice.customer,

    items: invoice.items,

    subtotal,
    taxTPS,
    taxTVQ,
    fuel,
    discount,
    total,
  });

  /* -------- Save PDF URL -------- */
  await this.prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      pdfUrl: pdf.url,      // ✅ REQUIRED FOR EMAIL + PREVIEW
    },
  });

  return {
    ...invoice,
    pdfUrl: pdf.url,
  };
}


async getInvoicePreview(jobId: string, companyId: string) {
  const job = await this.prisma.job.findFirst({
    where: { id: jobId, companyId },
    include: {
      quotation: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!job || !job.quotation) {
    throw new BadRequestException("Job or quotation not found");
  }

  const q = job.quotation;
  const items: InvoicePreviewItem[] = [];

  if (q.pricingMethod === "HOURLY" && q.hourlyRate && q.estimatedHours) {
    items.push({
      description: `Moving service (${q.workers} workers)`,
      quantity: q.estimatedHours,
      unitPrice: q.hourlyRate,
    });
  }

  if (q.pricingMethod === "FIXED" && q.fixedPrice) {
    items.push({
      description: "Moving service (fixed price)",
      quantity: 1,
      unitPrice: q.fixedPrice,
    });
  }

  if (q.travelCost && q.travelCost > 0) {
    items.push({
      description: "Travel cost",
      quantity: 1,
      unitPrice: q.travelCost,
    });
  }

  return {
    customer: q.customer,
    items,
  };
}

 async previewInvoice(id: string, companyId: string) {
  // 1️⃣ Load invoice
  const invoice = await this.prisma.invoice.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!invoice) {
    throw new BadRequestException("Invoice not found");
  }

  // 2️⃣ If PDF already exists AND file exists → reuse
  if (invoice.pdfUrl && invoice.pdfPath) {
    if (fs.existsSync(invoice.pdfPath)) {
      return {
        pdfUrl: invoice.pdfUrl,
        status: invoice.status,
      };
    }
  }

  // 3️⃣ Generate PDF
  const pdf = await this.pdfService.generateInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,

    company: {
      name: "Company Name", // later: real company data
    },

    customer: invoice.customer,
    items: invoice.items,

    subtotal: invoice.subtotal,
    taxTPS: invoice.taxTPS,
    taxTVQ: invoice.taxTVQ,
    fuel: invoice.fuelSurcharge,
    discount: invoice.discount,
    total: invoice.total,
  });

  // 4️⃣ Persist PDF info (URL + ABSOLUTE PATH)
  await this.prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      pdfUrl: pdf.url,
      pdfPath: pdf.absolutePath,
    },
  });

  // 5️⃣ Return preview response
  return {
    pdfUrl: pdf.url,
    status: invoice.status,
  };
}

async sendInvoice(id: string, companyId: string) {
  // 1️⃣ Load invoice with relations
  const invoice = await this.prisma.invoice.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!invoice) {
    throw new BadRequestException("Invoice not found");
  }

  if (invoice.status !== "DRAFT") {
    throw new BadRequestException("Only draft invoices can be sent");
  }

  // 2️⃣ Ensure PDF exists (generate if missing)
  let pdfUrl = invoice.pdfUrl;
  let pdfPath = invoice.pdfPath;

  if (!pdfUrl || !pdfPath) {
    const preview = await this.previewInvoice(id, companyId);

    const refreshed = await this.prisma.invoice.findUnique({
      where: { id },
      select: { pdfUrl: true, pdfPath: true },
    });

    pdfUrl = refreshed?.pdfUrl ?? null;
    pdfPath = refreshed?.pdfPath ?? null;
  }

  if (!pdfPath) {
    throw new BadRequestException("Invoice PDF could not be generated");
  }

  // 3️⃣ Safety check (file must exist)
  if (!fs.existsSync(pdfPath)) {
    throw new BadRequestException(
      "Invoice PDF file missing on server"
    );
  }

  // 4️⃣ Send email with attachment
  if (!invoice.customer?.email) {
    throw new BadRequestException(
      "Customer email not found"
    );
  }

  await this.mailService.sendGenericMail({
    to: invoice.customer.email,
    subject: `Invoice #${invoice.invoiceNumber} – BoxxPilot`,
    html: `
      <p>Hello <strong>${invoice.customer.fullName}</strong>,</p>
      <p>Please find your invoice attached.</p>

      <p>
        <strong>Invoice #${invoice.invoiceNumber}</strong><br/>
        Total: <strong>$${invoice.total.toFixed(2)}</strong>
      </p>

      <br/>
      <p>Thank you for choosing BoxxPilot.</p>
    `,
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        path: pdfPath, // ✅ ABSOLUTE PATH ONLY
      },
    ],
  });

  // 5️⃣ Update invoice status
  return this.prisma.invoice.update({
    where: { id },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });
}



}
