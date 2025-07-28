import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileSpreadsheet, Calendar, Download, Package, TrendingUp, DollarSign, Filter } from 'lucide-react';
import backend from '~backend/client';
import type { HierarchyUser, DistributionHierarchyResponse } from '~backend/voucher/get_hierarchy_for_distribution';

export default function ExportLaporan() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mitraId, setMitraId] = useState<number | undefined>();
  const [cabangId, setCabangId] = useState<number | undefined>();
  const [includeStock, setIncludeStock] = useState(true);
  const [includeSales, setIncludeSales] = useState(true);
  const [includeRevenue, setIncludeRevenue] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<DistributionHierarchyResponse | null>(null);
  const [availableCabang, setAvailableCabang] = useState<HierarchyUser[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const data = await backend.voucher.getHierarchyForDistribution();
        setHierarchyData(data);
        setAvailableCabang(data.cabang); // Initially show all cabang
      } catch (error) {
        console.error("Failed to fetch hierarchy data:", error);
        toast({ title: "Error", description: "Failed to load hierarchy options.", variant: "destructive" });
      }
    };
    fetchHierarchy();
  }, [toast]);

  useEffect(() => {
    if (mitraId && hierarchyData) {
      setAvailableCabang(hierarchyData.cabang.filter(c => c.parentId === mitraId));
      setCabangId(undefined); // Reset cabang selection
    } else if (hierarchyData) {
      setAvailableCabang(hierarchyData.cabang);
    }
  }, [mitraId, hierarchyData]);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select both a start and end date.',
        variant: 'destructive',
      });
      return;
    }
    if (!includeStock && !includeSales && !includeRevenue) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one report type to export.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await backend.exportService.report({
        startDate,
        endDate,
        mitraId,
        cabangId,
        includeStock,
        includeSales,
        includeRevenue,
      });

      // Decode base64 and trigger download
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

      toast({
        title: 'Export Successful',
        description: `${response.fileName} has been downloaded.`,
      });

    } catch (error: any) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'An unexpected error occurred during export.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Export Laporan ke Excel</h1>
          <p className="text-gray-600">Pilih rentang tanggal, filter hierarki, dan jenis laporan untuk diekspor.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Pengaturan Ekspor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Filters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Laporan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Dari Tanggal</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Sampai Tanggal</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mitra-id">Mitra Cabang</Label>
                  <Select value={mitraId?.toString() || ''} onValueChange={(value) => setMitraId(value ? parseInt(value) : undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Mitra Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Mitra Cabang</SelectItem>
                      {hierarchyData?.mitraCabang.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cabang-id">Cabang</Label>
                  <Select value={cabangId?.toString() || ''} onValueChange={(value) => setCabangId(value ? parseInt(value) : undefined)} disabled={!hierarchyData}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Cabang</SelectItem>
                      {availableCabang.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Filter Cabang aktif jika Mitra Cabang dipilih.</p>
                </div>
              </div>
            </div>

            {/* Report Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pilih Data untuk Diekspor</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-stock" checked={includeStock} onCheckedChange={(checked) => setIncludeStock(checked as boolean)} />
                  <Label htmlFor="include-stock" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Laporan Stok (Saat Ini)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-sales" checked={includeSales} onCheckedChange={(checked) => setIncludeSales(checked as boolean)} />
                  <Label htmlFor="include-sales" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Laporan Penjualan
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-revenue" checked={includeRevenue} onCheckedChange={(checked) => setIncludeRevenue(checked as boolean)} />
                  <Label htmlFor="include-revenue" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Laporan Pendapatan
                  </Label>
                </div>
              </div>
            </div>

            <Button onClick={handleExport} disabled={loading} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Mengekspor...' : 'Export ke Excel'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
