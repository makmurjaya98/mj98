import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface DepositRecord {
  id: number;
  createdAt: Date;
  kategori: string;
  linkId: number | null;
  linkName: string | null;
  cabangId: number | null;
  cabangName: string | null;
  mitraId: number | null;
  mitraName: string | null;
  jumlah: number;
  keterangan: string | null;
}

export interface DepositHistoryResponse {
  deposits: DepositRecord[];
}

// Retrieves deposit history records.
export const getDepositHistory = api<void, DepositHistoryResponse>(
  { expose: true, method: "GET", path: "/voucher/deposit-history" },
  async () => {
    const deposits: DepositRecord[] = [];
    const depositRows = authDB.query<{
      id: number;
      created_at: Date;
      kategori: string;
      link_id: number | null;
      link_name: string | null;
      cabang_id: number | null;
      cabang_name: string | null;
      mitra_id: number | null;
      mitra_name: string | null;
      jumlah: number;
      keterangan: string | null;
    }>`
      SELECT 
        d.id,
        d.created_at,
        d.kategori,
        d.link_id,
        l.full_name as link_name,
        d.cabang_id,
        c.full_name as cabang_name,
        d.mitra_id,
        m.full_name as mitra_name,
        d.jumlah,
        d.keterangan
      FROM deposit d
      LEFT JOIN users l ON d.link_id = l.id
      LEFT JOIN users c ON d.cabang_id = c.id
      LEFT JOIN users m ON d.mitra_id = m.id
      ORDER BY d.created_at DESC
      LIMIT 100
    `;

    for await (const row of depositRows) {
      deposits.push({
        id: row.id,
        createdAt: row.created_at,
        kategori: row.kategori,
        linkId: row.link_id,
        linkName: row.link_name,
        cabangId: row.cabang_id,
        cabangName: row.cabang_name,
        mitraId: row.mitra_id,
        mitraName: row.mitra_name,
        jumlah: row.jumlah,
        keterangan: row.keterangan,
      });
    }

    return { deposits };
  }
);
