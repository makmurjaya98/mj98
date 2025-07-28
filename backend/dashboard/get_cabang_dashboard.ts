import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { laporan } from "~encore/clients";

export interface CabangDashboardData {
  totalLinks: number;
  totalStockInNetwork: number;
  totalSalesMonthInNetwork: number;
  totalPendapatanUnclaimed: number;
  topLinksBySales: Array<{ fullName: string; totalSales: number }>;
  topCustomers: Array<{ nama: string; totalBelanja: number }>;
}

// Retrieves dashboard data for a specific Cabang.
export const getCabangDashboard = api<{ cabangId: number }, CabangDashboardData>(
  { expose: true, method: "GET", path: "/dashboard/cabang/:cabangId" },
  async ({ cabangId }) => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const links = await authDB.queryAll<{ id: number }>`
      SELECT id FROM users WHERE role = 'Link' AND parent_id = ${cabangId}
    `;
    const linkIds = links.map(l => l.id);

    let totalStock = 0;
    if (linkIds.length > 0) {
      const stockResult = await authDB.queryRow<{ sum: number }>`
        SELECT SUM(amount) FROM voucher_stocks WHERE link_id IN (${linkIds})
      `;
      totalStock = stockResult?.sum || 0;
    }

    let totalSalesMonth = 0;
    if (linkIds.length > 0) {
      const salesResult = await authDB.queryRow<{ sum: number }>`
        SELECT SUM(quantity_sold) FROM voucher_sales 
        WHERE link_id IN (${linkIds}) AND created_at >= ${monthAgo}
      `;
      totalSalesMonth = salesResult?.sum || 0;
    }

    const pendapatanResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(total_pendapatan_cabang) FROM voucher_sales WHERE cabang_id = ${cabangId}
    `;

    let topLinks: Array<{ fullName: string; totalSales: number }> = [];
    if (linkIds.length > 0) {
      topLinks = await authDB.queryAll<{ fullName: string; totalSales: number }>`
        SELECT u.full_name as "fullName", SUM(vs.quantity_sold) as "totalSales"
        FROM voucher_sales vs
        JOIN users u ON vs.link_id = u.id
        WHERE vs.link_id IN (${linkIds}) AND vs.created_at >= ${monthAgo}
        GROUP BY u.full_name
        ORDER BY "totalSales" DESC
        LIMIT 5
      `;
    }

    const topCustomersResponse = await laporan.getTopCustomers({
      performerId: cabangId,
      performerRole: 'Cabang',
      limit: 3,
    });

    return {
      totalLinks: linkIds.length,
      totalStockInNetwork: totalStock,
      totalSalesMonthInNetwork: totalSalesMonth,
      totalPendapatanUnclaimed: pendapatanResult?.sum || 0,
      topLinksBySales: topLinks,
      topCustomers: topCustomersResponse.customers.map(c => ({ nama: c.nama, totalBelanja: c.totalBelanja })),
    };
  }
);
