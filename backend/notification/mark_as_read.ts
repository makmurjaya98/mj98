import { api, APIError } from "encore.dev/api";
import { db } from "./db";

export interface MarkAsReadRequest {
  userId: number;
  notificationId?: number; // If not provided, mark all as read
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
}

// Marks notifications as read for a user.
export const markAsRead = api<MarkAsReadRequest, MarkAsReadResponse>(
  { expose: true, method: "POST", path: "/notifications/mark-as-read" },
  async (req) => {
    if (!req.userId) {
      throw APIError.invalidArgument("User ID is required");
    }

    try {
      if (req.notificationId) {
        // Mark a single notification as read
        await db.exec`
          UPDATE notifications
          SET is_read = true
          WHERE id = ${req.notificationId} AND user_id = ${req.userId}
        `;
      } else {
        // Mark all notifications for the user as read
        await db.exec`
          UPDATE notifications
          SET is_read = true
          WHERE user_id = ${req.userId} AND is_read = false
        `;
      }

      return {
        success: true,
        message: "Notifications marked as read.",
      };
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      throw APIError.internal("Failed to update notifications");
    }
  }
);
