import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Your BoxxPilot Verification Code',
    html: `
      <h2>Verify your email</h2>
      <p>Your BoxxPilot verification code is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
    `,
  });
}
