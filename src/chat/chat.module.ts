import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    PrismaService,
    NotificationsService, 
  ],
  exports: [ChatService],
})
export class ChatModule {}
