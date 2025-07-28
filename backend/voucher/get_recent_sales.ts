import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface SaleRecord {
  id: number;
  voucherType: string;
  quantitySold: number;
  linkId: number;
  linkName: string;
  linkUsername: string;
  cabangId: number;
  cabangName: string;
  mitraCabangId: number;
  mitraCabangName: string;
  createdAt: Date;
  feeLink: number;
  feeCabang: number;
  komisiMitra: number;
  pendapatanOwner: number;
  totalPendapatanLink: number;
  totalPendapatanCabang: number;
}

export interface RecentSalesResponse {
  sales: SaleRecord[];
}

// Retrieves recent voucher sales records.
export const getRecentSales = api<void, RecentSalesResponse>(
  { expose: true, method: "GET", path: "/voucher/recent-sales" },
  async () => {
    const sales: SaleRecord[] = [];
    const salesRows = authDB.query<{
      id: number;
      voucher_type: string;
      quantity_sold: number;
      link_id: number;
      link_name: string;
      link_username: string;
      cabang_id: number;
      cabang_name: string;
      mitra_cabang_id: number;
      mitra_cabang_name: string;
      created_at: Date;
      fee_link: number;
      fee_cabang: number;
      komisi_mitra: number;
      pendapatan_owner: number;
      total_pendapatan_link: number;
      total_pendapatan_cabang: number;
    }>`
      SELECT 
        vs.id,
        vs.voucher_type,
        vs.quantity_sold,
        vs.link_id,
        l.full_name as link_name,
        l.username as link_username,
        vs.cabang_id,
        c.full_name as cabang_name,
        vs.mitra_cabang_id,
        m.full_name as mitra_cabang_name,
        vs.created_at,
        COALESCE(vs.fee_link, 0) as fee_link,
        COALESCE(vs.fee_cabang, 0) as fee_cabang,
        COALESCE(vs.komisi_mitra, 0) as komisi_mitra,
        COALESCE(vs.pendapatan_owner, 0) as pendapatan_owner,
        COALESCE(vs.total_pendapatan_link, 0) as total_pendapatan_link,
        COALESCE(vs.total_pendapatan_cabang, 0) as total_pendapatan_cabang
      FROM voucher_sales vs
      JOIN users l ON vs.link_id = l.id
      JOIN users c ON vs.cabang_id = c.id
      JOIN users m ON vs.mitra_cabang_id = m.id
      ORDER BY vs.created_at DESC
      LIMIT 50
    `;

    for await (const row of salesRows) {
      sales.push({
        id: row.id,
        voucherType: row.voucher_type,
        quantitySold: row.quantity_sold,
        linkId: row.link_id,
        linkName: row.link_name,
        linkUsername: row.link_username,
        cabangId: row.cabang_id,
        cabangName: row.cabang_name,
        mitraCabangId: row.mitra_cabang_id,
        mitraCabangName: row.mitra_cabang_name,
        createdAt: row.created_at,
        feeLink: row.fee_link,
        feeCabang: row.fee_cabang,
        komisiMitra: row.komisi_mitra,
        pendapatanOwner: row.pendapatan_owner,
        totalPendapatanLink: row.total_pendapatan_link,
        totalPendapatanCabang: row.total_pendapatan_cabang,
      });
    }

    return { sales };
  }
);
