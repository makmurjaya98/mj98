import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "../auth/db";
import type { Customer } from "./add";

export interface GetCustomersByLinkRequest {
  linkId: Query<number>;
}

export interface GetCustomersByLinkResponse {
  customers: Customer[];
}

// Retrieves all customers associated with a specific Link.
export const getByLink = api<GetCustomersByLinkRequest, GetCustomersByLinkResponse>(
  { expose: true, method: "GET", path: "/customer/by-link" },
  async (req) => {
    if (!req.linkId) {
      throw APIError.invalidArgument("Link ID is required.");
    }

    const customers: Customer[] = [];
    const rows = authDB.query<{
      id: number;
      nama: string;
      alamat: string | null;
      no_hp: string | null;
      link_id: number;
      total_pembelian: number;
      created_at: Date;
    }>`
      SELECT id, nama, alamat, no_hp, link_id, total_pembelian, created_at
      FROM customers
      WHERE link_id = ${req.linkId}
      ORDER BY nama ASC
    `;

    for await (const row of rows) {
      customers.push({
        id: row.id,
        nama: row.nama,
        alamat: row.alamat,
        noHp: row.no_hp,
        linkId: row.link_id,
        totalPembelian: row.total_pembelian,
        createdAt: row.created_at,
      });
    }

    return { customers };
  }
);
