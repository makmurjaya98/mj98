import { api } from "encore.dev/api";
import { authDB } from "../auth/db";
import { laporan } from "~encore/clients";

export interface AdminDashboardData {
  totalStock: number;
  totalSales: number;
  totalUsers: number;
  totalRevenue: number;
  topCustomers: Array<{ nama: string; totalBelanja: number }>;
}

// Retrieves dashboard data for an Admin or Owner.
export const getAdminDashboard = api<void, AdminDashboardData>(
  { expose: true, method: "GET", path: "/dashboard/admin" },
  async () => {
    const stockResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(amount) FROM voucher_stocks
    `;

    const salesResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(quantity_sold) FROM voucher_sales
    `;

    const usersResult = await authDB.queryRow<{ count: number }>`
      SELECT COUNT(*) FROM users
    `;

    const revenueResult = await authDB.queryRow<{ sum: number }>`
      SELECT SUM(pendapatan_owner) FROM voucher_sales
    `;

    const topCustomersResponse = await laporan.getTopCustomers({
      performerId: 0, // Not needed for owner
      performerRole: 'Owner',
      limit: 3,
    });

    return {
      totalStock: stockResult?.sum || 0,
      totalSales: salesResult?.sum || 0,
      totalUsers: usersResult?.count || 0,
      totalRevenue: revenueResult?.sum || 0,
      topCustomers: topCustomersResponse.customers.map(c => ({ nama: c.nama, totalBelanja: c.totalBelanja })),
    };
  }
);
