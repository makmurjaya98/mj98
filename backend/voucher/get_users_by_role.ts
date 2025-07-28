import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface GetUsersByRoleRequest {
  role: Query<string>;
}

export interface UserByRole {
  id: number;
  fullName: string;
  username: string;
  role: string;
}

export interface UsersByRoleResponse {
  users: UserByRole[];
}

// Retrieves users by their role for deposit management.
export const getUsersByRole = api<GetUsersByRoleRequest, UsersByRoleResponse>(
  { expose: true, method: "GET", path: "/voucher/users-by-role" },
  async (req) => {
    if (!req.role) {
      throw APIError.invalidArgument("Role parameter is required");
    }

    // Validate role
    const validRoles = ["Link", "Cabang", "Mitra Cabang"];
    if (!validRoles.includes(req.role)) {
      throw APIError.invalidArgument("Invalid role");
    }

    const users: UserByRole[] = [];
    const userRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      role: string;
    }>`
      SELECT id, full_name, username, role
      FROM users
      WHERE role = ${req.role}
      ORDER BY full_name
    `;

    for await (const row of userRows) {
      users.push({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        role: row.role,
      });
    }

    return { users };
  }
);
