import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface GetKuponPemenangRequest {
  kuponId: Query<number>;
}

export interface PemenangKupon {
  userId: number;
  fullName: string;
  username: string;
  role: string;
  totalPenjualan: number;
  posisi: number;
  hadiah: string;
  statusKlaim: string | null;
}

export interface KuponPemenangResponse {
  kuponInfo: {
    id: number;
    nama: string;
    targetRole: string;
    minimalPenjualan: number;
    periodeMulai: Date;
    periodeBerakhir: Date;
    jumlahPemenang: number;
    status: string;
  };
  pemenangList: PemenangKupon[];
  isActive: boolean;
}

// Retrieves winners for a specific gift coupon based on sales performance.
export const getKuponPemenang = api<GetKuponPemenangRequest, KuponPemenangResponse>(
  { expose: true, method: "GET", path: "/voucher/kupon-pemenang" },
  async (req) => {
    if (!req.kuponId) {
      throw APIError.invalidArgument("Kupon ID is required");
    }

    // Get kupon info
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

    const hadiah = JSON.parse(kuponInfo.hadiah) as Array<{ posisi: number; hadiah: string }>;
    const today = new Date();
    const isActive = kuponInfo.status === 'aktif' && 
                    new Date(kuponInfo.periode_mulai) <= today && 
                    new Date(kuponInfo.periode_berakhir) >= today;

    // Calculate sales performance for the target role during the period
    const salesQuery = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.username,
        u.role,
        COALESCE(SUM(vs.quantity_sold), 0) as total_penjualan
      FROM users u
      LEFT JOIN voucher_sales vs ON (
        (u.role = 'Link' AND vs.link_id = u.id) OR
        (u.role = 'Cabang' AND vs.cabang_id = u.id) OR
        (u.role = 'Mitra Cabang' AND vs.mitra_cabang_id = u.id)
      ) AND vs.created_at >= $1 AND vs.created_at <= $2
      WHERE u.role = $3
      GROUP BY u.id, u.full_name, u.username, u.role
      HAVING COALESCE(SUM(vs.quantity_sold), 0) >= $4
      ORDER BY total_penjualan DESC
      LIMIT $5
    `;

    const endOfPeriod = new Date(kuponInfo.periode_berakhir);
    endOfPeriod.setHours(23, 59, 59, 999);

    const salesRows = authDB.rawQuery<{
      user_id: number;
      full_name: string;
      username: string;
      role: string;
      total_penjualan: number;
    }>(salesQuery, 
      kuponInfo.periode_mulai,
      endOfPeriod,
      kuponInfo.target_role,
      kuponInfo.minimal_penjualan,
      kuponInfo.jumlah_pemenang
    );

    const pemenangList: PemenangKupon[] = [];
    let posisi = 1;

    for await (const row of salesRows) {
      // Get claim status if exists
      const klaimStatus = await authDB.queryRow<{ status: string }>`
        SELECT status FROM klaim_kupon 
        WHERE kupon_id = ${req.kuponId} AND user_id = ${row.user_id}
      `;

      const hadiahForPosition = hadiah.find(h => h.posisi === posisi);

      pemenangList.push({
        userId: row.user_id,
        fullName: row.full_name,
        username: row.username,
        role: row.role,
        totalPenjualan: row.total_penjualan,
        posisi: posisi,
        hadiah: hadiahForPosition?.hadiah || '',
        statusKlaim: klaimStatus?.status || null,
      });

      posisi++;
    }

    return {
      kuponInfo: {
        id: kuponInfo.id,
        nama: kuponInfo.nama,
        targetRole: kuponInfo.target_role,
        minimalPenjualan: kuponInfo.minimal_penjualan,
        periodeMulai: kuponInfo.periode_mulai,
        periodeBerakhir: kuponInfo.periode_berakhir,
        jumlahPemenang: kuponInfo.jumlah_pemenang,
        status: kuponInfo.status,
      },
      pemenangList,
      isActive,
    };
  }
);
