import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface SetVoucherPricingRequest {
  cabangId: number;
  voucherType: string;
  hargaPokok: number;
  hargaJual: number;
  shareHargaCabang: number;
  feeCabangPct: number;
  feeLinkPct: number;
  komisiMitraPct: number;
}

export interface SetVoucherPricingResponse {
  success: boolean;
  message: string;
}

interface UserRole {
  id: number;
  role: string;
}

interface ExistingPrice {
  id: number;
}

// Sets voucher pricing configuration for a specific Cabang.
export const setVoucherPricing = api<SetVoucherPricingRequest, SetVoucherPricingResponse>(
  { expose: true, method: "POST", path: "/voucher/set-pricing" },
  async (req) => {
    // Validate required fields
    if (!req.cabangId) {
      throw APIError.invalidArgument("Cabang selection is required");
    }
    if (!req.voucherType.trim()) {
      throw APIError.invalidArgument("Voucher type is required");
    }
    if (req.hargaPokok <= 0) {
      throw APIError.invalidArgument("Harga Pokok must be greater than 0");
    }
    if (req.hargaJual <= 0) {
      throw APIError.invalidArgument("Harga Jual must be greater than 0");
    }
    if (req.shareHargaCabang <= 0) {
      throw APIError.invalidArgument("Share Harga Cabang must be greater than 0");
    }

    // Validate percentage fields
    if (req.feeCabangPct < 0 || req.feeCabangPct > 100) {
      throw APIError.invalidArgument("Fee Cabang percentage must be between 0 and 100");
    }
    if (req.feeLinkPct < 0 || req.feeLinkPct > 100) {
      throw APIError.invalidArgument("Fee Link percentage must be between 0 and 100");
    }
    if (req.komisiMitraPct < 0 || req.komisiMitraPct > 100) {
      throw APIError.invalidArgument("Komisi Mitra percentage must be between 0 and 100");
    }

    // Validate that total percentages don't exceed 100%
    const totalPercentage = req.feeCabangPct + req.feeLinkPct + req.komisiMitraPct;
    if (totalPercentage > 100) {
      throw APIError.invalidArgument("Total of all percentages cannot exceed 100%");
    }

    // Validate voucher type format
    const validVoucherTypes = ["JM_2jam", "MJ_15jam", "MJ_1hari", "MJ_7hari", "MJ_30hari"];
    if (!validVoucherTypes.includes(req.voucherType)) {
      throw APIError.invalidArgument("Invalid voucher type");
    }

    // Validate business logic
    if (req.hargaJual <= req.hargaPokok) {
      throw APIError.invalidArgument("Harga Jual must be greater than Harga Pokok");
    }
    if (req.shareHargaCabang > req.hargaJual) {
      throw APIError.invalidArgument("Share Harga Cabang cannot be greater than Harga Jual");
    }

    // Verify Cabang exists and has correct role
    const cabang = await authDB.queryRow<UserRole>`
      SELECT id, role FROM users WHERE id = ${req.cabangId}
    `;
    if (!cabang) {
      throw APIError.notFound("Cabang not found");
    }
    if (cabang.role !== "Cabang") {
      throw APIError.invalidArgument("Selected user is not a Cabang");
    }

    // Check if pricing already exists for this voucher type and cabang
    const existingPrice = await authDB.queryRow<ExistingPrice>`
      SELECT id FROM voucher_prices 
      WHERE cabang_id = ${req.cabangId} AND voucher_type = ${req.voucherType}
    `;

    if (existingPrice) {
      // Update existing pricing
      await authDB.exec`
        UPDATE voucher_prices 
        SET 
          harga_pokok = ${req.hargaPokok},
          harga_jual = ${req.hargaJual},
          share_harga_cabang = ${req.shareHargaCabang},
          fee_cabang_pct = ${req.feeCabangPct},
          fee_link_pct = ${req.feeLinkPct},
          komisi_mitra_pct = ${req.komisiMitraPct},
          updated_at = NOW()
        WHERE id = ${existingPrice.id}
      `;
    } else {
      // Create new pricing entry
      await authDB.exec`
        INSERT INTO voucher_prices (
          cabang_id, voucher_type, harga_pokok, harga_jual, 
          share_harga_cabang, fee_cabang_pct, fee_link_pct, komisi_mitra_pct
        )
        VALUES (
          ${req.cabangId}, ${req.voucherType}, ${req.hargaPokok}, ${req.hargaJual},
          ${req.shareHargaCabang}, ${req.feeCabangPct}, ${req.feeLinkPct}, ${req.komisiMitraPct}
        )
      `;
    }

    return {
      success: true,
      message: `Successfully configured pricing for ${req.voucherType} vouchers for the selected Cabang`,
    };
  }
);
