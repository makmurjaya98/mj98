import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { logActivity } from "../auth/log_activity";

export interface AddCustomerRequest {
  linkId: number;
  nama: string;
  alamat?: string;
  noHp?: string;
}

export interface Customer {
  id: number;
  nama: string;
  alamat: string | null;
  noHp: string | null;
  linkId: number;
  totalPembelian: number;
  createdAt: Date;
}

export interface AddCustomerResponse {
  success: boolean;
  customer: Customer;
}

// Adds a new customer for a specific Link.
export const add = api<AddCustomerRequest, AddCustomerResponse>(
  { expose: true, method: "POST", path: "/customer/add" },
  async (req) => {
    if (!req.linkId || !req.nama) {
      throw APIError.invalidArgument("Link ID and customer name are required.");
    }

    const customer = await authDB.queryRow<{
      id: number;
      nama: string;
      alamat: string | null;
      no_hp: string | null;
      link_id: number;
      total_pembelian: number;
      created_at: Date;
    }>`
      INSERT INTO customers (link_id, nama, alamat, no_hp)
      VALUES (${req.linkId}, ${req.nama}, ${req.alamat || null}, ${req.noHp || null})
      RETURNING *
    `;

    if (!customer) {
      throw APIError.internal("Failed to create customer.");
    }

    await logActivity({
      userId: req.linkId,
      aksi: "Add Customer",
      deskripsi: `Added new customer: ${customer.nama}`,
    });

    return {
      success: true,
      customer: {
        id: customer.id,
        nama: customer.nama,
        alamat: customer.alamat,
        noHp: customer.no_hp,
        linkId: customer.link_id,
        totalPembelian: customer.total_pembelian,
        createdAt: customer.created_at,
      },
    };
  }
);
