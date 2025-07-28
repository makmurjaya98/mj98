import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import * as XLSX from 'xlsx';

export interface ExportLinkReportRequest {
  startDate: string;
  endDate: string;
  linkId: number;
}

export interface ExportLinkReportResponse {
  fileContent: string; // base64 encoded
  fileName: string;
}

// Generates an Excel report for a specific Link.
export const reportByLink = api<ExportLinkReportRequest, ExportLinkReportResponse>(
  { expose: true, method: "POST", path: "/export/report-by-link" },
  async (req) => {
    if (!req.linkId) {
      throw APIError.invalidArgument("Link ID is required.");
    }
    if (!req.startDate || !req.endDate) {
      throw APIError.invalidArgument("Start and End date are required.");
    }

    const linkUser = await authDB.queryRow<{ username: string, full_name: string }>`
      SELECT username, full_name FROM users WHERE id = ${req.linkId} AND role = 'Link'
    `;
    if (!linkUser) {
      throw APIError.notFound("Link user not found.");
    }

    const wb = XLSX.utils.book_new();

    // --- Data Fetching ---
    const salesData = await getSalesData(req.linkId, req.startDate, req.endDate);
    const stockData = await getStockData(req.linkId);
    const revenueData = await getRevenueData(req.linkId, req.startDate, req.endDate);

    // --- Summary Sheet ---
    const totalSales = salesData.reduce((sum, item) => sum + item['Jumlah Terjual'], 0);
    const totalRevenue = revenueData.reduce((sum, item) => sum + item['Pendapatan Link'], 0);
    const summary = [
      { A: "Laporan untuk", B: linkUser.full_name },
      { A: "Username", B: linkUser.username },
      { A: "Periode", B: `${req.startDate} to ${req.endDate}` },
      {}, // empty row
      { A: "Total Voucher Terjual", B: totalSales },
      { A: "Total Pendapatan Link", B: totalRevenue },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summary, { skipHeader: true });
    XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

    // --- Sales Sheet ---
    if (salesData.length > 0) {
      const salesWs = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, salesWs, "Rincian Penjualan");
    }

    // --- Stock Sheet ---
    if (stockData.length > 0) {
      const stockWs = XLSX.utils.json_to_sheet(stockData);
      XLSX.utils.book_append_sheet(wb, stockWs, "Stok Saat Ini");
    }

    const fileContent = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const fileName = `laporan_link_${linkUser.username}_${req.startDate}_sampai_${req.endDate}.xlsx`;

    return { fileContent, fileName };
  }
);

async function getSalesData(linkId: number, startDate: string, endDate: string) {
  const salesRows = await authDB.rawQueryAll<{
    created_at: Date;
    voucher_type: string;
    quantity_sold: number;
  }>(`
    SELECT created_at, voucher_type, quantity_sold
    FROM voucher_sales
    WHERE link_id = $1 AND created_at BETWEEN $2 AND $3
    ORDER BY created_at DESC
  `, linkId, startDate, endDate);
  return salesRows.map(row => ({
    "Tanggal": row.created_at.toISOString(),
    "Jenis Voucher": row.voucher_type,
    "Jumlah Terjual": row.quantity_sold,
  }));
}

async function getStockData(linkId: number) {
  const stockRows = await authDB.rawQueryAll<{
    voucher_type: string;
    amount: number;
    updated_at: Date;
  }>(`
    SELECT voucher_type, amount, updated_at
    FROM voucher_stocks
    WHERE link_id = $1 AND amount > 0
    ORDER BY voucher_type
  `, linkId);
  return stockRows.map(row => ({
    "Jenis Voucher": row.voucher_type,
    "Stok Tersisa": row.amount,
    "Terakhir Update": row.updated_at.toISOString(),
  }));
}

async function getRevenueData(linkId: number, startDate: string, endDate: string) {
  const revenueRows = await authDB.rawQueryAll<{
    created_at: Date;
    voucher_type: string;
    quantity_sold: number;
    total_pendapatan_link: number;
  }>(`
    SELECT created_at, voucher_type, quantity_sold, total_pendapatan_link
    FROM voucher_sales
    WHERE link_id = $1 AND created_at BETWEEN $2 AND $3
    ORDER BY created_at DESC
  `, linkId, startDate, endDate);
  return revenueRows.map(row => ({
    "Tanggal": row.created_at.toISOString(),
    "Jenis Voucher": row.voucher_type,
    "Jumlah Terjual": row.quantity_sold,
    "Pendapatan Link": row.total_pendapatan_link,
  }));
}
