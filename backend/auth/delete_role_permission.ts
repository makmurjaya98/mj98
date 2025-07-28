import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";

export interface DeleteRolePermissionRequest {
  permissionId: number;
}

export interface DeleteRolePermissionResponse {
  success: boolean;
  message: string;
}

// Deletes a role permission (Owner only).
export const deleteRolePermission = api<DeleteRolePermissionRequest, DeleteRolePermissionResponse>(
  { expose: true, method: "DELETE", path: "/auth/delete-role-permission" },
  async (req) => {
    if (!req.permissionId) {
      throw APIError.invalidArgument("Permission ID is required");
    }

    // Check if permission exists and get role info
    const permission = await authDB.queryRow<{
      id: number;
      role: string;
      feature: string;
    }>`
      SELECT id, role, feature FROM role_permission WHERE id = ${req.permissionId}
    `;

    if (!permission) {
      throw APIError.notFound("Permission not found");
    }

    // Prevent deletion of Owner permissions
    if (permission.role === "Owner") {
      throw APIError.invalidArgument("Cannot delete Owner permissions");
    }

    try {
      await authDB.exec`
        DELETE FROM role_permission WHERE id = ${req.permissionId}
      `;

      return {
        success: true,
        message: `Successfully deleted permission for ${permission.role} on ${permission.feature}`,
      };
    } catch (error) {
      throw error;
    }
  }
);
