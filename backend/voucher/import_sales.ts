import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { calculatePendapatan } from "./calculate_pendapatan";

export interface SalesImportItem {
  mitra_cabang: string;
  cabang: string;
  link: string;
  jenis_voucher: string;
  jumlah_terjual: number;
}

export interface ImportSalesRequest {
  items: SalesImportItem[];
}

export interface ImportSalesResponse {
  successCount: number;
  errorCount: number;
  errors: string[];
}

interface VoucherPricing {
  harga_pokok: number;
  harga_jual: number;
  share_harga_cabang: number;
  fee_link_pct: number;
  fee_cabang_pct: number;
  komisi_mitra_pct: number;
}

// Imports voucher sales in bulk from a parsed Excel file.
export const importSales = api<ImportSalesRequest, ImportSalesResponse>(
  { expose: true, method: "POST", path: "/voucher/import-sales" },
  async (req) => {
    if (!req.items || req.items.length === 0) {
      throw APIError.invalidArgument("No items to import");
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const [index, item] of req.items.entries()) {
      const rowNum = index + 2;

      await authDB.exec`BEGIN`;
      try {
        // Validate item
        if (!item.mitra_cabang || !item.cabang || !item.link || !item.jenis_voucher || !item.jumlah_terjual) {
          throw new Error("Missing required fields");
        }
        if (item.jumlah_terjual <= 0) {
          throw new Error("Jumlah terjual must be positive");
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

        // Check stock
        const stock = await authDB.queryRow<{ id: number, amount: number }>`
          SELECT id, amount FROM voucher_stocks WHERE link_id = ${link.id} AND voucher_type = ${item.jenis_voucher}
        `;
        if (!stock || stock.amount < item.jumlah_terjual) {
          throw new Error(`Insufficient stock for ${item.jenis_voucher}. Available: ${stock?.amount || 0}`);
        }

        // Get pricing
        const pricing = await authDB.queryRow<VoucherPricing>`
          SELECT harga_pokok, harga_jual, share_harga_cabang, fee_link_pct, fee_cabang_pct, komisi_mitra_pct
          FROM voucher_prices WHERE cabang_id = ${cabang.id} AND voucher_type = ${item.jenis_voucher}
        `;

        let feeLink = 0, feeCabang = 0, komisiMitra = 0, pendapatanOwner = 0, totalPendapatanLink = 0, totalPendapatanCabang = 0;
        if (pricing) {
          const calc = calculatePendapatan({
            jumlahTerjual: item.jumlah_terjual,
            hargaPokok: pricing.harga_pokok,
            hargaJual: pricing.harga_jual,
            shareHarga: pricing.share_harga_cabang,
            feeLinkPercent: pricing.fee_link_pct,
            feeCabangPercent: pricing.fee_cabang_pct,
            komisiMitraPercent: pricing.komisi_mitra_pct,
          });
          feeLink = calc.feeLink;
          feeCabang = calc.feeCabang;
          komisiMitra = calc.komisiMitra;
          pendapatanOwner = calc.pendapatanOwner;
          totalPendapatanLink = calc.totalPendapatanLink;
          totalPendapatanCabang = calc.totalPendapatanCabang;
        }

        // Deduct stock
        await authDB.exec`UPDATE voucher_stocks SET amount = amount - ${item.jumlah_terjual} WHERE id = ${stock.id}`;

        // Insert sale
        await authDB.exec`
          INSERT INTO voucher_sales (
            mitra_cabang_id, cabang_id, link_id, voucher_type, quantity_sold,
            fee_link, fee_cabang, komisi_mitra, pendapatan_owner,
            total_pendapatan_link, total_pendapatan_cabang
          ) VALUES (
            ${mitra.id}, ${cabang.id}, ${link.id}, ${item.jenis_voucher}, ${item.jumlah_terjual},
            ${feeLink}, ${feeCabang}, ${komisiMitra}, ${pendapatanOwner},
            ${totalPendapatanLink}, ${totalPendapatanCabang}
          )
        `;

        await authDB.exec`COMMIT`;
        successCount++;
      } catch (e: any) {
        await authDB.exec`ROLLBACK`;
        errorCount++;
        errors.push(`Row ${rowNum}: ${e.message}`);
      }
    }

    return { successCount, errorCount, errors };
  }
);
