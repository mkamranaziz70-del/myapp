import { IsString, IsEnum, IsNumber, IsOptional } from "class-validator";
import { EmployeePosition, EmploymentType } from "@prisma/client";

export class EditEmployeeDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(EmployeePosition)
  position?: EmployeePosition;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;
}
