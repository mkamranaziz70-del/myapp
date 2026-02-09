import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { RoomType } from "./create-volume.dto";

/**
 * Inventory item update
 */
export class UpdateInventoryItemDto {
  @IsEnum(RoomType)
  room: RoomType;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  /**
   * Volume per single item (CFT)
   */
  @IsNumber()
  @Min(0)
  volumeCft: number;

  /**
   * Optional weight per item (LBS)
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightLbs?: number;
}

/**
 * Update Volume Calculation DTO
 */
export class UpdateVolumeDto {
  /**
   * Quotation ID where volume belongs
   */
  @IsUUID()
  quotationId: string;

  /**
   * Optional inventory overwrite
   * If provided → full recalculation
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInventoryItemDto)
  inventory?: UpdateInventoryItemDto[];

  /**
   * Manual override of total volume (CFT)
   * If provided → calculator is bypassed
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedVolumeCft?: number;

  /**
   * Manual override of weight (LBS)
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedWeightLbs?: number;

  /**
   * Inventory notes
   */
  @IsOptional()
  @IsString()
  inventoryNotes?: string;

  /**
   * Internal reason for update
   * (audit / logs)
   */
  @IsOptional()
  @IsString()
  reason?: string;
}
