import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface AdminUser {
  id: number;
  fullName: string;
  username: string;
  email: string;
}

export interface GetAdminsResponse {
  admins: AdminUser[];
}

// Retrieves a list of all Admin users.
export const getAdmins = api<void, GetAdminsResponse>(
  { expose: true, method: "GET", path: "/owner/admins" },
  async () => {
    const admins: AdminUser[] = [];
    const adminRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      email: string;
    }>`
      SELECT id, full_name, username, email
      FROM users
      WHERE role = 'Admin'
      ORDER BY full_name
    `;
    for await (const row of adminRows) {
      admins.push({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        email: row.email,
      });
    }
    return { admins };
  }
);
