import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface AdminPermission {
  id: number;
  adminId: number;
  moduleName: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface GetAdminPermissionsResponse {
  permissions: AdminPermission[];
}

// Retrieves all specific permissions set for all admins.
export const getAdminPermissions = api<void, GetAdminPermissionsResponse>(
  { expose: true, method: "GET", path: "/owner/admin-permissions" },
  async () => {
    const permissions: AdminPermission[] = [];
    const rows = authDB.query<{
      id: number;
      admin_id: number;
      module_name: string;
      can_view: boolean;
      can_edit: boolean;
      can_delete: boolean;
    }>`
      SELECT id, admin_id, module_name, can_view, can_edit, can_delete
      FROM admin_permissions
      ORDER BY admin_id, module_name
    `;
    for await (const row of rows) {
      permissions.push({
        id: row.id,
        adminId: row.admin_id,
        moduleName: row.module_name,
        canView: row.can_view,
        canEdit: row.can_edit,
        canDelete: row.can_delete,
      });
    }
    return { permissions };
  }
);
