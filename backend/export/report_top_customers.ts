import { api, APIError } from "encore.dev/api";
import * as XLSX from 'xlsx';
import { laporan } from "~encore/clients";

export interface ExportTopCustomersRequest {
  performerId: number;
  performerRole: string;
  fromDate?: string;
  toDate?: string;
}

export interface ExportTopCustomersResponse {
  fileContent: string; // base64 encoded
  fileName: string;
}

// Generates an Excel report of top customers.
export const reportTopCustomers = api<ExportTopCustomersRequest, ExportTopCustomersResponse>(
  { expose: true, method: "POST", path: "/export/report-top-customers" },
  async (req) => {
    const response = await laporan.getTopCustomers({
      performerId: req.performerId,
      performerRole: req.performerRole,
      fromDate: req.fromDate,
      toDate: req.toDate,
      limit: 1000, // Export a large number for the report
    });

    if (response.customers.length === 0) {
      throw APIError.notFound("No customer data found for the selected criteria.");
    }

    const reportData = response.customers.map(c => ({
      "Nama Pelanggan": c.nama,
      "No HP": c.noHp || 'N/A',
      "Alamat": c.alamat || 'N/A',
      "Total Belanja (Rp)": c.totalBelanja,
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Pelanggan");

    const fileContent = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const fileName = `laporan_top_pelanggan_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { fileContent, fileName };
  }
);
