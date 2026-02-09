import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtGuard } from '../auth/auth1/jwt.guard'; 
import { Param } from '@nestjs/common';

@Controller('customers')
@UseGuards(JwtGuard) 
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Req() req, @Body() body) {
    return this.customersService.create(req.user.companyId, body);
  }

  @Get()
  findAll(@Req() req) {
    return this.customersService.findAll(req.user.companyId);
  }

  @Get(':id')
findOne(@Req() req, @Param('id') id: string) {
  return this.customersService.findOne(req.user.companyId, id);
}

}
