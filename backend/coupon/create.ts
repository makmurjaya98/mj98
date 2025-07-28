import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { logActivity } from "../auth/log_activity";

export interface CreateCouponRequest {
  performerId: number;
  kode: string;
  deskripsi: string;
  nilaiDiskon: number;
  minPembelian: number;
  expiredAt: string; // ISO date string
  target: 'mitra' | 'cabang' | 'link' | 'pelanggan';
  isLoyaltyCoupon: boolean;
}

export interface Coupon {
  id: number;
  kode: string;
  deskripsi: string;
  nilaiDiskon: number;
  minPembelian: number;
  expiredAt: Date;
  target: string;
  isLoyaltyCoupon: boolean;
}

export interface CreateCouponResponse {
  success: boolean;
  coupon: Coupon;
}

// Creates a new coupon.
export const create = api<CreateCouponRequest, CreateCouponResponse>(
  { expose: true, method: "POST", path: "/coupon/create" },
  async (req) => {
    if (!req.kode || !req.deskripsi || !req.nilaiDiskon || !req.expiredAt || !req.target) {
      throw APIError.invalidArgument("Missing required fields for coupon creation.");
    }

    // If this is a loyalty coupon, ensure no other loyalty coupon exists
    if (req.isLoyaltyCoupon) {
      const existingLoyalty = await authDB.queryRow`
        SELECT id FROM coupons WHERE is_loyalty_coupon = true
      `;
      if (existingLoyalty) {
        throw APIError.alreadyExists("A default loyalty coupon already exists. Only one is allowed.");
      }
    }

    const coupon = await authDB.queryRow<Coupon>`
      INSERT INTO coupons (kode, deskripsi, nilai_diskon, min_pembelian, expired_at, target, is_loyalty_coupon)
      VALUES (${req.kode}, ${req.deskripsi}, ${req.nilaiDiskon}, ${req.minPembelian}, ${req.expiredAt}, ${req.target}, ${req.isLoyaltyCoupon})
      RETURNING id, kode, deskripsi, nilai_diskon as "nilaiDiskon", min_pembelian as "minPembelian", expired_at as "expiredAt", target, is_loyalty_coupon as "isLoyaltyCoupon"
    `;

    if (!coupon) {
      throw APIError.internal("Failed to create coupon.");
    }

    await logActivity({
      userId: req.performerId,
      aksi: "Create Coupon",
      deskripsi: `Created new coupon: ${coupon.kode}`,
    });

    return { success: true, coupon };
  }
);
