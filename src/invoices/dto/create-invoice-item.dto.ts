import { IsNumber, IsString, Min } from "class-validator";

export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  rate: number;
}
