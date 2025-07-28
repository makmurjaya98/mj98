import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Package, TrendingUp, DollarSign, Gift, Trophy } from 'lucide-react';
import backend from '~backend/client';
import type { LinkDashboardData } from '~backend/dashboard/get_link_dashboard';

interface LinkDashboardProps {
  userId: number;
}

export default function LinkDashboard({ userId }: LinkDashboardProps) {
  const [data, setData] = useState<LinkDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await backend.dashboard.getLinkDashboard({ linkId: userId });
        setData(response);
      } catch (error) {
        console.error('Failed to fetch Link dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your dashboard data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, toast]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  if (loading) {
    return <div className="p-6">Loading Your Dashboard...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Link Dashboard</h1>
        <p className="text-gray-600">Your personal sales and stock overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalStock || 0}</div>
            <p className="text-xs text-muted-foreground">Vouchers available to sell</p>
          </CardContent>
        </Card>
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales (Last 30 Days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalSalesMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Vouchers you have sold</p>
          </CardContent>
        </Card>
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unclaimed Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.totalPendapatanUnclaimed || 0)}</div>
            <p className="text-xs text-muted-foreground">Your earnings ready for deposit</p>
          </CardContent>
        </Card>
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activeCoupons || 0}</div>
            <p className="text-xs text-muted-foreground">Rewards you can compete for</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> My Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.topCustomers && data.topCustomers.length > 0 ? (
            <ul className="space-y-3">
              {data.topCustomers.map((customer, index) => (
                <li key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold w-6">{getMedal(index)}</span>
                    <span>{customer.nama}</span>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(customer.totalBelanja)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No customer spending data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
