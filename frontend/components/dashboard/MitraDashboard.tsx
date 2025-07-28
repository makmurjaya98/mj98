import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Package, TrendingUp, Users, DollarSign, Building, Link2, Trophy } from 'lucide-react';
import backend from '~backend/client';
import type { MitraDashboardData } from '~backend/dashboard/get_mitra_dashboard';

interface MitraDashboardProps {
  userId: number;
}

export default function MitraDashboard({ userId }: MitraDashboardProps) {
  const [data, setData] = useState<MitraDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await backend.dashboard.getMitraDashboard({ mitraId: userId });
        setData(response);
      } catch (error) {
        console.error('Failed to fetch Mitra dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data.',
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
    return <div className="p-6">Loading Mitra Dashboard...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mitra Cabang Dashboard</h1>
        <p className="text-gray-600">High-level overview of your entire network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCabang || 0} <span className="text-lg text-muted-foreground">Cabang</span></div>
            <p className="text-xs text-muted-foreground">{data?.totalLinks || 0} Links in total</p>
          </CardContent>
        </Card>
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Sales (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalSalesMonthInNetwork || 0}</div>
            <p className="text-xs text-muted-foreground">Vouchers sold by your network</p>
          </CardContent>
        </Card>
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unclaimed Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.totalKomisiUnclaimed || 0)}</div>
            <p className="text-xs text-muted-foreground">Your commission ready for deposit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Top Performing Cabang (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topCabangBySales && data.topCabangBySales.length > 0 ? (
              <ul className="space-y-2">
                {data.topCabangBySales.map((cabang, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{cabang.fullName}</span>
                    <span className="font-bold">{cabang.totalSales} sales</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No sales data available for your cabang in the last 30 days.</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> Top Customers in Network</CardTitle>
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
              <p className="text-gray-500 text-center py-4">No customer spending data available in your network.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
