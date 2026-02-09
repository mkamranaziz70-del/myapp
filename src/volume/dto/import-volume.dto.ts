import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsString,
} from "class-validator";

/**
 * Import volume calculation from previous source
 */
export class ImportVolumeDto {
  /**
   * Source quotation ID
   * (jis se volume import karna hai)
   */
  @IsUUID()
  sourceQuotationId: string;

  /**
   * Target quotation ID
   * (jis quotation me apply hoga)
   */
  @IsUUID()
  targetQuotationId: string;

  /**
   * Copy inventory items as well
   * default = true
   */
  @IsOptional()
  @IsBoolean()
  includeInventory?: boolean = true;

  /**
   * Copy inventory notes
   */
  @IsOptional()
  @IsBoolean()
  includeNotes?: boolean = true;

  /**
   * Optional reason / reference
   * (audit / logs ke liye)
   */
  @IsOptional()
  @IsString()
  reason?: string;
}
