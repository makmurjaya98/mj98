import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import * as XLSX from 'xlsx';

export interface ExportReportRequest {
  startDate: string;
  endDate: string;
  mitraId?: number;
  cabangId?: number;
  includeStock: boolean;
  includeSales: boolean;
  includeRevenue: boolean;
}

export interface ExportReportResponse {
  fileContent: string; // base64 encoded
  fileName: string;
}

// Generates an Excel report of stock, sales, and revenue data, with optional hierarchy filters.
export const report = api<ExportReportRequest, ExportReportResponse>(
  { expose: true, method: "POST", path: "/export/report" },
  async (req) => {
    if (!req.includeStock && !req.includeSales && !req.includeRevenue) {
      throw APIError.invalidArgument("At least one report type must be selected.");
    }

    const wb = XLSX.utils.book_new();
    const hierarchyFilter = req.cabangId ? `cabang_${req.cabangId}` : req.mitraId ? `mitra_${req.mitraId}` : 'all';

    if (req.includeStock) {
      const stockData = await getStockData(req.mitraId, req.cabangId);
      const ws = XLSX.utils.json_to_sheet(stockData);
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Stok");
    }

    if (req.includeSales) {
      const salesData = await getSalesData(req.startDate, req.endDate, req.mitraId, req.cabangId);
      const ws = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");
    }

    if (req.includeRevenue) {
      const revenueData = await getRevenueData(req.startDate, req.endDate, req.mitraId, req.cabangId);
      const ws = XLSX.utils.json_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Pendapatan");
    }

    const fileContent = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const fileName = `laporan_MJ98_${hierarchyFilter}_${req.startDate}_sampai_${req.endDate}.xlsx`;

    return { fileContent, fileName };
  }
);

async function getStockData(mitraId?: number, cabangId?: number) {
  let query = `
    SELECT 
      vs.voucher_type, vs.amount, l.full_name as link_name, 
      c.full_name as cabang_name, m.full_name as mitra_cabang_name, vs.updated_at
    FROM voucher_stocks vs
    JOIN users l ON vs.link_id = l.id
    JOIN users c ON vs.cabang_id = c.id
    JOIN users m ON vs.mitra_cabang_id = m.id
    WHERE vs.amount > 0
  `;
  const params: any[] = [];
  if (cabangId) {
    query += ` AND vs.cabang_id = $${params.length + 1}`;
    params.push(cabangId);
  } else if (mitraId) {
    query += ` AND vs.mitra_cabang_id = $${params.length + 1}`;
    params.push(mitraId);
  }
  query += ' ORDER BY vs.updated_at DESC';

  const stockRows = await authDB.rawQueryAll<{
    voucher_type: string;
    amount: number;
    link_name: string;
    cabang_name: string;
    mitra_cabang_name: string;
    updated_at: Date;
  }>(query, ...params);

  return stockRows.map(row => ({
    "Jenis Voucher": row.voucher_type,
    "Stok Tersisa": row.amount,
    "Link": row.link_name,
    "Cabang": row.cabang_name,
    "Mitra Cabang": row.mitra_cabang_name,
    "Terakhir Update": row.updated_at.toISOString(),
  }));
}

async function getSalesData(startDate: string, endDate: string, mitraId?: number, cabangId?: number) {
  let query = `
    SELECT 
      vs.created_at, vs.voucher_type, vs.quantity_sold, l.full_name as link_name,
      c.full_name as cabang_name, m.full_name as mitra_cabang_name
    FROM voucher_sales vs
    JOIN users l ON vs.link_id = l.id
    JOIN users c ON vs.cabang_id = c.id
    JOIN users m ON vs.mitra_cabang_id = m.id
    WHERE vs.created_at BETWEEN $1 AND $2
  `;
  const params: any[] = [startDate, endDate];
  if (cabangId) {
    query += ` AND vs.cabang_id = $${params.length + 1}`;
    params.push(cabangId);
  } else if (mitraId) {
    query += ` AND vs.mitra_cabang_id = $${params.length + 1}`;
    params.push(mitraId);
  }
  query += ' ORDER BY vs.created_at DESC';

  const salesRows = await authDB.rawQueryAll<{
    created_at: Date;
    voucher_type: string;
    quantity_sold: number;
    link_name: string;
    cabang_name: string;
    mitra_cabang_name: string;
  }>(query, ...params);

  return salesRows.map(row => ({
    "Tanggal": row.created_at.toISOString(),
    "Jenis Voucher": row.voucher_type,
    "Jumlah Terjual": row.quantity_sold,
    "Link": row.link_name,
    "Cabang": row.cabang_name,
    "Mitra Cabang": row.mitra_cabang_name,
  }));
}

async function getRevenueData(startDate: string, endDate: string, mitraId?: number, cabangId?: number) {
  let query = `
    SELECT 
      vs.created_at, vs.voucher_type, vs.quantity_sold, l.full_name as link_name,
      c.full_name as cabang_name, m.full_name as mitra_cabang_name,
      vp.harga_pokok, vp.harga_jual,
      vs.total_pendapatan_link, vs.total_pendapatan_cabang, vs.komisi_mitra, vs.pendapatan_owner
    FROM voucher_sales vs
    JOIN users l ON vs.link_id = l.id
    JOIN users c ON vs.cabang_id = c.id
    JOIN users m ON vs.mitra_cabang_id = m.id
    LEFT JOIN voucher_prices vp ON vs.cabang_id = vp.cabang_id AND vs.voucher_type = vp.voucher_type
    WHERE vs.created_at BETWEEN $1 AND $2
  `;
  const params: any[] = [startDate, endDate];
  if (cabangId) {
    query += ` AND vs.cabang_id = $${params.length + 1}`;
    params.push(cabangId);
  } else if (mitraId) {
    query += ` AND vs.mitra_cabang_id = $${params.length + 1}`;
    params.push(mitraId);
  }
  query += ' ORDER BY vs.created_at DESC';

  const revenueRows = await authDB.rawQueryAll<{
    created_at: Date;
    voucher_type: string;
    quantity_sold: number;
    link_name: string;
    cabang_name: string;
    mitra_cabang_name: string;
    harga_pokok: number;
    harga_jual: number;
    total_pendapatan_link: number;
    total_pendapatan_cabang: number;
    komisi_mitra: number;
    pendapatan_owner: number;
  }>(query, ...params);

  return revenueRows.map(row => ({
    "Tanggal": row.created_at.toISOString(),
    "Jenis Voucher": row.voucher_type,
    "Jumlah Terjual": row.quantity_sold,
    "Link": row.link_name,
    "Cabang": row.cabang_name,
    "Mitra Cabang": row.mitra_cabang_name,
    "Harga Pokok": row.harga_pokok,
    "Harga Jual": row.harga_jual,
    "Pendapatan Link": row.total_pendapatan_link,
    "Pendapatan Cabang": row.total_pendapatan_cabang,
    "Komisi Mitra": row.komisi_mitra,
    "Pendapatan Owner": row.pendapatan_owner,
  }));
}
