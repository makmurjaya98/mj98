import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { logActivity } from "../auth/log_activity";

export interface SetAdminPermissionRequest {
  performerId: number;
  adminId: number;
  moduleName: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SetAdminPermissionResponse {
  success: boolean;
  message: string;
}

// Sets module permissions for a specific admin.
export const setAdminPermission = api<SetAdminPermissionRequest, SetAdminPermissionResponse>(
  { expose: true, method: "POST", path: "/owner/set-admin-permission" },
  async (req) => {
    if (!req.performerId) {
      throw APIError.invalidArgument("Performer ID is required for logging");
    }
    if (!req.adminId) {
      throw APIError.invalidArgument("Admin ID is required");
    }
    if (!req.moduleName) {
      throw APIError.invalidArgument("Module name is required");
    }

    // Verify the user being granted permission is actually an admin
    const adminUser = await authDB.queryRow`SELECT id FROM users WHERE id = ${req.adminId} AND role = 'Admin'`;
    if (!adminUser) {
      throw APIError.notFound("The specified user is not an admin.");
    }

    try {
      await authDB.exec`
        INSERT INTO admin_permissions (admin_id, module_name, can_view, can_edit, can_delete)
        VALUES (${req.adminId}, ${req.moduleName}, ${req.canView}, ${req.canEdit}, ${req.canDelete})
        ON CONFLICT (admin_id, module_name) DO UPDATE
        SET 
          can_view = EXCLUDED.can_view, 
          can_edit = EXCLUDED.can_edit, 
          can_delete = EXCLUDED.can_delete, 
          updated_at = NOW()
      `;

      const desc = `Permissions for admin ID ${req.adminId} on module '${req.moduleName}' set to: View=${req.canView}, Edit=${req.canEdit}, Delete=${req.canDelete}.`;
      await logActivity({
        userId: req.performerId,
        aksi: "Update Admin Permission",
        deskripsi: desc,
      });

      return {
        success: true,
        message: "Admin permission updated successfully.",
      };
    } catch (error) {
      throw error;
    }
  }
);
