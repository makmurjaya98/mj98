import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { calculatePendapatan } from "./calculate_pendapatan";
import { logActivity } from "../auth/log_activity";
import { notification } from "~encore/clients";

export interface AddSaleRequest {
  performerId: number;
  mitraCabangId: number;
  cabangId: number;
  linkId: number;
  voucherType: string;
  quantity: number;
}

export interface AddSaleResponse {
  success: boolean;
  message: string;
  remainingStock: number;
  pendapatanCalculation?: {
    pendapatanLink: number;
    pendapatanCabang: number;
    pendapatanMitra: number;
    pendapatanOwner: number;
  };
}

interface UserHierarchy {
  id: number;
  role: string;
  parent_id: number | null;
  full_name: string;
  username: string;
}

interface StockInfo {
  id: number;
  amount: number;
}

interface VoucherPricing {
  harga_pokok: number;
  harga_jual: number;
  share_harga_cabang: number;
  fee_link_pct: number;
  fee_cabang_pct: number;
  komisi_mitra_pct: number;
}

const LOW_STOCK_THRESHOLD = 10;

// Records a voucher sale and updates stock levels.
export const addSale = api<AddSaleRequest, AddSaleResponse>(
  { expose: true, method: "POST", path: "/voucher/add-sale" },
  async (req) => {
    // Validate required fields
    if (!req.performerId) {
      throw APIError.invalidArgument("Performer ID is required for logging");
    }
    if (!req.mitraCabangId || !req.cabangId || !req.linkId) {
      throw APIError.invalidArgument("All hierarchy selections are required");
    }
    if (!req.voucherType.trim()) {
      throw APIError.invalidArgument("Voucher type is required");
    }
    if (req.quantity <= 0) {
      throw APIError.invalidArgument("Quantity must be greater than 0");
    }

    // Validate voucher type format
    const validVoucherTypes = ["JM_2jam", "MJ_15jam", "MJ_1hari", "MJ_7hari", "MJ_30hari"];
    if (!validVoucherTypes.includes(req.voucherType)) {
      throw APIError.invalidArgument("Invalid voucher type");
    }

    // Verify Mitra Cabang exists and has correct role
    const mitraCabang = await authDB.queryRow<UserHierarchy>`
      SELECT id, role, parent_id, full_name, username FROM users WHERE id = ${req.mitraCabangId}
    `;
    if (!mitraCabang || mitraCabang.role !== "Mitra Cabang") {
      throw APIError.notFound("Mitra Cabang not found or invalid role");
    }

    // Verify Cabang exists, has correct role, and belongs to the Mitra Cabang
    const cabang = await authDB.queryRow<UserHierarchy>`
      SELECT id, role, parent_id, full_name, username FROM users WHERE id = ${req.cabangId}
    `;
    if (!cabang || cabang.role !== "Cabang" || cabang.parent_id !== req.mitraCabangId) {
      throw APIError.invalidArgument("Cabang not found or does not belong to the selected Mitra Cabang");
    }

    // Verify Link exists, has correct role, and belongs to the Cabang
    const link = await authDB.queryRow<UserHierarchy>`
      SELECT id, role, parent_id, full_name, username FROM users WHERE id = ${req.linkId}
    `;
    if (!link || link.role !== "Link" || link.parent_id !== req.cabangId) {
      throw APIError.invalidArgument("Link not found or does not belong to the selected Cabang");
    }

    // Check current stock for this voucher type and link
    const currentStock = await authDB.queryRow<StockInfo>`
      SELECT id, amount FROM voucher_stocks 
      WHERE voucher_type = ${req.voucherType} AND link_id = ${req.linkId}
    `;

    if (!currentStock || currentStock.amount < req.quantity) {
      throw APIError.failedPrecondition(
        `Insufficient stock. Available: ${currentStock?.amount || 0}, Requested: ${req.quantity}`
      );
    }

    // Get voucher pricing information
    const voucherPricing = await authDB.queryRow<VoucherPricing>`
      SELECT harga_pokok, harga_jual, share_harga_cabang, fee_link_pct, fee_cabang_pct, komisi_mitra_pct
      FROM voucher_prices 
      WHERE cabang_id = ${req.cabangId} AND voucher_type = ${req.voucherType}
    `;

    let pendapatanCalculation = null;
    let feeLink = 0, feeCabang = 0, komisiMitra = 0, pendapatanOwner = 0, totalPendapatanLink = 0, totalPendapatanCabang = 0;

    if (voucherPricing) {
      const calculationResult = calculatePendapatan({
        jumlahTerjual: req.quantity,
        hargaPokok: voucherPricing.harga_pokok,
        hargaJual: voucherPricing.harga_jual,
        shareHarga: voucherPricing.share_harga_cabang,
        feeLinkPercent: voucherPricing.fee_link_pct,
        feeCabangPercent: voucherPricing.fee_cabang_pct,
        komisiMitraPercent: voucherPricing.komisi_mitra_pct,
      });
      pendapatanCalculation = {
        pendapatanLink: calculationResult.pendapatanLink,
        pendapatanCabang: calculationResult.pendapatanCabang,
        pendapatanMitra: calculationResult.pendapatanMitra,
        pendapatanOwner: calculationResult.pendapatanOwner,
      };
      feeLink = calculationResult.feeLink;
      feeCabang = calculationResult.feeCabang;
      komisiMitra = calculationResult.komisiMitra;
      pendapatanOwner = calculationResult.pendapatanOwner;
      totalPendapatanLink = calculationResult.totalPendapatanLink;
      totalPendapatanCabang = calculationResult.totalPendapatanCabang;
    }

    await authDB.exec`BEGIN`;
    try {
      const newStockAmount = currentStock.amount - req.quantity;
      await authDB.exec`
        UPDATE voucher_stocks 
        SET amount = ${newStockAmount}, updated_at = NOW()
        WHERE id = ${currentStock.id}
      `;

      await authDB.exec`
        INSERT INTO voucher_sales (
          mitra_cabang_id, cabang_id, link_id, voucher_type, quantity_sold,
          fee_link, fee_cabang, komisi_mitra, pendapatan_owner,
          total_pendapatan_link, total_pendapatan_cabang
        )
        VALUES (
          ${req.mitraCabangId}, ${req.cabangId}, ${req.linkId}, ${req.voucherType}, ${req.quantity},
          ${feeLink}, ${feeCabang}, ${komisiMitra}, ${pendapatanOwner},
          ${totalPendapatanLink}, ${totalPendapatanCabang}
        )
      `;

      await authDB.exec`COMMIT`;

      // Log activity
      const logDesc = `Recorded sale of ${req.quantity} ${req.voucherType} vouchers for Link '${link.username}'.`;
      await logActivity({ userId: req.performerId, aksi: "Record Sale", deskripsi: logDesc });

      // Notification logic
      if (newStockAmount === 0) {
        await notification.send({
          userId: link.id,
          title: "Stock Habis",
          message: `Stok untuk voucher ${req.voucherType} telah habis.`,
          type: "error",
          linkUrl: "/admin/stock-management",
        });
        if (link.parent_id) {
          await notification.send({
            userId: link.parent_id,
            title: "Stok Link Habis",
            message: `Stok ${req.voucherType} untuk Link '${link.username}' telah habis.`,
            type: "warning",
            linkUrl: "/admin/stock-management",
          });
        }
      } else if (newStockAmount < LOW_STOCK_THRESHOLD) {
        await notification.send({
          userId: link.id,
          title: "Stok Menipis",
          message: `Stok untuk voucher ${req.voucherType} menipis. Sisa: ${newStockAmount}.`,
          type: "warning",
          linkUrl: "/admin/stock-management",
        });
      }

      let message = `Successfully recorded sale. Remaining stock: ${newStockAmount}`;
      if (pendapatanCalculation) {
        message += `. Pendapatan calculated.`;
      }

      return { success: true, message, remainingStock: newStockAmount, pendapatanCalculation };
    } catch (error) {
      await authDB.exec`ROLLBACK`;
      throw error;
    }
  }
);
