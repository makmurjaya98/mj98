import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import * as XLSX from 'xlsx';

export interface ExportMitraReportRequest {
  mitraId: number;
  startDate: string;
  endDate: string;
}

export interface ExportMitraReportResponse {
  fileContent: string; // base64 encoded
  fileName: string;
}

// Generates a detailed Excel report for a specific Mitra Cabang.
export const reportByMitra = api<ExportMitraReportRequest, ExportMitraReportResponse>(
  { expose: true, method: "POST", path: "/export/report-by-mitra" },
  async (req) => {
    if (!req.mitraId) {
      throw APIError.invalidArgument("Mitra ID is required.");
    }
    if (!req.startDate || !req.endDate) {
      throw APIError.invalidArgument("Start and End date are required.");
    }

    const mitraUser = await authDB.queryRow<{ username: string, full_name: string }>`
      SELECT username, full_name FROM users WHERE id = ${req.mitraId} AND role = 'Mitra Cabang'
    `;
    if (!mitraUser) {
      throw APIError.notFound("Mitra Cabang user not found.");
    }

    const wb = XLSX.utils.book_new();

    // --- Data Fetching ---
    const mitraCommission = await getMitraCommission(req.mitraId, req.startDate, req.endDate);
    const cabangRevenue = await getCabangRevenue(req.mitraId, req.startDate, req.endDate);
    const linkRevenue = await getLinkRevenue(req.mitraId, req.startDate, req.endDate);

    // --- Summary Sheet ---
    const totalCabangRevenue = cabangRevenue.reduce((sum, item) => sum + item['Total Pendapatan'], 0);
    const totalLinkRevenue = linkRevenue.reduce((sum, item) => sum + item['Total Pendapatan'], 0);
    const summary = [
      { A: "Laporan untuk Mitra Cabang", B: mitraUser.full_name },
      { A: "Periode", B: `${req.startDate} to ${req.endDate}` },
      {},
      { A: "Total Komisi Mitra", B: mitraCommission },
      { A: "Total Pendapatan Seluruh Cabang", B: totalCabangRevenue },
      { A: "Total Pendapatan Seluruh Link", B: totalLinkRevenue },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summary, { skipHeader: true });
    XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

    // --- Mitra Commission Sheet ---
    const mitraWs = XLSX.utils.json_to_sheet([{ "Total Komisi Mitra Cabang": mitraCommission }]);
    XLSX.utils.book_append_sheet(wb, mitraWs, "Komisi Mitra");

    // --- Cabang Revenue Sheet ---
    if (cabangRevenue.length > 0) {
      const cabangWs = XLSX.utils.json_to_sheet(cabangRevenue);
      XLSX.utils.book_append_sheet(wb, cabangWs, "Pendapatan Cabang");
    }

    // --- Link Revenue Sheet ---
    if (linkRevenue.length > 0) {
      const linkWs = XLSX.utils.json_to_sheet(linkRevenue);
      XLSX.utils.book_append_sheet(wb, linkWs, "Pendapatan Link");
    }

    const fileContent = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const fileName = `laporan_mitra_${mitraUser.username}_${req.startDate}_sampai_${req.endDate}.xlsx`;

    return { fileContent, fileName };
  }
);

async function getMitraCommission(mitraId: number, startDate: string, endDate: string) {
  const result = await authDB.rawQueryRow<{ total_komisi: number }>(`
    SELECT SUM(komisi_mitra) as total_komisi
    FROM voucher_sales
    WHERE mitra_cabang_id = $1 AND created_at BETWEEN $2 AND $3
  `, mitraId, startDate, endDate);
  return result?.total_komisi || 0;
}

async function getCabangRevenue(mitraId: number, startDate: string, endDate: string) {
  const rows = await authDB.rawQueryAll<{
    cabang_name: string;
    total_pendapatan: number;
  }>(`
    SELECT 
      c.full_name as cabang_name,
      SUM(vs.total_pendapatan_cabang) as total_pendapatan
    FROM voucher_sales vs
    JOIN users c ON vs.cabang_id = c.id
    WHERE vs.mitra_cabang_id = $1 AND vs.created_at BETWEEN $2 AND $3
    GROUP BY c.full_name
    ORDER BY total_pendapatan DESC
  `, mitraId, startDate, endDate);
  return rows.map(row => ({
    "Nama Cabang": row.cabang_name,
    "Total Pendapatan": row.total_pendapatan,
  }));
}

async function getLinkRevenue(mitraId: number, startDate: string, endDate: string) {
  const rows = await authDB.rawQueryAll<{
    link_name: string;
    cabang_name: string;
    total_pendapatan: number;
  }>(`
    SELECT 
      l.full_name as link_name,
      c.full_name as cabang_name,
      SUM(vs.total_pendapatan_link) as total_pendapatan
    FROM voucher_sales vs
    JOIN users l ON vs.link_id = l.id
    JOIN users c ON vs.cabang_id = c.id
    WHERE vs.mitra_cabang_id = $1 AND vs.created_at BETWEEN $2 AND $3
    GROUP BY l.full_name, c.full_name
    ORDER BY total_pendapatan DESC
  `, mitraId, startDate, endDate);
  return rows.map(row => ({
    "Nama Link": row.link_name,
    "Parent Cabang": row.cabang_name,
    "Total Pendapatan": row.total_pendapatan,
  }));
}
