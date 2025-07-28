import { api } from "encore.dev/api";
import { authDB } from "../auth/db";
import type { Coupon } from "./create";

export interface ListCouponsResponse {
  coupons: Coupon[];
}

// Lists all available coupons.
export const list = api<void, ListCouponsResponse>(
  { expose: true, method: "GET", path: "/coupon/list" },
  async () => {
    const coupons: Coupon[] = [];
    const rows = authDB.query<Coupon>`
      SELECT id, kode, deskripsi, nilai_diskon as "nilaiDiskon", min_pembelian as "minPembelian", expired_at as "expiredAt", target, is_loyalty_coupon as "isLoyaltyCoupon"
      FROM coupons
      ORDER BY created_at DESC
    `;
    for await (const row of rows) {
      coupons.push(row);
    }
    return { coupons };
  }
);
