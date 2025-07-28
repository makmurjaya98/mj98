import { authDB } from "./db";

interface UserInfo {
  username: string;
  role: string;
}

interface LogParams {
  userId?: number | null;
  aksi: string;
  deskripsi: string;
}

// Logs an activity to the database.
export async function logActivity({ userId, aksi, deskripsi }: LogParams): Promise<void> {
  let username: string | null = null;
  let role: string | null = null;

  if (userId) {
    const user = await authDB.queryRow<UserInfo>`
      SELECT username, role FROM users WHERE id = ${userId}
    `;
    if (user) {
      username = user.username;
      role = user.role;
    }
  }

  try {
    await authDB.exec`
      INSERT INTO log_aktivitas (user_id, username, role, aksi, deskripsi)
      VALUES (${userId || null}, ${username || 'System'}, ${role || 'System'}, ${aksi}, ${deskripsi})
    `;
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Fail silently to not interrupt the main operation
  }
}
