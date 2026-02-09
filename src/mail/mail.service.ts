import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

interface GenericMailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    path: string;
  }[];
}

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // ================= GENERIC MAIL (✨ NEW) =================
  async sendGenericMail(options: GenericMailOptions) {
    await this.transporter.sendMail({
      from: `"BoxxPilot" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
  }

  // ================= EXISTING METHODS =================
  async sendSetPasswordEmail(email: string, name: string, link: string) {
    await this.transporter.sendMail({
      from: `"BoxxPilot" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Set your BoxxPilot password",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your account is confirmed.</p>
        <a href="${link}">Set Password</a>
      `,
    });
  }

  async sendEmployeePasswordSetup(
    email: string,
    name: string,
    link: string
  ) {
    await this.transporter.sendMail({
      from: `"BoxxPilot" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Set your password – BoxxPilot",
      html: `
        <h2>Hello ${name}</h2>
        <a href="${link}">Set Password</a>
      `,
    });
  }

  async sendEmployeeConfirmation(
    email: string,
    name: string,
    link: string
  ) {
    await this.transporter.sendMail({
      from: `"BoxxPilot" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Confirm your employment – BoxxPilot",
      html: `
        <h2>Welcome ${name}</h2>
        <a href="${link}">Confirm Account</a>
      `,
    });
  }
}
