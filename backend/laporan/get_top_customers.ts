import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface GetTopCustomersRequest {
  performerId: Query<number>;
  performerRole: Query<string>;
  fromDate?: Query<string>;
  toDate?: Query<string>;
  limit?: Query<number>;
}

export interface TopCustomer {
  customerId: number;
  nama: string;
  noHp: string | null;
  alamat: string | null;
  totalBelanja: number;
}

export interface GetTopCustomersResponse {
  customers: TopCustomer[];
}

// Retrieves a report of top customers based on total spending.
export const getTopCustomers = api<GetTopCustomersRequest, GetTopCustomersResponse>(
  { expose: true, method: "GET", path: "/laporan/top-customers" },
  async (req) => {
    if (!req.performerRole) {
      throw APIError.invalidArgument("Performer role is required.");
    }

    let dateCondition = "";
    const params: any[] = [];
    let paramIndex = 1;

    if (req.fromDate) {
      dateCondition += ` AND ct.tanggal >= $${paramIndex++}`;
      params.push(new Date(req.fromDate));
    }
    if (req.toDate) {
      const toDate = new Date(req.toDate);
      toDate.setHours(23, 59, 59, 999);
      dateCondition += ` AND ct.tanggal <= $${paramIndex++}`;
      params.push(toDate);
    }

    let hierarchyCondition = "";
    if (req.performerRole === 'Link') {
      hierarchyCondition = `AND c.link_id = $${paramIndex++}`;
      params.push(req.performerId);
    } else if (req.performerRole === 'Cabang') {
      hierarchyCondition = `AND c.link_id IN (SELECT id FROM users WHERE parent_id = $${paramIndex++})`;
      params.push(req.performerId);
    } else if (req.performerRole === 'Mitra Cabang') {
      hierarchyCondition = `AND c.link_id IN (SELECT id FROM users WHERE parent_id IN (SELECT id FROM users WHERE parent_id = $${paramIndex++}))`;
      params.push(req.performerId);
    }

    const limit = req.limit || 100;
    const query = `
      SELECT 
        c.id as customer_id,
        c.nama,
        c.no_hp,
        c.alamat,
        SUM(ct.total_harga) as total_belanja
      FROM customers c
      JOIN customer_transactions ct ON c.id = ct.customer_id
      WHERE 1=1 ${dateCondition} ${hierarchyCondition}
      GROUP BY c.id, c.nama, c.no_hp, c.alamat
      ORDER BY total_belanja DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const customerRows = await authDB.rawQuery<{
      customer_id: number;
      nama: string;
      no_hp: string | null;
      alamat: string | null;
      total_belanja: number;
    }>(query, ...params);

    const customers: TopCustomer[] = [];
    for await (const row of customerRows) {
      customers.push({
        customerId: row.customer_id,
        nama: row.nama,
        noHp: row.no_hp,
        alamat: row.alamat,
        totalBelanja: row.total_belanja,
      });
    }

    return { customers };
  }
);
