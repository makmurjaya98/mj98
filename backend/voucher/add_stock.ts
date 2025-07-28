import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface AddStockRequest {
  mitraCabangId: number;
  cabangId: number;
  linkId: number;
  voucherType: string;
  amount: number;
}

export interface AddStockResponse {
  success: boolean;
  message: string;
  newStockAmount: number;
}

interface UserHierarchy {
  id: number;
  role: string;
  parent_id: number | null;
}

interface ExistingStock {
  id: number;
  amount: number;
}

// Adds voucher stock to a specific Link through the hierarchy.
export const addStock = api<AddStockRequest, AddStockResponse>(
  { expose: true, method: "POST", path: "/voucher/add-stock" },
  async (req) => {
    // Validate required fields
    if (!req.mitraCabangId || !req.cabangId || !req.linkId) {
      throw APIError.invalidArgument("All hierarchy selections are required");
    }
    if (!req.voucherType.trim()) {
      throw APIError.invalidArgument("Voucher type is required");
    }
    if (req.amount <= 0) {
      throw APIError.invalidArgument("Amount must be greater than 0");
    }

    // Validate voucher type format
    const validVoucherTypes = ["JM_2jam", "MJ_15jam", "MJ_1hari", "MJ_7hari", "MJ_30hari"];
    if (!validVoucherTypes.includes(req.voucherType)) {
      throw APIError.invalidArgument("Invalid voucher type");
    }

    // Verify Mitra Cabang exists and has correct role
    const mitraCabang = await authDB.queryRow<UserHierarchy>`
      SELECT id, role, parent_id FROM users WHERE id = ${req.mitraCabangId}
    `;
    if (!mitraCabang) {
      throw APIError.notFound("Mitra Cabang not found");
    }
    if (mitraCabang.role !== "Mitra Cabang") {
      throw APIError.invalidArgument("Selected user is not a Mitra Cabang");
    }

    // Verify Cabang exists, has correct role, and belongs to the Mitra Cabang
    const cabang = await authDB.queryRow<UserHierarchy>`
      SELECT id, role, parent_id FROM users WHERE id = ${req.cabangId}
    `;
    if (!cabang) {
      throw APIError.notFound("Cabang not found");
    }
    if (cabang.role !== "Cabang") {
      throw APIError.invalidArgument("Selected user is not a Cabang");
    }
    if (cabang.parent_id !== req.mitraCabangId) {
      throw APIError.invalidArgument("Cabang does not belong to the selected Mitra Cabang");
    }

    // Verify Link exists, has correct role, and belongs to the Cabang
    const link = await authDB.queryRow<UserHierarchy>`
      SELECT id, role, parent_id FROM users WHERE id = ${req.linkId}
    `;
    if (!link) {
      throw APIError.notFound("Link not found");
    }
    if (link.role !== "Link") {
      throw APIError.invalidArgument("Selected user is not a Link");
    }
    if (link.parent_id !== req.cabangId) {
      throw APIError.invalidArgument("Link does not belong to the selected Cabang");
    }

    // Check if stock already exists for this voucher type and link
    const existingStock = await authDB.queryRow<ExistingStock>`
      SELECT id, amount FROM voucher_stocks 
      WHERE voucher_type = ${req.voucherType} AND link_id = ${req.linkId}
    `;

    let newStockAmount: number;

    if (existingStock) {
      // Update existing stock
      newStockAmount = existingStock.amount + req.amount;
      await authDB.exec`
        UPDATE voucher_stocks 
        SET amount = ${newStockAmount}, updated_at = NOW()
        WHERE id = ${existingStock.id}
      `;
    } else {
      // Create new stock entry
      newStockAmount = req.amount;
      await authDB.exec`
        INSERT INTO voucher_stocks (voucher_type, amount, link_id, cabang_id, mitra_cabang_id)
        VALUES (${req.voucherType}, ${req.amount}, ${req.linkId}, ${req.cabangId}, ${req.mitraCabangId})
      `;
    }

    return {
      success: true,
      message: `Successfully added ${req.amount} ${req.voucherType} vouchers to the selected Link. New total: ${newStockAmount}`,
      newStockAmount,
    };
  }
);
