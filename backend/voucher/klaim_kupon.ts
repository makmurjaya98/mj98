import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface KlaimKuponRequest {
  kuponId: number;
  userId: number;
}

export interface KlaimKuponResponse {
  success: boolean;
  message: string;
  klaimId: number;
}

// Allows a user to claim their gift coupon reward.
export const klaimKupon = api<KlaimKuponRequest, KlaimKuponResponse>(
  { expose: true, method: "POST", path: "/voucher/klaim-kupon" },
  async (req) => {
    if (!req.kuponId || !req.userId) {
      throw APIError.invalidArgument("Kupon ID and User ID are required");
    }

    // Verify kupon exists and is active
    const kuponInfo = await authDB.queryRow<{
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
      SELECT id, nama, target_role, minimal_penjualan, periode_mulai, periode_berakhir, 
             jumlah_pemenang, hadiah, status
      FROM kupon_hadiah
      WHERE id = ${req.kuponId}
    `;

    if (!kuponInfo) {
      throw APIError.notFound("Kupon not found");
    }

    if (kuponInfo.status !== 'aktif') {
      throw APIError.failedPrecondition("Kupon is not active");
    }

    // Check if user already claimed this kupon
    const existingKlaim = await authDB.queryRow<{ id: number }>`
      SELECT id FROM klaim_kupon 
      WHERE kupon_id = ${req.kuponId} AND user_id = ${req.userId}
    `;

    if (existingKlaim) {
      throw APIError.alreadyExists("User has already claimed this kupon");
    }

    // Verify user exists and has correct role
    const user = await authDB.queryRow<{
      id: number;
      full_name: string;
      role: string;
    }>`
      SELECT id, full_name, role FROM users WHERE id = ${req.userId}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    if (user.role !== kuponInfo.target_role) {
      throw APIError.invalidArgument("User role does not match kupon target role");
    }

    // Calculate user's position in the leaderboard
    const endOfPeriod = new Date(kuponInfo.periode_berakhir);
    endOfPeriod.setHours(23, 59, 59, 999);

    const salesQuery = `
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
      ORDER BY total_penjualan DESC
    `;

    const userPosition = await authDB.queryRow<{
      user_id: number;
      total_penjualan: number;
      posisi: number;
    }>(salesQuery + ` OFFSET (SELECT COUNT(*) FROM (${salesQuery}) sub WHERE sub.user_id = ${req.userId}) - 1 LIMIT 1`,
      kuponInfo.periode_mulai,
      endOfPeriod,
      kuponInfo.target_role,
      kuponInfo.minimal_penjualan
    );

    if (!userPosition || userPosition.posisi > kuponInfo.jumlah_pemenang) {
      throw APIError.failedPrecondition("User is not eligible for this kupon (not in top winners or below minimum sales)");
    }

    // Get hadiah for this position
    const hadiah = JSON.parse(kuponInfo.hadiah) as Array<{ posisi: number; hadiah: string }>;
    const hadiahForPosition = hadiah.find(h => h.posisi === userPosition.posisi);

    if (!hadiahForPosition) {
      throw APIError.internal("Hadiah not found for user position");
    }

    try {
      // Create klaim record
      const klaimResult = await authDB.queryRow<{ id: number }>`
        INSERT INTO klaim_kupon (kupon_id, user_id, posisi_pemenang, hadiah_diterima, status)
        VALUES (${req.kuponId}, ${req.userId}, ${userPosition.posisi}, ${hadiahForPosition.hadiah}, 'menunggu')
        RETURNING id
      `;

      if (!klaimResult) {
        throw APIError.internal("Failed to create klaim record");
      }

      return {
        success: true,
        message: `Successfully claimed kupon "${kuponInfo.nama}". Position: ${userPosition.posisi}, Hadiah: ${hadiahForPosition.hadiah}. Status: Menunggu persetujuan admin.`,
        klaimId: klaimResult.id,
      };
    } catch (error) {
      throw error;
    }
  }
);
