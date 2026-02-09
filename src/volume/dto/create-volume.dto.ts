import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Allowed room types as per BoxxPilot spec
 */
export enum RoomType {
  LIVING_ROOM = "LIVING_ROOM",
  DINING_ROOM = "DINING_ROOM",
  KITCHEN = "KITCHEN",
  MASTER_BEDROOM = "MASTER_BEDROOM",
  KIDS_ROOM = "KIDS_ROOM",
  OFFICE = "OFFICE",
  BATHROOM = "BATHROOM",
  BASEMENT = "BASEMENT",
  GARAGE = "GARAGE",
  OUTDOORS = "OUTDOORS",
  OTHER = "OTHER",
}

/**
 * Single inventory item
 */
export class InventoryItemDto {
  @IsEnum(RoomType)
  room: RoomType;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  /**
   * Volume per single item (CFT)
   * Example: Sofa = 45 cft
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
 * Create Volume Calculation DTO
 */
export class CreateVolumeDto {
  /**
   * Full inventory list (room by room)
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  inventory: InventoryItemDto[];

  /**
   * Optional notes by worker/admin
   */
  @IsOptional()
  @IsString()
  notes?: string;
}
