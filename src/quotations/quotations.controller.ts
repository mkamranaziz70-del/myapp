import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { QuotationsService } from "./quotations.service";

@Controller("quotations")
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(
    private readonly service: QuotationsService
  ) {}

  /* ---------------- CREATE ---------------- */
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.service.createQuote(req.user, body);
  }

  /* ---------------- UPDATE ---------------- */
  @Patch(":id")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any
  ) {
    return this.service.updateQuote(req.user, id, body);
  }

  /* ---------------- SAVE DRAFT ---------------- */
  @Post(":id/save-draft")
  async saveDraft(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.saveDraft(req.user, id);
  }

  /* ---------------- SEND ---------------- */
  @Post(":id/send")
  async send(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.sendQuote(req.user, id);
  }

  /* ---------------- DUPLICATE ---------------- */
  @Post(":id/duplicate")
  async duplicate(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.duplicateQuote(req.user, id);
  }

  /* ---------------- ARCHIVE ---------------- */
  @Post(":id/archive")
  async archive(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.archiveQuote(req.user, id);
  }

  /* ---------------- RENEW ---------------- */
  @Post(":id/renew")
  async renew(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.renewQuote(req.user, id);
  }

  /* ---------------- REMINDER ---------------- */
  @Post(":id/reminder")
  async reminder(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.sendReminder(req.user, id);
  }

  /* ---------------- GET ALL ---------------- */
  @Get()
  async findAll(@Req() req: any) {
    return this.service.getAllQuotes(req.user);
  }

  /* ---------------- GET ONE ---------------- */
  @Get(":id")
  async findOne(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.getQuoteById(req.user, id);
  }

  /* ---------------- DELETE ---------------- */
  @Delete(":id")
  async remove(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.service.deleteQuote(req.user, id);
  }
}
