import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

export interface DashboardOverview {
  totalStock: number;
  totalSales: number;
}

// Retrieves dashboard overview statistics.
export const getOverview = api<void, DashboardOverview>(
  {
    path: "/dashboard/overview",
    method: "GET",
    expose: true,
  },
  async () => {
    const stockResult = await authDB.queryRow<{ totalStock: number }>`
      SELECT COUNT(*) as totalStock FROM vouchers WHERE is_sold = false
    `;

    const salesResult = await authDB.queryRow<{ totalSales: number }>`
      SELECT COUNT(*) as totalSales FROM vouchers WHERE is_sold = true
    `;

    return {
      totalStock: stockResult?.totalStock || 0,
      totalSales: salesResult?.totalSales || 0,
    };
  }
);
