import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtGuard } from "../auth/auth1/jwt.guard";

@Controller("notifications")
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req: any) {
    if (!req.user?.employeeId) {
      return [];
    }

    return this.service.getEmployeeNotifications(req.user.employeeId);
  }

  @Get("unread-count")
  async unreadCount(@Req() req: any) {
    if (!req.user?.employeeId) {
      return { count: 0 };
    }

    return {
      count: await this.service.unreadCount(req.user.employeeId),
    };
  }

  @Patch(":id/read")
  async markRead(@Param("id") id: string) {
    return this.service.markAsRead(id);
  }
}
