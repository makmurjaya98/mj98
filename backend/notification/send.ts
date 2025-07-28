import { api, APIError } from "encore.dev/api";
import { db } from "./db";

export interface SendNotificationRequest {
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  linkUrl?: string;
}

// send is an internal API for creating a notification for a specific user.
export const send = api<SendNotificationRequest, void>(
  { expose: false, method: "POST", path: "/notification/send" },
  async (req) => {
    if (!req.userId || !req.title || !req.message || !req.type) {
      throw APIError.invalidArgument("userId, title, message, and type are required");
    }

    try {
      await db.exec`
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (${req.userId}, ${req.title}, ${req.message}, ${req.type}, ${req.linkUrl || null})
      `;
    } catch (error) {
      console.error(`Failed to create notification for user ${req.userId}:`, error);
      // To avoid interrupting the main operation, we don't throw an error here,
      // but in a production system, this should be handled more robustly.
    }
  }
);
