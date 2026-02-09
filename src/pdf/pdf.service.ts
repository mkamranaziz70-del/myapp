import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";

export interface GeneratedPdf {
  url: string;          // public URL
  absolutePath: string; // server path (email attachment)
}

@Injectable()
export class PdfService {
  private readonly templatesDir = path.join(
    __dirname,
    "..",
    "..",
    "templates"
  );

  private readonly uploadsDir = path.join(
    __dirname,
    "..",
    "..",
    "uploads"
  );

  /* =====================================================
     QUOTATION PDF (existing – unchanged)
     ===================================================== */
  async generateQuotationPdf(data: any): Promise<GeneratedPdf> {
    try {
      if (!data?.quoteNumber) {
        throw new Error("quoteNumber missing for PDF generation");
      }

      const templatePath = path.join(
        this.templatesDir,
        "quotation.html"
      );

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateHtml = fs.readFileSync(templatePath, "utf8");

      Handlebars.registerHelper("currency", (value: number) =>
        typeof value === "number" ? `$${value.toFixed(2)}` : "-"
      );

      Handlebars.registerHelper("date", (value: Date) =>
        value ? new Date(value).toDateString() : "-"
      );

      const compiledTemplate = Handlebars.compile(templateHtml);
      const html = compiledTemplate(data);

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--font-render-hinting=medium",
        ],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }

      const fileName = `quotation-${data.quoteNumber}${
        data.signed ? "-signed" : ""
      }.pdf`;

      const absolutePath = path.join(this.uploadsDir, fileName);

      await page.pdf({
        path: absolutePath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        scale: 1,
        margin: {
          top: "20mm",
          bottom: "20mm",
          left: "15mm",
          right: "15mm",
        },
      });

      await page.close();
      await browser.close();

      return {
        url: `/uploads/${fileName}`,
        absolutePath,
      };
    } catch (error) {
      console.error("PDF GENERATION FAILED:", error);
      throw new InternalServerErrorException(
        "Failed to generate quotation PDF"
      );
    }
  }

  /* =====================================================
     ✅ INVOICE PDF (NEW – added)
     ===================================================== */
  async generateInvoicePdf(data: any): Promise<GeneratedPdf> {
    try {
      // 🔐 Validation
      if (!data?.invoiceNumber) {
        throw new Error("invoiceNumber missing for invoice PDF generation");
      }

      // 📄 Template
      const templatePath = path.join(
        this.templatesDir,
        "invoice.html"
      );

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const templateHtml = fs.readFileSync(templatePath, "utf8");

      // Helpers (reuse same helpers)
      Handlebars.registerHelper("currency", (value: number) =>
        typeof value === "number" ? `$${value.toFixed(2)}` : "-"
      );

      Handlebars.registerHelper("date", (value: Date) =>
        value ? new Date(value).toDateString() : "-"
      );

      const compiledTemplate = Handlebars.compile(templateHtml);
      const html = compiledTemplate(data);

      // 🧠 Browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--font-render-hinting=medium",
        ],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      // 📂 Filesystem
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }

      const fileName = `invoice-${data.invoiceNumber}.pdf`;
      const absolutePath = path.join(this.uploadsDir, fileName);

      // 🖨️ PDF
      await page.pdf({
        path: absolutePath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        scale: 1,
        margin: {
          top: "20mm",
          bottom: "20mm",
          left: "15mm",
          right: "15mm",
        },
      });

      await page.close();
      await browser.close();

      return {
        url: `/uploads/${fileName}`,
        absolutePath,
      };
    } catch (error) {
      console.error("INVOICE PDF GENERATION FAILED:", error);
      throw new InternalServerErrorException(
        "Failed to generate invoice PDF"
      );
    }
  }
}
