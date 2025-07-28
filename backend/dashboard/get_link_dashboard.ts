import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { laporan } from "~encore/clients";

export interface LinkDashboardData {
  totalStock: number;
  totalSalesMonth: number;
  totalPendapatanUnclaimed: number;
  activeCoupons: number;
  topCustomers: Array<{ nama: string; totalBelanja: number }>;
}

// Retrieves dashboard data for a specific Link.
export const getLinkDashboard = api<{ linkId: number }, LinkDashboardData>(
  { expose: true, method: "GET", path: "/dashboard/link/:linkId" },
  async ({ linkId }) => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const stockResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(amount) FROM voucher_stocks WHERE link_id = ${linkId}
    `;

    const salesResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(quantity_sold) FROM voucher_sales 
      WHERE link_id = ${linkId} AND created_at >= ${monthAgo}
    `;

    const pendapatanResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(total_pendapatan_link) FROM voucher_sales WHERE link_id = ${linkId}
    `;

    const couponsResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) FROM kupon_hadiah 
      WHERE target_role = 'Link' AND status = 'aktif' AND periode_berakhir >= NOW()
    `;

    const topCustomersResponse = await laporan.getTopCustomers({
      performerId: linkId,
      performerRole: 'Link',
      limit: 3,
    });

    return {
      totalStock: stockResult?.sum || 0,
      totalSalesMonth: salesResult?.sum || 0,
      totalPendapatanUnclaimed: pendapatanResult?.sum || 0,
      activeCoupons: couponsResult?.count || 0,
      topCustomers: topCustomersResponse.customers.map(c => ({ nama: c.nama, totalBelanja: c.totalBelanja })),
    };
  }
);
