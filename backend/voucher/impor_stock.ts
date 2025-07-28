import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface StockImportItem {
  mitra_cabang: string;
  cabang: string;
  link: string;
  jenis_voucher: string;
  jumlah: number;
}

export interface ImportStockRequest {
  items: StockImportItem[];
}

export interface ImportStockResponse {
  successCount: number;
  errorCount: number;
  errors: string[];
}

// Imports voucher stock in bulk from a parsed Excel file.
export const importStock = api<ImportStockRequest, ImportStockResponse>(
  { expose: true, method: "POST", path: "/voucher/import-stock" },
  async (req) => {
    if (!req.items || req.items.length === 0) {
      throw APIError.invalidArgument("No items to import");
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const [index, item] of req.items.entries()) {
      const rowNum = index + 2; // Assuming header is row 1

      try {
        // Validate item
        if (!item.mitra_cabang || !item.cabang || !item.link || !item.jenis_voucher || !item.jumlah) {
          throw new Error("Missing required fields");
        }
        if (item.jumlah <= 0) {
          throw new Error("Jumlah must be positive");
        }

        // Find users by username
        const mitra = await authDB.queryRow<{ id: number }>`SELECT id FROM users WHERE username = ${item.mitra_cabang} AND role = 'Mitra Cabang'`;
        const cabang = await authDB.queryRow<{ id: number, parent_id: number }>`SELECT id, parent_id FROM users WHERE username = ${item.cabang} AND role = 'Cabang'`;
        const link = await authDB.queryRow<{ id: number, parent_id: number }>`SELECT id, parent_id FROM users WHERE username = ${item.link} AND role = 'Link'`;

        if (!mitra) throw new Error(`Mitra Cabang '${item.mitra_cabang}' not found`);
        if (!cabang) throw new Error(`Cabang '${item.cabang}' not found`);
        if (!link) throw new Error(`Link '${item.link}' not found`);

        // Validate hierarchy
        if (cabang.parent_id !== mitra.id) throw new Error(`Cabang '${item.cabang}' does not belong to Mitra '${item.mitra_cabang}'`);
        if (link.parent_id !== cabang.id) throw new Error(`Link '${item.link}' does not belong to Cabang '${item.cabang}'`);

        // Upsert stock
        await authDB.exec`
          INSERT INTO voucher_stocks (voucher_type, amount, link_id, cabang_id, mitra_cabang_id)
          VALUES (${item.jenis_voucher}, ${item.jumlah}, ${link.id}, ${cabang.id}, ${mitra.id})
          ON CONFLICT (voucher_type, link_id) DO UPDATE
          SET amount = voucher_stocks.amount + EXCLUDED.amount, updated_at = NOW()
        `;

        successCount++;
      } catch (e: any) {
        errorCount++;
        errors.push(`Row ${rowNum}: ${e.message}`);
      }
    }

    return { successCount, errorCount, errors };
  }
);
