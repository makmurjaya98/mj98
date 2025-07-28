import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "./db";

export interface GetUserPermissionsRequest {
  userId: Query<number>;
}

export interface UserPermission {
  feature: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserPermissionsResponse {
  role: string;
  permissions: UserPermission[];
}

// Retrieves permissions for a specific user based on their role.
export const getUserPermissions = api<GetUserPermissionsRequest, UserPermissionsResponse>(
  { expose: true, method: "GET", path: "/auth/user-permissions" },
  async (req) => {
    if (!req.userId) {
      throw APIError.invalidArgument("User ID is required");
    }

    // Get user role
    const user = await authDB.queryRow<{ role: string }>`
      SELECT role FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    const permissions: UserPermission[] = [];

    if (user.role === 'Admin') {
      // For Admins, get specific permissions from admin_permissions table
      const adminPermissionRows = authDB.query<{
        module_name: string;
        can_view: boolean;
        can_edit: boolean;
        can_delete: boolean;
      }>`
        SELECT module_name, can_view, can_edit, can_delete
        FROM admin_permissions
        WHERE admin_id = ${req.userId}
      `;

      for await (const row of adminPermissionRows) {
        permissions.push({
          feature: row.module_name,
          canView: row.can_view,
          canEdit: row.can_edit,
          canDelete: row.can_delete,
        });
      }
    } else {
      // For other roles, get permissions from role_permission table
      const rolePermissionRows = authDB.query<{
        feature: string;
        can_view: boolean;
        can_edit: boolean;
        can_delete: boolean;
      }>`
        SELECT feature, can_view, can_edit, can_delete
        FROM role_permission
        WHERE role = ${user.role}
        ORDER BY feature
      `;

      for await (const row of rolePermissionRows) {
        permissions.push({
          feature: row.feature,
          canView: row.can_view,
          canEdit: row.can_edit,
          canDelete: row.can_delete,
        });
      }
    }

    return {
      role: user.role,
      permissions,
    };
  }
);
