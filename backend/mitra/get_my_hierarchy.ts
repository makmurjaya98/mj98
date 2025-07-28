import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface GetMyHierarchyRequest {
  mitraId: Query<number>;
}

export interface HierarchyMember {
  id: number;
  fullName: string;
  username: string;
  role: string;
  parentId: number | null;
}

export interface MyHierarchyResponse {
  cabang: HierarchyMember[];
  links: HierarchyMember[];
}

// Retrieves all Cabang and Link users under a specific Mitra Cabang.
export const getMyHierarchy = api<GetMyHierarchyRequest, MyHierarchyResponse>(
  { expose: true, method: "GET", path: "/mitra/my-hierarchy" },
  async (req) => {
    if (!req.mitraId) {
      throw APIError.invalidArgument("Mitra ID is required");
    }

    const cabang: HierarchyMember[] = [];
    const cabangRows = authDB.query<{
      id: number;
      full_name: string;
      username: string;
      role: string;
      parent_id: number | null;
    }>`
      SELECT id, full_name, username, role, parent_id
      FROM users
      WHERE role = 'Cabang' AND parent_id = ${req.mitraId}
      ORDER BY full_name
    `;
    for await (const row of cabangRows) {
      cabang.push({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        role: row.role,
        parentId: row.parent_id,
      });
    }

    const cabangIds = cabang.map(c => c.id);
    const links: HierarchyMember[] = [];
    if (cabangIds.length > 0) {
      const linkRows = authDB.query<{
        id: number;
        full_name: string;
        username: string;
        role: string;
        parent_id: number | null;
      }>`
        SELECT id, full_name, username, role, parent_id
        FROM users
        WHERE role = 'Link' AND parent_id IN (${cabangIds})
        ORDER BY full_name
      `;
      for await (const row of linkRows) {
        links.push({
          id: row.id,
          fullName: row.full_name,
          username: row.username,
          role: row.role,
          parentId: row.parent_id,
        });
      }
    }

    return { cabang, links };
  }
);
