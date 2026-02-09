import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { JwtGuard } from "../auth/auth1/jwt.guard";

@UseGuards(JwtGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /* =====================================================
     GET /invoices
     List all invoices for logged-in company
     ===================================================== */
  @Get()
  async findAll(@Req() req: any) {
    return this.invoicesService.findAll(req.user.companyId);
  }

  /* =====================================================
     GET /invoices/:id
     Get single invoice (company scoped)
     ===================================================== */
  @Get(":id")
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    return this.invoicesService.findOne(id, req.user.companyId);
  }

  /* =====================================================
     GET /invoices/:id/preview
     Generate / return invoice PDF preview
     ===================================================== */
  @Get(":id/preview")
  async preview(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    return this.invoicesService.previewInvoice(
      id,
      req.user.companyId
    );
  }

  /* =====================================================
     POST /invoices/:id/send
     Send invoice (DRAFT → SENT)
     ===================================================== */
  @Post(":id/send")
  async send(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: any
  ) {
    return this.invoicesService.sendInvoice(
      id,
      req.user.companyId
    );
  }

  /* =====================================================
     POST /invoices
     Create invoice (DRAFT)
     ===================================================== */
  @Post()
  async create(
    @Body() dto: CreateInvoiceDto,
    @Req() req: any
  ) {
    return this.invoicesService.create(
      dto,
      req.user.companyId
    );
  }
}
