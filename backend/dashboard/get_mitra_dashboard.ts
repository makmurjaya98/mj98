import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { laporan } from "~encore/clients";

export interface MitraDashboardData {
  totalCabang: number;
  totalLinks: number;
  totalStockInNetwork: number;
  totalSalesMonthInNetwork: number;
  totalKomisiUnclaimed: number;
  topCabangBySales: Array<{ fullName: string; totalSales: number }>;
  topCustomers: Array<{ nama: string; totalBelanja: number }>;
}

// Retrieves dashboard data for a specific Mitra Cabang.
export const getMitraDashboard = api<{ mitraId: number }, MitraDashboardData>(
  { expose: true, method: "GET", path: "/dashboard/mitra/:mitraId" },
  async ({ mitraId }) => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const cabang = await authDB.queryAll<{ id: number }>`
      SELECT id FROM users WHERE role = 'Cabang' AND parent_id = ${mitraId}
    `;
    const cabangIds = cabang.map(c => c.id);

    let linksCount = 0;
    if (cabangIds.length > 0) {
      const linksResult = await authDB.queryRow<{ count: number }>`
        SELECT COUNT(*) FROM users WHERE role = 'Link' AND parent_id IN (${cabangIds})
      `;
      linksCount = linksResult?.count || 0;
    }

    let totalStock = 0;
    if (cabangIds.length > 0) {
      const stockResult = await authDB.queryRow<{ sum: number }>`
        SELECT SUM(amount) FROM voucher_stocks WHERE cabang_id IN (${cabangIds})
      `;
      totalStock = stockResult?.sum || 0;
    }

    let totalSalesMonth = 0;
    if (cabangIds.length > 0) {
      const salesResult = await authDB.queryRow<{ sum: number }>`
        SELECT SUM(quantity_sold) FROM voucher_sales 
        WHERE cabang_id IN (${cabangIds}) AND created_at >= ${monthAgo}
      `;
      totalSalesMonth = salesResult?.sum || 0;
    }

    const komisiResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(komisi_mitra) FROM voucher_sales WHERE mitra_cabang_id = ${mitraId}
    `;

    let topCabang: Array<{ fullName: string; totalSales: number }> = [];
    if (cabangIds.length > 0) {
      topCabang = await authDB.queryAll<{ fullName: string; totalSales: number }>`
        SELECT u.full_name as "fullName", SUM(vs.quantity_sold) as "totalSales"
        FROM voucher_sales vs
        JOIN users u ON vs.cabang_id = u.id
        WHERE vs.cabang_id IN (${cabangIds}) AND vs.created_at >= ${monthAgo}
        GROUP BY u.full_name
        ORDER BY "totalSales" DESC
        LIMIT 5
      `;
    }

    const topCustomersResponse = await laporan.getTopCustomers({
      performerId: mitraId,
      performerRole: 'Mitra Cabang',
      limit: 3,
    });

    return {
      totalCabang: cabangIds.length,
      totalLinks: linksCount,
      totalStockInNetwork: totalStock,
      totalSalesMonthInNetwork: totalSalesMonth,
      totalKomisiUnclaimed: komisiResult?.sum || 0,
      topCabangBySales: topCabang,
      topCustomers: topCustomersResponse.customers.map(c => ({ nama: c.nama, totalBelanja: c.totalBelanja })),
    };
  }
);
