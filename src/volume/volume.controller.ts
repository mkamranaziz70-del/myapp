import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { VolumeService } from "./volume.service";
import { CreateVolumeDto } from "./dto/create-volume.dto";

@Controller("volume")
@UseGuards(JwtAuthGuard)
export class VolumeController {
  constructor(private readonly volumeService: VolumeService) {}

  /**
   * 🔢 Calculate volume from inventory (no DB write)
   * Used by Volume Calculator screen
   */
  @Post()
  calculate(
    @Req() req: any,
    @Body() dto: CreateVolumeDto,
  ) {
    return this.volumeService.create(req.user, dto);
  }

  @Post("save")
saveCalculation(
  @Req() req: any,
  @Body() body: any,
) {
  return this.volumeService.save(req.user, body);
}
@Delete(":id")
deleteVolume(
  @Req() req: any,
  @Param("id") id: string,
) {
  return this.volumeService.delete(req.user, id);
}

  /**
   * 📥 Import inventory from an existing quotation
   * Used by "Import Calculation" screen
   */
  @Get("import/:quotationId")
  importFromQuotation(
    @Req() req: any,
    @Param("quotationId") quotationId: string,
  ) {
    return this.volumeService.importPrevious(
      req.user,
      quotationId,
    );
  }

  /**
   * 🕓 Get volume calculation history
   * Used to list previous surveys
   */
  @Get("history")
  getHistory(@Req() req: any) {
    return this.volumeService.getHistory(req.user);
  }

  @Get(":id")
getOne(
  @Req() req: any,
  @Param("id") id: string,
) {
  return this.volumeService.getById(req.user, id);
}

  /**
   * 🔗 Attach inventory & calculated volume to a quotation
   * Called when user presses "Next" in Step 6
   */
  @Post("attach/:quotationId")
  attachToQuotation(
    @Req() req: any,
    @Param("quotationId") quotationId: string,
    @Body("inventory") inventory: any[],
  ) {
    return this.volumeService.attachToQuotation(
      req.user,
      quotationId,
      inventory,
    );
  }
}
