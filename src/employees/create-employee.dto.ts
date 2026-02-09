import {
  IsString,
  IsEmail,
  IsDateString,
  IsEnum,
  IsNumber,
} from "class-validator";
import { EmployeePosition, EmploymentType } from "@prisma/client";

export class CreateEmployeeDto {
  @IsString() firstName: string;
  @IsString() lastName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  sin: string; 

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsDateString()
  hireDate: string;

  @IsEnum(EmployeePosition)
  position: EmployeePosition;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsNumber()
  hourlyRate: number;
}
