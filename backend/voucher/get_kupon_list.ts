import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface KuponHadiah {
  id: number;
  nama: string;
  deskripsi: string | null;
  targetRole: string;
  minimalPenjualan: number;
  periodeMulai: Date;
  periodeBerakhir: Date;
  jumlahPemenang: number;
  hadiah: Array<{ posisi: number; hadiah: string }>;
  status: string;
  createdAt: Date;
}

export interface KuponListResponse {
  kuponList: KuponHadiah[];
}

// Retrieves list of all gift coupons.
export const getKuponList = api<void, KuponListResponse>(
  { expose: true, method: "GET", path: "/voucher/kupon-list" },
  async () => {
    const kuponList: KuponHadiah[] = [];
    const kuponRows = authDB.query<{
      id: number;
      nama: string;
      deskripsi: string | null;
      target_role: string;
      minimal_penjualan: number;
      periode_mulai: Date;
      periode_berakhir: Date;
      jumlah_pemenang: number;
      hadiah: string;
      status: string;
      created_at: Date;
    }>`
      SELECT 
        id, nama, deskripsi, target_role, minimal_penjualan,
        periode_mulai, periode_berakhir, jumlah_pemenang, hadiah, status, created_at
      FROM kupon_hadiah
      ORDER BY created_at DESC
    `;

    for await (const row of kuponRows) {
      kuponList.push({
        id: row.id,
        nama: row.nama,
        deskripsi: row.deskripsi,
        targetRole: row.target_role,
        minimalPenjualan: row.minimal_penjualan,
        periodeMulai: row.periode_mulai,
        periodeBerakhir: row.periode_berakhir,
        jumlahPemenang: row.jumlah_pemenang,
        hadiah: JSON.parse(row.hadiah),
        status: row.status,
        createdAt: row.created_at,
      });
    }

    return { kuponList };
  }
);
