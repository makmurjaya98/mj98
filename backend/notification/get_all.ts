import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { db } from "./db";

export interface GetNotificationsRequest {
  userId: Query<number>;
  limit?: Query<number>;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: Date;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Retrieves notifications for a specific user.
export const getAll = api<GetNotificationsRequest, NotificationsResponse>(
  { expose: true, method: "GET", path: "/notifications" },
  async (req) => {
    if (!req.userId) {
      throw APIError.invalidArgument("User ID is required");
    }

    const limit = req.limit || 20;

    const notifications: Notification[] = [];
    const notificationRows = db.query<{
      id: number;
      title: string;
      message: string;
      type: string;
      is_read: boolean;
      link_url: string | null;
      created_at: Date;
    }>`
      SELECT id, title, message, type, is_read, link_url, created_at
      FROM notifications
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    for await (const row of notificationRows) {
      notifications.push({
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.type,
        isRead: row.is_read,
        linkUrl: row.link_url,
        createdAt: row.created_at,
      });
    }

    const unreadResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ${req.userId} AND is_read = false
    `;

    return {
      notifications,
      unreadCount: unreadResult?.count || 0,
    };
  }
);
