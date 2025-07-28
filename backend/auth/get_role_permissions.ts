import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "./db";

export interface GetRolePermissionsRequest {
  role?: Query<string>;
}

export interface RolePermission {
  id: number;
  role: string;
  feature: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionsResponse {
  permissions: RolePermission[];
}

// Retrieves role permissions for access control.
export const getRolePermissions = api<GetRolePermissionsRequest, RolePermissionsResponse>(
  { expose: true, method: "GET", path: "/auth/role-permissions" },
  async (req) => {
    let whereClause = "";
    const params: any[] = [];

    if (req.role) {
      whereClause = "WHERE role = $1";
      params.push(req.role);
    }

    const permissions: RolePermission[] = [];
    const permissionRows = authDB.rawQuery<{
      id: number;
      role: string;
      feature: string;
      can_view: boolean;
      can_edit: boolean;
      can_delete: boolean;
      created_at: Date;
      updated_at: Date;
    }>(`
      SELECT id, role, feature, can_view, can_edit, can_delete, created_at, updated_at
      FROM role_permission
      ${whereClause}
      ORDER BY role, feature
    `, ...params);

    for await (const row of permissionRows) {
      permissions.push({
        id: row.id,
        role: row.role,
        feature: row.feature,
        canView: row.can_view,
        canEdit: row.can_edit,
        canDelete: row.can_delete,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return { permissions };
  }
);
