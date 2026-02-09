import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationType } from "@prisma/client";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createEmployeeNotification({
    employeeId,
    companyId,
    title,
    message,
    type,
    jobId,
  }: {
    employeeId: string;
    companyId: string;
    title: string;
    message: string;
    type: NotificationType;
    jobId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        employeeId,
        companyId,
        title,
        message,
        type,
        jobId,
      },
    });
  }

  async getEmployeeNotifications(employeeId: string) {
    return this.prisma.notification.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async unreadCount(employeeId: string) {
    return this.prisma.notification.count({
      where: { employeeId, isRead: false },
    });
  }
}
