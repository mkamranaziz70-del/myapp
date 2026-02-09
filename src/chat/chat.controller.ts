import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "../auth/jwt.guard";
import { ChatService } from "./chat.service";

@Controller("chat")
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ===============================
  // 📥 INBOX
  // ===============================
  @Get("inbox")
  inbox(@Req() req: any) {
    return this.chatService.getMyConversations(
      req.user.id,          // ✅ consistent
      req.user.companyId
    );
  }

  // ===============================
  // 👥 EMPLOYEES (search optional)
  // ===============================
  @Get("employees")
  getEmployees(
    @Req() req: any,
    @Query("q") q?: string
  ) {
    if (q) {
      return this.chatService.searchCompanyEmployees(
        req.user.companyId,
        q
      );
    }

    return this.chatService.getCompanyEmployees(
      req.user.companyId
    );
  }

  // ===============================
  // 💬 GET CONVERSATION MESSAGES
  // ===============================
  @Get("conversations/:id")
  messages(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.chatService.getConversationMessages(
      id,
      req.user.id
    );
  }

  // ===============================
  // 📨 CREATE CONVERSATION
  // ===============================
  @Post("conversations")
  createConversation(
    @Req() req: any,
    @Body()
    body: {
      title?: string;
      type: "DIRECT" | "GROUP" | "JOB";
      participantUserIds: string[];
      jobId?: string;
    }
  ) {
    return this.chatService.createConversation({
      companyId: req.user.companyId,
      creatorUserId: req.user.id,
      participantUserIds: body.participantUserIds,
      type: body.type,
      title: body.title,
      jobId: body.jobId,
    });
  }

  // ===============================
  // 🗑️ DELETE CONVERSATIONS
  // ===============================
  @Delete("conversations")
  deleteConversations(
    @Req() req: any,
    @Body()
    body: { ids: string[] }
  ) {
    return this.chatService.deleteConversations(
      body.ids,
      req.user.id,
      req.user.companyId
    );
  }

  // ===============================
  // 🧹 DELETE MESSAGES (ME / ALL)
  // ===============================
  @Post("messages/delete")
  deleteMessages(
    @Req() req: any,
    @Body()
    body: {
      ids: string[];
      mode: "ME" | "ALL";
    }
  ) {
    return this.chatService.deleteMessages({
      messageIds: body.ids,
      userId: req.user.id,
      mode: body.mode,
    });
  }

  // ===============================
  // 📩 SEND MESSAGE
  // ===============================
  @Post("conversations/:id/messages")
  sendMessage(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      content: string;
      deviceTime?: string;
      type?: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
    }
  ) {
    return this.chatService.sendMessage({
      conversationId: id,
      senderId: req.user.id,
      content: body.content,
      deviceTime: body.deviceTime, // ✅ pass-through
      type: body.type,
    });
  }

  // ===============================
  // 👁️ MARK AS READ
  // ===============================
  @Post("conversations/:id/read")
  markRead(
    @Req() req: any,
    @Param("id") id: string
  ) {
    return this.chatService.markAsRead(
      id,
      req.user.id
    );
  }

  // ===============================
  // 🔔 UNREAD COUNT
  // ===============================
  @Get("unread-count")
  unread(@Req() req: any) {
    return this.chatService.getUnreadCount(
      req.user.id
    );
  }
}
