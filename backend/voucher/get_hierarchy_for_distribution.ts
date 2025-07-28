import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface HierarchyUser {
  id: number;
  fullName: string;
  username: string;
  role: string;
  parentId?: number;
}

export interface DistributionHierarchyResponse {
  mitraCabang: HierarchyUser[];
  cabang: HierarchyUser[];
  links: HierarchyUser[];
}

// Retrieves hierarchy data for stock distribution.
export const getHierarchyForDistribution = api<void, DistributionHierarchyResponse>(
  { expose: true, method: "GET", path: "/voucher/hierarchy-distribution" },
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

    // Get all Cabang users with their parent relationships
    const cabangUsers: HierarchyUser[] = [];
    const cabangRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      role: string;
      parent_id: number;
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

    // Get all Link users with their parent relationships
    const linkUsers: HierarchyUser[] = [];
    const linkRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      role: string;
      parent_id: number;
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

    return {
      mitraCabang: mitraCabangUsers,
      cabang: cabangUsers,
      links: linkUsers,
    };
  }
);
