import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface KlaimRecord {
  id: number;
  kuponId: number;
  kuponNama: string;
  userId: number;
  userName: string;
  userUsername: string;
  userRole: string;
  posisiPemenang: number;
  hadiahDiterima: string;
  status: string;
  catatan: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: string | null;
  jumlahPenjualan: number | null;
}

export interface KlaimListResponse {
  klaimList: KlaimRecord[];
}

// Retrieves list of all kupon claims for admin review.
export const getKlaimList = api<void, KlaimListResponse>(
  { expose: true, method: "GET", path: "/voucher/klaim-list" },
  async () => {
    const klaimList: KlaimRecord[] = [];
    const klaimRows = authDB.query<{
      id: number;
      kupon_id: number;
      kupon_nama: string;
      user_id: number;
      user_name: string;
      user_username: string;
      user_role: string;
      posisi_pemenang: number;
      hadiah_diterima: string;
      status: string;
      catatan: string | null;
      created_at: Date;
      updated_at: Date;
      role: string | null;
      jumlah_penjualan: number | null;
    }>`
      SELECT 
        kk.id,
        kk.kupon_id,
        kh.nama as kupon_nama,
        kk.user_id,
        u.full_name as user_name,
        u.username as user_username,
        u.role as user_role,
        kk.posisi_pemenang,
        kk.hadiah_diterima,
        kk.status,
        kk.catatan,
        kk.created_at,
        kk.updated_at,
        kk.role,
        kk.jumlah_penjualan
      FROM klaim_kupon kk
      JOIN kupon_hadiah kh ON kk.kupon_id = kh.id
      JOIN users u ON kk.user_id = u.id
      ORDER BY kk.created_at DESC
    `;

    for await (const row of klaimRows) {
      klaimList.push({
        id: row.id,
        kuponId: row.kupon_id,
        kuponNama: row.kupon_nama,
        userId: row.user_id,
        userName: row.user_name,
        userUsername: row.user_username,
        userRole: row.user_role,
        posisiPemenang: row.posisi_pemenang,
        hadiahDiterima: row.hadiah_diterima,
        status: row.status,
        catatan: row.catatan,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        role: row.role,
        jumlahPenjualan: row.jumlah_penjualan,
      });
    }

    return { klaimList };
  }
);
