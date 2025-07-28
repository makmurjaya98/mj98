import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface CurrentStockItem {
  id: number;
  voucherType: string;
  amount: number;
  linkId: number;
  linkName: string;
  linkUsername: string;
  cabangId: number;
  cabangName: string;
  mitraCabangId: number;
  mitraCabangName: string;
  updatedAt: Date;
}

export interface CurrentStockResponse {
  stocks: CurrentStockItem[];
}

// Retrieves current stock levels for all vouchers.
export const getCurrentStock = api<void, CurrentStockResponse>(
  { expose: true, method: "GET", path: "/voucher/current-stock" },
  async () => {
    const stocks: CurrentStockItem[] = [];
    const stockRows = authDB.query<{
      id: number;
      voucher_type: string;
      amount: number;
      link_id: number;
      link_name: string;
      link_username: string;
      cabang_id: number;
      cabang_name: string;
      mitra_cabang_id: number;
      mitra_cabang_name: string;
      updated_at: Date;
    }>`
      SELECT 
        vs.id,
        vs.voucher_type,
        vs.amount,
        vs.link_id,
        l.full_name as link_name,
        l.username as link_username,
        vs.cabang_id,
        c.full_name as cabang_name,
        vs.mitra_cabang_id,
        m.full_name as mitra_cabang_name,
        vs.updated_at
      FROM voucher_stocks vs
      JOIN users l ON vs.link_id = l.id
      JOIN users c ON vs.cabang_id = c.id
      JOIN users m ON vs.mitra_cabang_id = m.id
      WHERE vs.amount > 0
      ORDER BY vs.updated_at DESC
    `;

    for await (const row of stockRows) {
      stocks.push({
        id: row.id,
        voucherType: row.voucher_type,
        amount: row.amount,
        linkId: row.link_id,
        linkName: row.link_name,
        linkUsername: row.link_username,
        cabangId: row.cabang_id,
        cabangName: row.cabang_name,
        mitraCabangId: row.mitra_cabang_id,
        mitraCabangName: row.mitra_cabang_name,
        updatedAt: row.updated_at,
      });
    }

    return { stocks };
  }
);
