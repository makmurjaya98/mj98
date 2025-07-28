import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Package, TrendingUp, Users, DollarSign, Trophy } from 'lucide-react';
import backend from '~backend/client';
import type { AdminDashboardData } from '~backend/dashboard/get_admin_dashboard';

export default function AdminOwnerDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await backend.dashboard.getAdminDashboard();
        setData(response);
      } catch (error) {
        console.error('Failed to fetch Admin dashboard data:', error);
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
  }, [toast]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  if (loading) {
    return <div className="p-6">Loading Dashboard...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalStock || 0}</div>
            <p className="text-xs text-muted-foreground">Available vouchers</p>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">Vouchers sold</p>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-300 hover:scale-105 hover:shadow-lg border border-transparent hover:border-amber-400 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">Total net revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> Top Customers</CardTitle>
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

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Create New Voucher
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
