import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Trophy, Calendar, Filter, Download } from 'lucide-react';
import backend from '~backend/client';
import type { TopCustomer } from '~backend/laporan/get_top_customers';
import { usePermissions } from '../../hooks/usePermissions';

export default function TopPelangganReport() {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { role, userId } = usePermissions(1); // Assuming user ID 1 for demo
  const { toast } = useToast();

  const fetchTopCustomers = async () => {
    if (!role || !userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('performerId', userId.toString());
      params.append('performerRole', role);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      params.append('limit', '100');

      const response = await fetch(`/laporan/top-customers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch top customers');
      const data = await response.json();
      setCustomers(data.customers);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopCustomers();
  }, [role, userId]);

  const handleExport = async () => {
    try {
      const response = await backend.exportService.reportTopCustomers({
        performerId: userId!,
        performerRole: role,
        fromDate,
        toDate,
      });

      const byteCharacters = atob(response.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = response.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: `${response.fileName} has been downloaded.` });
    } catch (error: any) {
      toast({ title: 'Export Failed', description: error.message, variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Laporan Pelanggan Terbanyak</h1>
        <p className="text-gray-600">Lihat pelanggan dengan total belanja tertinggi.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter /> Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="fromDate">Dari Tanggal</Label>
            <Input id="fromDate" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">Sampai Tanggal</Label>
            <Input id="toDate" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <Button onClick={fetchTopCustomers} disabled={loading}>
            {loading ? 'Memuat...' : 'Terapkan Filter'}
          </Button>
          <Button onClick={handleExport} variant="outline" disabled={customers.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy /> Daftar Top Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Peringkat</th>
                    <th className="p-2 text-left">Nama</th>
                    <th className="p-2 text-left">No. HP</th>
                    <th className="p-2 text-left">Alamat</th>
                    <th className="p-2 text-right">Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.customerId} className="border-b">
                      <td className="p-2 font-bold text-lg">{getMedal(index)}</td>
                      <td className="p-2">{customer.nama}</td>
                      <td className="p-2">{customer.noHp || '-'}</td>
                      <td className="p-2">{customer.alamat || '-'}</td>
                      <td className="p-2 text-right font-semibold text-green-600">{formatCurrency(customer.totalBelanja)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length === 0 && <p className="text-center py-8 text-gray-500">Tidak ada data pelanggan untuk filter yang dipilih.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
