import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "../auth/auth1/jwt.guard";
import { CompanyService } from "./company.service";

@Controller("company")
@UseGuards(JwtGuard)
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get("me")
  getMyCompany(@Req() req) {
    return this.companyService.getMyCompany(req.user.companyId);
  }
}
