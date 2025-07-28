import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "./db";

export interface ActivityLog {
  id: number;
  timestamp: Date;
  userId: number | null;
  username: string | null;
  role: string | null;
  aksi: string;
  deskripsi: string;
}

export interface GetActivityLogsRequest {
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
}

// Retrieves activity logs for admin review.
export const getActivityLogs = api<GetActivityLogsRequest, ActivityLogsResponse>(
  { expose: true, method: "GET", path: "/auth/activity-logs" },
  async (req) => {
    const limit = req.limit || 50;
    const offset = req.offset || 0;

    const logs: ActivityLog[] = [];
    const logRows = authDB.query<{
      id: number;
      timestamp: Date;
      user_id: number | null;
      username: string | null;
      role: string | null;
      aksi: string;
      deskripsi: string;
    }>`
      SELECT id, timestamp, user_id, username, role, aksi, deskripsi
      FROM log_aktivitas
      ORDER BY timestamp DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    for await (const row of logRows) {
      logs.push({
        id: row.id,
        timestamp: row.timestamp,
        userId: row.user_id,
        username: row.username,
        role: row.role,
        aksi: row.aksi,
        deskripsi: row.deskripsi,
      });
    }

    const totalResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM log_aktivitas
    `;

    return {
      logs,
      total: totalResult?.count || 0,
    };
  }
);
