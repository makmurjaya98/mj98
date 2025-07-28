import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { getAdminsAndOwner } from "../auth/get_admins_and_owner";
import { notification } from "~encore/clients";

export interface ClaimKuponRequest {
  kuponId: number;
  userId: number;
  role: string;
  jumlahPenjualan: number;
}

export interface ClaimKuponResponse {
  success: boolean;
  message: string;
  klaimId: number;
}

// Allows a user to submit a claim for a gift coupon reward.
export const claimKupon = api<ClaimKuponRequest, ClaimKuponResponse>(
  { expose: true, method: "POST", path: "/voucher/claim-kupon" },
  async (req) => {
    if (!req.kuponId || !req.userId || !req.role || req.jumlahPenjualan === undefined) {
      throw APIError.invalidArgument("Kupon ID, User ID, Role, and Jumlah Penjualan are required");
    }

    // Verify kupon exists and is active
    const kuponDetails = await authDB.queryRow<{
      id: number;
      nama: string;
      target_role: string;
      minimal_penjualan: number;
      periode_mulai: Date;
      periode_berakhir: Date;
      jumlah_pemenang: number;
      hadiah: string;
      status: string;
    }>`
      SELECT id, nama, target_role, minimal_penjualan, periode_mulai, periode_berakhir, jumlah_pemenang, hadiah, status
      FROM kupon_hadiah WHERE id = ${req.kuponId} AND status = 'aktif'
    `;

    if (!kuponDetails) {
      throw APIError.failedPrecondition("Coupon is not active or does not exist.");
    }

    if (kuponDetails.target_role !== req.role) {
      throw APIError.permissionDenied("Your role does not match the target role for this coupon.");
    }

    // Check if user already claimed this kupon
    const existingKlaim = await authDB.queryRow<{ id: number }>`
      SELECT id FROM klaim_kupon WHERE kupon_id = ${req.kuponId} AND user_id = ${req.userId}
    `;
    if (existingKlaim) {
      throw APIError.alreadyExists("You have already submitted a claim for this coupon.");
    }

    // Re-verify user's rank to ensure eligibility and determine the prize
    const endOfPeriod = new Date(kuponDetails.periode_berakhir);
    endOfPeriod.setHours(23, 59, 59, 999);

    const salesQuery = `
      WITH ranked_sales AS (
        SELECT 
          u.id as user_id,
          COALESCE(SUM(vs.quantity_sold), 0) as total_penjualan,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(vs.quantity_sold), 0) DESC) as posisi
        FROM users u
        LEFT JOIN voucher_sales vs ON (
          (u.role = 'Link' AND vs.link_id = u.id) OR
          (u.role = 'Cabang' AND vs.cabang_id = u.id) OR
          (u.role = 'Mitra Cabang' AND vs.mitra_cabang_id = u.id)
        ) AND vs.created_at >= $1 AND vs.created_at <= $2
        WHERE u.role = $3
        GROUP BY u.id
        HAVING COALESCE(SUM(vs.quantity_sold), 0) >= $4
      )
      SELECT * FROM ranked_sales WHERE user_id = $5
    `;

    const userRank = await authDB.rawQueryRow<{
        user_id: number;
        total_penjualan: number;
        posisi: number;
    }>(salesQuery, kuponDetails.periode_mulai, endOfPeriod, kuponDetails.target_role, kuponDetails.minimal_penjualan, req.userId);

    if (!userRank || userRank.posisi > kuponDetails.jumlah_pemenang) {
        throw APIError.failedPrecondition("You are not eligible to claim this reward.");
    }

    const hadiahList = JSON.parse(kuponDetails.hadiah) as Array<{ posisi: number; hadiah: string }>;
    const prize = hadiahList.find(h => h.posisi === userRank.posisi)?.hadiah;

    if (!prize) {
        throw APIError.internal("Could not determine prize for your position.");
    }

    const klaimResult = await authDB.queryRow<{ id: number }>`
      INSERT INTO klaim_kupon (kupon_id, user_id, posisi_pemenang, hadiah_diterima, status, role, jumlah_penjualan)
      VALUES (${req.kuponId}, ${req.userId}, ${userRank.posisi}, ${prize}, 'menunggu', ${req.role}, ${userRank.total_penjualan})
      RETURNING id
    `;

    if (!klaimResult) {
      throw APIError.internal("Failed to submit claim.");
    }

    // Notify admins and owner
    const adminIds = await getAdminsAndOwner();
    const user = await authDB.queryRow<{ full_name: string }>`SELECT full_name FROM users WHERE id = ${req.userId}`;
    for (const adminId of adminIds) {
      await notification.send({
        userId: adminId,
        title: "New Coupon Claim",
        message: `${user?.full_name || 'A user'} has claimed a reward for the coupon "${kuponDetails.nama}".`,
        type: "info",
        linkUrl: "/admin/kupon-approval",
      });
    }

    return {
      success: true,
      message: `Claim submitted successfully for coupon '${kuponDetails.nama}'. Your claim is pending approval.`,
      klaimId: klaimResult.id,
    };
  }
);
