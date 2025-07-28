import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "../auth/db";
import type { Customer } from "./add";

export interface GetCustomerDetailsRequest {
  customerId: Query<number>;
  linkId: Query<number>; // To verify ownership
}

export interface CustomerTransaction {
  id: number;
  voucherType: string;
  qty: number;
  tanggal: Date;
}

export interface CustomerCoupon {
  id: number;
  couponId: number;
  isUsed: boolean;
  issuedAt: Date;
  kode: string;
  deskripsi: string;
  nilaiDiskon: number;
}

export interface GetCustomerDetailsResponse {
  customer: Customer;
  transactions: CustomerTransaction[];
  coupons: CustomerCoupon[];
}

// Retrieves detailed information for a single customer.
export const getDetails = api<GetCustomerDetailsRequest, GetCustomerDetailsResponse>(
  { expose: true, method: "GET", path: "/customer/details" },
  async (req) => {
    if (!req.customerId || !req.linkId) {
      throw APIError.invalidArgument("Customer ID and Link ID are required.");
    }

    const customerRow = await authDB.queryRow<{
      id: number;
      nama: string;
      alamat: string | null;
      no_hp: string | null;
      link_id: number;
      total_pembelian: number;
      created_at: Date;
    }>`
      SELECT * FROM customers WHERE id = ${req.customerId} AND link_id = ${req.linkId}
    `;

    if (!customerRow) {
      throw APIError.notFound("Customer not found or access denied.");
    }

    const customer: Customer = {
      id: customerRow.id,
      nama: customerRow.nama,
      alamat: customerRow.alamat,
      noHp: customerRow.no_hp,
      linkId: customerRow.link_id,
      totalPembelian: customerRow.total_pembelian,
      createdAt: customerRow.created_at,
    };

    const transactions: CustomerTransaction[] = [];
    const txRows = authDB.query<{ id: number; voucher_type: string; qty: number; tanggal: Date }>`
      SELECT id, voucher_type, qty, tanggal FROM customer_transactions
      WHERE customer_id = ${req.customerId} ORDER BY tanggal DESC
    `;
    for await (const row of txRows) {
      transactions.push({
        id: row.id,
        voucherType: row.voucher_type,
        qty: row.qty,
        tanggal: row.tanggal,
      });
    }

    const coupons: CustomerCoupon[] = [];
    const couponRows = authDB.query<{
      id: number;
      coupon_id: number;
      is_used: boolean;
      issued_at: Date;
      kode: string;
      deskripsi: string;
      nilai_diskon: number;
    }>`
      SELECT cc.id, cc.coupon_id, cc.is_used, cc.issued_at, c.kode, c.deskripsi, c.nilai_diskon
      FROM customer_coupons cc
      JOIN coupons c ON cc.coupon_id = c.id
      WHERE cc.customer_id = ${req.customerId}
      ORDER BY cc.issued_at DESC
    `;
    for await (const row of couponRows) {
      coupons.push({
        id: row.id,
        couponId: row.coupon_id,
        isUsed: row.is_used,
        issuedAt: row.issued_at,
        kode: row.kode,
        deskripsi: row.deskripsi,
        nilaiDiskon: row.nilai_diskon,
      });
    }

    return { customer, transactions, coupons };
  }
);
