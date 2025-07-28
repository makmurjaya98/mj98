import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { logActivity } from "../auth/log_activity";
import { notification } from "~encore/clients";

export interface AddTransactionRequest {
  linkId: number;
  customerId: number;
  voucherType: string;
  qty: number;
}

export interface AddTransactionResponse {
  success: boolean;
  message: string;
  issuedCoupon: boolean;
}

const LOYALTY_THRESHOLD = 10;

// Records a transaction for a customer and handles loyalty coupon issuance.
export const addTransaction = api<AddTransactionRequest, AddTransactionResponse>(
  { expose: true, method: "POST", path: "/customer/add-transaction" },
  async (req) => {
    if (!req.linkId || !req.customerId || !req.voucherType || !req.qty) {
      throw APIError.invalidArgument("All fields are required.");
    }
    if (req.qty <= 0) {
      throw APIError.invalidArgument("Quantity must be positive.");
    }

    const tx = await authDB.begin();
    try {
      // Verify customer belongs to the link
      const customer = await tx.queryRow<{ id: number; total_pembelian: number }>`
        SELECT id, total_pembelian FROM customers WHERE id = ${req.customerId} AND link_id = ${req.linkId} FOR UPDATE
      `;
      if (!customer) {
        throw APIError.permissionDenied("Customer does not belong to this Link.");
      }

      // Get Cabang ID from Link
      const linkUser = await tx.queryRow<{ parent_id: number }>`
          SELECT parent_id FROM users WHERE id = ${req.linkId}
      `;
      if (!linkUser || !linkUser.parent_id) {
          throw APIError.internal("Could not determine Cabang for the Link.");
      }
      const cabangId = linkUser.parent_id;

      // Get voucher price to calculate total_harga
      const voucherPrice = await tx.queryRow<{ harga_jual: number }>`
          SELECT harga_jual FROM voucher_prices WHERE cabang_id = ${cabangId} AND voucher_type = ${req.voucherType}
      `;
      if (!voucherPrice) {
          throw APIError.failedPrecondition(`Pricing for ${req.voucherType} is not set for this Cabang.`);
      }

      const totalHarga = voucherPrice.harga_jual * req.qty;

      // Insert transaction
      await tx.exec`
        INSERT INTO customer_transactions (customer_id, voucher_type, qty, total_harga)
        VALUES (${req.customerId}, ${req.voucherType}, ${req.qty}, ${totalHarga})
      `;

      // Update total purchases
      const oldTotal = customer.total_pembelian;
      const newTotal = oldTotal + req.qty;
      await tx.exec`
        UPDATE customers SET total_pembelian = ${newTotal} WHERE id = ${req.customerId}
      `;

      let issuedCoupon = false;
      // Check for loyalty coupon threshold
      if (Math.floor(oldTotal / LOYALTY_THRESHOLD) < Math.floor(newTotal / LOYALTY_THRESHOLD)) {
        const loyaltyCoupon = await tx.queryRow<{ id: number; deskripsi: string }>`
          SELECT id, deskripsi FROM coupons WHERE is_loyalty_coupon = true LIMIT 1
        `;
        if (loyaltyCoupon) {
          await tx.exec`
            INSERT INTO customer_coupons (customer_id, coupon_id)
            VALUES (${req.customerId}, ${loyaltyCoupon.id})
          `;
          issuedCoupon = true;

          // Send notification to the Link user
          await notification.send({
            userId: req.linkId,
            title: "Loyalty Coupon Awarded!",
            message: `Customer has earned a loyalty coupon: ${loyaltyCoupon.deskripsi}`,
            type: "success",
          });
        }
      }

      await tx.commit();

      await logActivity({
        userId: req.linkId,
        aksi: "Add Customer Transaction",
        deskripsi: `Recorded transaction of ${req.qty} ${req.voucherType} for customer ID ${req.customerId}.`,
      });

      return {
        success: true,
        message: "Transaction recorded successfully.",
        issuedCoupon,
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
