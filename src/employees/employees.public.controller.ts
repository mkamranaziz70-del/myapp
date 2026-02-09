import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
} from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import express from "express";

@Controller("employee")
export class EmployeesPublicController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get("set-password/:token")
  showSetPassword(
    @Param("token") token: string,
    @Res() res: express.Response
  ) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Set Password – BoxxPilot</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="
          font-family:Arial, sans-serif;
          background:#f9fafb;
          display:flex;
          justify-content:center;
          align-items:center;
          height:100vh;
          margin:0
        ">
          <form method="POST" action="/employee/set-password"
            style="
              background:white;
              padding:32px;
              border-radius:14px;
              box-shadow:0 12px 30px rgba(0,0,0,.08);
              width:340px
            ">

            <h2 style="text-align:center;margin-bottom:8px">
              Set your password
            </h2>

            <p style="
              text-align:center;
              color:#6b7280;
              font-size:13px;
              margin-bottom:18px
            ">
              Minimum 8 characters, uppercase, lowercase, number & symbol
            </p>

            <input type="hidden" name="token" value="${token}" />

            <input
              type="password"
              name="password"
              placeholder="Strong password"
              required
              minlength="8"
              style="
                padding:12px;
                width:100%;
                margin-bottom:16px;
                border-radius:8px;
                border:1px solid #d1d5db;
                font-size:14px
              "
            />

            <button type="submit"
              style="
                padding:12px;
                width:100%;
                background:#10b981;
                color:white;
                border:none;
                border-radius:10px;
                font-weight:700;
                font-size:14px;
                cursor:pointer
              ">
              Save Password
            </button>
          </form>
        </body>
      </html>
    `);
  }
  @Post("set-password")
  async setPassword(
    @Body() body: { token: string; password: string },
    @Res() res: express.Response
  ) {
    try {
      const strong =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

      if (!strong.test(body.password)) {
        return res.send(`
          <html>
            <body style="
              font-family:Arial;
              background:#f9fafb;
              display:flex;
              justify-content:center;
              align-items:center;
              height:100vh
            ">
              <div style="
                background:white;
                padding:32px;
                border-radius:14px;
                text-align:center;
                box-shadow:0 12px 30px rgba(0,0,0,.08);
                width:360px
              ">
                <h2 style="color:#dc2626"> Weak Password</h2>
                <p style="color:#374151">
                  Password must contain at least:
                </p>
                <ul style="text-align:left;color:#6b7280;font-size:14px">
                  <li>8 characters</li>
                  <li>1 uppercase letter</li>
                  <li>1 lowercase letter</li>
                  <li>1 number</li>
                  <li>1 special character</li>
                </ul>
              </div>
            </body>
          </html>
        `);
      }

      await this.employeesService.setPassword(
        body.token,
        body.password
      );

      return res.send(`
        <html>
          <head>
            <title>Password Set – BoxxPilot</title>
          </head>
          <body style="
            font-family:Arial;
            background:#f9fafb;
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh
          ">
            <div style="
              background:white;
              padding:40px;
              border-radius:14px;
              text-align:center;
              box-shadow:0 12px 30px rgba(0,0,0,.08);
              width:360px
            ">
              <h2 style="color:#10b981"> Password Set Successfully</h2>

              <p style="color:#374151;margin-top:14px">
                Your password has been saved.
              </p>

              <p style="color:#6b7280;margin-top:6px">
                You can now open the BoxxPilot app and log in.
              </p>
            </div>
          </body>
        </html>
      `);
    } catch {
      return res.send(`
        <html>
          <body style="
            font-family:Arial;
            background:#f9fafb;
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh
          ">
            <div style="
              background:white;
              padding:32px;
              border-radius:14px;
              text-align:center;
              box-shadow:0 12px 30px rgba(0,0,0,.08);
              width:360px
            ">
              <h2 style="color:#dc2626"> Failed to set password</h2>
              <p style="color:#6b7280">
                This link may be invalid or expired.
              </p>
            </div>
          </body>
        </html>
      `);
    }
  }
  @Get("confirm/:token")
  async confirmEmployee(
    @Param("token") token: string,
    @Res() res: express.Response
  ) {
    try {
      const employee =
        await this.employeesService.confirmEmployee(token);

      const passwordLink =
        `${process.env.APP_PUBLIC_URL}/employee/set-password/${employee.passwordToken}`;

      await this.employeesService.sendPasswordSetupEmail(
        employee.email,
        `${employee.firstName} ${employee.lastName}`,
        passwordLink
      );

      return res.send(`
        <html>
          <body style="
            font-family:Arial;
            text-align:center;
            padding:40px;
            background:#f9fafb
          ">
            <h2 style="color:#10b981">Account Verified</h2>
            <p>Please check your email to set your password.</p>
          </body>
        </html>
      `);
    } catch {
      return res.send(`
        <html>
          <body style="
            font-family:Arial;
            text-align:center;
            padding:40px;
            background:#f9fafb
          ">
            <h2 style="color:#dc2626"> Invalid or expired link</h2>
          </body>
        </html>
      `);
    }
  }
}
