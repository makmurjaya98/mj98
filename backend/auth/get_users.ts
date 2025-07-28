import { api } from "encore.dev/api";
import { authDB } from "./db";

export interface UserRecord {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  idNumber: string;
  address: string;
  phoneNumber: string;
  parentId: number | null;
  parentName: string | null;
  parentRole: string | null;
  createdAt: Date;
}

export interface UserListResponse {
  users: UserRecord[];
}

// Retrieves a list of all users with their hierarchy details.
export const getUsers = api<void, UserListResponse>(
  { expose: true, method: "GET", path: "/auth/users" },
  async () => {
    const users: UserRecord[] = [];
    const userRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      email: string;
      role: string;
      id_number: string;
      address: string;
      phone_number: string;
      parent_id: number | null;
      parent_name: string | null;
      parent_role: string | null;
      created_at: Date;
    }>`
      SELECT 
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.role,
        u.id_number,
        u.address,
        u.phone_number,
        u.parent_id,
        p.full_name as parent_name,
        p.role as parent_role,
        u.created_at
      FROM users u
      LEFT JOIN users p ON u.parent_id = p.id
      ORDER BY u.created_at DESC
    `;

    for await (const row of userRows) {
      users.push({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        email: row.email,
        role: row.role,
        idNumber: row.id_number,
        address: row.address,
        phoneNumber: row.phone_number,
        parentId: row.parent_id,
        parentName: row.parent_name,
        parentRole: row.parent_role,
        createdAt: row.created_at,
      });
    }

    return { users };
  }
);
