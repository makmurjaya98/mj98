import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import * as XLSX from 'xlsx';

export interface ExportOwnerCombinedRequest {
  startDate: string;
  endDate: string;
}

export interface ExportOwnerCombinedResponse {
  fileContent: string; // base64 encoded
  fileName: string;
}

// Generates a comprehensive owner revenue report.
export const reportOwnerCombined = api<ExportOwnerCombinedRequest, ExportOwnerCombinedResponse>(
  { expose: true, method: "POST", path: "/export/report-owner-combined" },
  async (req) => {
    if (!req.startDate || !req.endDate) {
      throw APIError.invalidArgument("Start and End date are required.");
    }

    const query = `
      SELECT 
        vs.created_at,
        vs.voucher_type,
        vs.quantity_sold,
        vp.harga_pokok,
        vs.fee_link,
        vs.fee_cabang,
        vs.komisi_mitra,
        vs.pendapatan_owner
      FROM voucher_sales vs
      LEFT JOIN voucher_prices vp ON vs.cabang_id = vp.cabang_id AND vs.voucher_type = vp.voucher_type
      WHERE vs.created_at BETWEEN $1 AND $2
      ORDER BY vs.created_at DESC
    `;

    const revenueRows = await authDB.rawQueryAll<{
      created_at: Date;
      voucher_type: string;
      quantity_sold: number;
      harga_pokok: number;
      fee_link: number;
      fee_cabang: number;
      komisi_mitra: number;
      pendapatan_owner: number;
    }>(query, req.startDate, req.endDate);

    if (revenueRows.length === 0) {
      throw APIError.notFound("No sales data found for the selected period.");
    }

    const reportData = revenueRows.map(row => ({
      "Tanggal": row.created_at.toISOString().split('T')[0],
      "Jenis Voucher": row.voucher_type,
      "Qty Terjual": row.quantity_sold,
      "Harga Pokok Satuan": row.harga_pokok,
      "Total Harga Pokok": row.harga_pokok * row.quantity_sold,
      "Total Fee Link (Rp)": row.fee_link,
      "Total Fee Cabang (Rp)": row.fee_cabang,
      "Total Komisi Mitra (Rp)": row.komisi_mitra,
      "Pendapatan Bersih Owner (Rp)": row.pendapatan_owner,
    }));

    const totalRevenue = reportData.reduce((sum, item) => sum + item["Pendapatan Bersih Owner (Rp)"], 0);
    const totalHP = reportData.reduce((sum, item) => sum + item["Total Harga Pokok"], 0);
    const totalFeeLink = reportData.reduce((sum, item) => sum + item["Total Fee Link (Rp)"], 0);
    const totalFeeCabang = reportData.reduce((sum, item) => sum + item["Total Fee Cabang (Rp)"], 0);
    const totalKomisiMitra = reportData.reduce((sum, item) => sum + item["Total Komisi Mitra (Rp)"], 0);

    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summary = [
      { A: "Laporan Gabungan Owner" },
      { A: "Periode", B: `${req.startDate} to ${req.endDate}` },
      {},
      { A: "Total Harga Pokok", B: totalHP },
      { A: "Total Fee Link", B: totalFeeLink },
      { A: "Total Fee Cabang", B: totalFeeCabang },
      { A: "Total Komisi Mitra", B: totalKomisiMitra },
      { A: "Total Pendapatan Bersih Owner", B: totalRevenue },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summary, { skipHeader: true });
    XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

    // Detailed Report Sheet
    const reportWs = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, reportWs, "Detail Transaksi");

    const fileContent = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const fileName = `laporan_gabungan_owner_${req.startDate}_sampai_${req.endDate}.xlsx`;

    return { fileContent, fileName };
  }
);
