import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { logActivity } from "./log_activity";

export interface SetRolePermissionRequest {
  performerId: number;
  role: string;
  feature: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SetRolePermissionResponse {
  success: boolean;
  message: string;
}

// Sets or updates role permissions (Owner only).
export const setRolePermission = api<SetRolePermissionRequest, SetRolePermissionResponse>(
  { expose: true, method: "POST", path: "/auth/set-role-permission" },
  async (req) => {
    // Validate required fields
    if (!req.performerId) {
      throw APIError.invalidArgument("Performer ID is required for logging");
    }
    if (!req.role.trim()) {
      throw APIError.invalidArgument("Role is required");
    }
    if (!req.feature.trim()) {
      throw APIError.invalidArgument("Feature is required");
    }

    // Validate role
    const validRoles = ["Owner", "Admin", "Mitra Cabang", "Cabang", "Link"];
    if (!validRoles.includes(req.role)) {
      throw APIError.invalidArgument("Invalid role");
    }

    // Validate feature
    const validFeatures = [
      "stok", "penjualan", "laporan", "pengaturan-harga", 
      "penyetoran", "kupon", "hak-akses", "user", "excel-management",
      "user-management", "log-management", "admin-permission-management",
      "export-laporan", "export-link-report", "export-mitra-report", "export-owner-report",
      "export-owner-combined-report", "customer-management", "coupon-management", "top-customer-report"
    ];
    if (!validFeatures.includes(req.feature)) {
      throw APIError.invalidArgument("Invalid feature");
    }

    // Prevent modification of Owner permissions
    if (req.role === "Owner") {
      throw APIError.invalidArgument("Cannot modify Owner permissions");
    }

    try {
      // Check if permission already exists
      const existingPermission = await authDB.queryRow<{ id: number }>`
        SELECT id FROM role_permission 
        WHERE role = ${req.role} AND feature = ${req.feature}
      `;

      if (existingPermission) {
        // Update existing permission
        await authDB.exec`
          UPDATE role_permission 
          SET can_view = ${req.canView}, can_edit = ${req.canEdit}, can_delete = ${req.canDelete}, updated_at = NOW()
          WHERE id = ${existingPermission.id}
        `;
      } else {
        // Create new permission
        await authDB.exec`
          INSERT INTO role_permission (role, feature, can_view, can_edit, can_delete)
          VALUES (${req.role}, ${req.feature}, ${req.canView}, ${req.canEdit}, ${req.canDelete})
        `;
      }

      // Log activity
      const desc = `Permissions for role '${req.role}' on feature '${req.feature}' set to: View=${req.canView}, Edit=${req.canEdit}, Delete=${req.canDelete}.`;
      await logActivity({
        userId: req.performerId,
        aksi: "Update Permission",
        deskripsi: desc,
      });

      return {
        success: true,
        message: `Successfully updated permissions for ${req.role} on ${req.feature}`,
      };
    } catch (error) {
      throw error;
    }
  }
);
