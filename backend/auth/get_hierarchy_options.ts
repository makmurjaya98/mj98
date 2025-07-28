import { api } from "encore.dev/api";
import { authDB } from "./db";

export interface HierarchyUser {
  id: number;
  fullName: string;
  username: string;
  role: string;
  parentId?: number | null;
}

export interface HierarchyOptionsResponse {
  mitraCabang: HierarchyUser[];
  cabang: HierarchyUser[];
  links: HierarchyUser[];
  ownerCount: number;
  adminCount: number;
}

// Retrieves hierarchy options for user registration.
export const getHierarchyOptions = api<void, HierarchyOptionsResponse>(
  { expose: true, method: "GET", path: "/auth/hierarchy-options" },
  async () => {
    // Get all Mitra Cabang users
    const mitraCabangUsers: HierarchyUser[] = [];
    const mitraCabangRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      role: string;
    }>`
      SELECT id, full_name, username, role
      FROM users
      WHERE role = 'Mitra Cabang'
      ORDER BY full_name
    `;

    for await (const row of mitraCabangRows) {
      mitraCabangUsers.push({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        role: row.role,
      });
    }

    // Get all Cabang users
    const cabangUsers: HierarchyUser[] = [];
    const cabangRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      role: string;
      parent_id: number | null;
    }>`
      SELECT id, full_name, username, role, parent_id
      FROM users
      WHERE role = 'Cabang'
      ORDER BY full_name
    `;

    for await (const row of cabangRows) {
      cabangUsers.push({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        role: row.role,
        parentId: row.parent_id,
      });
    }

    // Get all Link users
    const linkUsers: HierarchyUser[] = [];
    const linkRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      role: string;
      parent_id: number | null;
    }>`
      SELECT id, full_name, username, role, parent_id
      FROM users
      WHERE role = 'Link'
      ORDER BY full_name
    `;

    for await (const row of linkRows) {
      linkUsers.push({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        role: row.role,
        parentId: row.parent_id,
      });
    }

    // Get owner count
    const ownerCountResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users WHERE role = 'Owner'
    `;

    // Get admin count
    const adminCountResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM users WHERE role = 'Admin'
    `;

    const response = {
      mitraCabang: mitraCabangUsers,
      cabang: cabangUsers,
      links: linkUsers,
      ownerCount: ownerCountResult?.count || 0,
      adminCount: adminCountResult?.count || 0,
    };

    // Add console.log for debugging purposes
    console.log("getHierarchyOptions response:", JSON.stringify(response, null, 2));

    return response;
  }
);
