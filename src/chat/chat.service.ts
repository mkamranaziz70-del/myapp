import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";

@Injectable()
export class ChatService {
   
    
  constructor(private prisma: PrismaService) {}

async getMyConversations(userId: string, companyId: string) {
  const conversations = await this.prisma.conversation.findMany({
    where: {
      companyId,
      participants: {
        some: { userId },
      },
    },
    include: {
participants: {
  include: {
    user: {
      select: {
        id: true,
        fullName: true,
        role: true,
          avatarUrl: true, // 🔥 THIS FIXES EVERYTHING

      },
    },
  },
},
      messages: {
        where: {
          NOT: {
            deletedForUsers: { has: userId },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map(c => {
    const me = c.participants.find(p => p.userId === userId);
    const lastReadAt = me?.lastReadAt;

 const unreadCount = c.messages.filter(m =>
  m.senderId !== userId && // 🔥 ONLY OTHER USER
  (!lastReadAt || m.createdAt > lastReadAt)
).length;


    return {
      ...c,
      unreadCount,
      lastMessage: c.messages[0] ?? null,
    };
  });
}



 async getConversationMessages(
  conversationId: string,
  userId: string
) {
  const participant =
    await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

  if (!participant) {
    throw new ForbiddenException(
      "Not a participant of this conversation"
    );
  }

  return this.prisma.message.findMany({
    where: {
      conversationId,

      // 🔥 DELETE FOR ME FILTER
      NOT: {
        deletedForUsers: {
          has: userId, // 👈 jo user ne delete-for-me kiya
        },
      },
    },

    orderBy: { createdAt: "asc" },

    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });
}



async deleteConversations(
  conversationIds: string[],
  userId: string,
  companyId: string
) {
  if (!conversationIds.length) return { deleted: 0 };

  // 🔒 only conversations user participates in
  const allowed = await this.prisma.conversation.findMany({
    where: {
      id: { in: conversationIds },
      companyId,
      participants: {
        some: { userId },
      },
    },
    select: { id: true },
  });

  const allowedIds = allowed.map(c => c.id);

  if (!allowedIds.length) {
    return { deleted: 0 };
  }

  // 🔥 transactional delete (safe)
  await this.prisma.$transaction([
    this.prisma.message.deleteMany({
      where: {
        conversationId: { in: allowedIds },
      },
    }),

    this.prisma.conversationParticipant.deleteMany({
      where: {
        conversationId: { in: allowedIds },
      },
    }),

    this.prisma.conversation.deleteMany({
      where: {
        id: { in: allowedIds },
      },
    }),
  ]);

  return {
    deleted: allowedIds.length,
  };
}
async getCompanyEmployees(companyId: string) {
  const employees = await this.prisma.employee.findMany({
    where: {
      companyId,
      status: "ACTIVE",
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,  // 🔥 MUST INCLUDE
          role: true,
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  return employees.map((emp: any) => ({
    id: emp.user.id,              // 🔥 USER ID return karo (NOT emp.id)
    fullName: `${emp.firstName} ${emp.lastName}`,
    role: emp.user.role,
    position: emp.position,
    avatarUrl: emp.user.avatarUrl ?? null,  // 🔥 FLAT FIELD
  }));
}


async searchCompanyEmployees(companyId: string, q: string) {
  const employees = await this.prisma.employee.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  return employees.map((emp: any) => ({
    id: emp.id,
    fullName: `${emp.firstName} ${emp.lastName}`,
    role: emp.user?.role,
    position: emp.position,
    avatarUrl: emp.user?.avatarUrl ?? null,
  }));
}




async createConversation(params: {
  companyId: string;
  creatorUserId: string;
  participantUserIds: string[];
  type: "DIRECT" | "GROUP" | "JOB";
  title?: string;
  jobId?: string;
}) {
  const {
    companyId,
    creatorUserId,
    participantUserIds,
    type,
    title,
    jobId,
  } = params;

  // 🔥 DIRECT CHAT DUPLICATE PREVENTION (FINAL)
if (type === "DIRECT" && participantUserIds.length === 1) {
  const otherUserId = participantUserIds[0];

  const existing = await this.prisma.conversation.findFirst({
    where: {
      companyId,
      type: "DIRECT",
      AND: [
        {
          participants: {
            some: { userId: creatorUserId },
          },
        },
        {
          participants: {
            some: { userId: otherUserId },
          },
        },
      ],
    },
  });

  if (existing) {
    return existing; // ✅ SAME CHAT — no duplicate
  }
}


  // ⬇️ create new if not exists
  return this.prisma.$transaction(async tx => {
    const conversation = await tx.conversation.create({
      data: {
        companyId,
        type,
        title,
        jobId,
      },
    });

 await tx.conversationParticipant.createMany({
  data: [
    {
      conversationId: conversation.id,
      userId: creatorUserId,
      role: Role.OWNER,
    },
    ...participantUserIds.map(uid => ({
      conversationId: conversation.id,
      userId: uid,
      role: Role.EMPLOYEE,
    })),
  ],
});

    return conversation;
  });
}

async deleteMessages(params: {
  messageIds: string[];
  userId: string;
  mode: "ME" | "ALL";
}) {
  const { messageIds, userId, mode } = params;

  if (!messageIds.length) {
    return { deleted: 0 };
  }

  const messages = await this.prisma.message.findMany({
    where: { id: { in: messageIds } },
  });

  if (!messages.length) {
    return { deleted: 0 };
  }

  // ============================
  // 🔥 DELETE FOR EVERYONE
  // ============================
  if (mode === "ALL") {
    const allowedIds = messages
      .filter(
        m =>
          m.senderId === userId &&
          Date.now() - m.createdAt.getTime() <
            1000 * 60 * 10
      )
      .map(m => m.id);

    if (!allowedIds.length) {
      return { deleted: 0 };
    }

    await this.prisma.message.updateMany({
      where: { id: { in: allowedIds } },
      data: {
        content: "🚫 This message was deleted",
        deletedForAll: true,
      },
    });

    return { deleted: allowedIds.length };
  }

  // ============================
  // 🧹 DELETE FOR ME (FOREVER)
  // ============================
  await this.prisma.message.updateMany({
    where: { id: { in: messageIds } },
    data: {
      deletedForUsers: {
        push: userId,
      },
    },
  });

  return { deleted: messageIds.length };
}


async sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  deviceTime?: string; // 🔥 ADD THIS
  type?: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
}) {
  const {
    conversationId,
    senderId,
    content,
    deviceTime,
    type,
  } = params;

  const participant =
    await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: senderId,
      },
    });

  if (!participant) {
    throw new ForbiddenException(
      "Not a participant of this conversation"
    );
  }

  const message = await this.prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      type: type ?? "TEXT",

      // 🔒 🔥 THIS IS THE KEY
      deviceTime: deviceTime
        ? new Date(deviceTime)
        : undefined,
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  await this.prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message; // 👈 includes deviceTime
}


  async markAsRead(conversationId: string, userId: string) {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

 async getUnreadCount(userId: string) {
  const rows =
    await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

  let unread = 0;

  for (const row of rows) {
    const lastMessage = row.conversation.messages[0];
    if (!lastMessage) continue;

    // 🔥 ONLY OTHER USER'S MESSAGE
    if (
      lastMessage.senderId !== userId &&
      (!row.lastReadAt ||
        lastMessage.createdAt > row.lastReadAt)
    ) {
      unread++;
    }
  }

  return unread;
}


}
