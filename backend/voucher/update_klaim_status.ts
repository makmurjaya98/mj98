import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface UpdateKlaimStatusRequest {
  klaimId: number;
  status: "disetujui" | "ditolak";
  catatan?: string;
}

export interface UpdateKlaimStatusResponse {
  success: boolean;
  message: string;
}

// Updates the status of a kupon claim (approve/reject).
export const updateKlaimStatus = api<UpdateKlaimStatusRequest, UpdateKlaimStatusResponse>(
  { expose: true, method: "POST", path: "/voucher/update-klaim-status" },
  async (req) => {
    if (!req.klaimId) {
      throw APIError.invalidArgument("Klaim ID is required");
    }
    if (!req.status) {
      throw APIError.invalidArgument("Status is required");
    }

    const validStatuses = ["disetujui", "ditolak"];
    if (!validStatuses.includes(req.status)) {
      throw APIError.invalidArgument("Invalid status");
    }

    // Verify klaim exists
    const klaimInfo = await authDB.queryRow<{
      id: number;
      kupon_id: number;
      user_id: number;
      status: string;
    }>`
      SELECT id, kupon_id, user_id, status FROM klaim_kupon WHERE id = ${req.klaimId}
    `;

    if (!klaimInfo) {
      throw APIError.notFound("Klaim not found");
    }

    if (klaimInfo.status !== 'menunggu') {
      throw APIError.failedPrecondition("Klaim has already been processed");
    }

    try {
      // Update klaim status
      await authDB.exec`
        UPDATE klaim_kupon 
        SET status = ${req.status}, catatan = ${req.catatan || null}, updated_at = NOW()
        WHERE id = ${req.klaimId}
      `;

      const statusText = req.status === 'disetujui' ? 'approved' : 'rejected';
      
      return {
        success: true,
        message: `Successfully ${statusText} klaim ID ${req.klaimId}`,
      };
    } catch (error) {
      throw error;
    }
  }
);
