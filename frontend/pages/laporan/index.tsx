import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { FileSpreadsheet, Calendar, Filter, Package, TrendingUp, DollarSign, Download } from 'lucide-react';
import backend from '~backend/client';
import type { LaporanResponse, StokVoucherItem, PenjualanVoucherItem, PendapatanVoucherItem } from '~backend/voucher/get_laporan';
import type { StockHierarchyResponse, StockHierarchyUser } from '~backend/voucher/get_stock_hierarchy';

interface FilterData {
  fromDate: string;
  toDate: string;
  mitraCabangId: number | undefined;
  cabangId: number | undefined;
  linkId: number | undefined;
}

const VOUCHER_TYPES = [
  { value: "JM_2jam", label: "JM 2 Jam" },
  { value: "MJ_15jam", label: "MJ 15 Jam" },
  { value: "MJ_1hari", label: "MJ 1 Hari" },
  { value: "MJ_7hari", label: "MJ 7 Hari" },
  { value: "MJ_30hari", label: "MJ 30 Hari" },
];

export default function Laporan() {
  const [filterData, setFilterData] = useState<FilterData>({
    fromDate: '',
    toDate: '',
    mitraCabangId: undefined,
    cabangId: undefined,
    linkId: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [laporanData, setLaporanData] = useState<LaporanResponse | null>(null);
  const [hierarchyData, setHierarchyData] = useState<StockHierarchyResponse | null>(null);
  const [availableCabang, setAvailableCabang] = useState<StockHierarchyUser[]>([]);
  const [availableLinks, setAvailableLinks] = useState<StockHierarchyUser[]>([]);
  const [activeTab, setActiveTab] = useState('stok');

  const { toast } = useToast();

  useEffect(() => {
    const fetchHierarchyData = async () => {
      try {
        const data = await backend.voucher.getStockHierarchy();
        setHierarchyData(data);
      } catch (error) {
        console.error('Failed to fetch hierarchy data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load hierarchy data. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchHierarchyData();
  }, [toast]);

  useEffect(() => {
    if (filterData.mitraCabangId && hierarchyData) {
      const filteredCabang = hierarchyData.cabang.filter(
        cabang => cabang.parentId === filterData.mitraCabangId
      );
      setAvailableCabang(filteredCabang);
      
      setFilterData(prev => ({
        ...prev,
        cabangId: undefined,
        linkId: undefined,
      }));
      setAvailableLinks([]);
    } else {
      setAvailableCabang([]);
      setAvailableLinks([]);
    }
  }, [filterData.mitraCabangId, hierarchyData]);

  useEffect(() => {
    if (filterData.cabangId && hierarchyData) {
      const filteredLinks = hierarchyData.links.filter(
        link => link.parentId === filterData.cabangId
      );
      setAvailableLinks(filteredLinks);
      
      setFilterData(prev => ({
        ...prev,
        linkId: undefined,
      }));
    } else {
      setAvailableLinks([]);
    }
  }, [filterData.cabangId, hierarchyData]);

  const handleFilterChange = (field: keyof FilterData, value: string | number | undefined) => {
    setFilterData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateReport = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      
      if (filterData.fromDate) params.append('fromDate', filterData.fromDate);
      if (filterData.toDate) params.append('toDate', filterData.toDate);
      if (filterData.mitraCabangId) params.append('mitraCabangId', filterData.mitraCabangId.toString());
      if (filterData.cabangId) params.append('cabangId', filterData.cabangId.toString());
      if (filterData.linkId) params.append('linkId', filterData.linkId.toString());

      const response = await fetch(`/voucher/laporan?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      
      const data: LaporanResponse = await response.json();
      setLaporanData(data);

      toast({
        title: 'Success',
        description: 'Report generated successfully!',
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Report Generation Failed',
        description: error.message || 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        let value = row[key] || '';
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStok = () => {
    if (!laporanData?.stokVoucher.length) {
      toast({
        title: 'No Data',
        description: 'No stock data to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Tanggal', 'Jenis Voucher', 'Link', 'Cabang', 'Stok Tersisa'];
    const exportData = laporanData.stokVoucher.map(item => ({
      tanggal: formatDate(item.tanggal),
      jenisvoucher: getVoucherLabel(item.jenisVoucher),
      link: `${item.linkName} (@${item.linkUsername})`,
      cabang: item.cabangName,
      stoktersisa: item.stokTersisa,
    }));

    exportToCSV(exportData, 'laporan-stok-voucher', headers);
  };

  const handleExportPenjualan = () => {
    if (!laporanData?.penjualanVoucher.length) {
      toast({
        title: 'No Data',
        description: 'No sales data to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Tanggal', 'Jenis Voucher', 'Link', 'Cabang', 'Jumlah Terjual'];
    const exportData = laporanData.penjualanVoucher.map(item => ({
      tanggal: formatDate(item.tanggal),
      jenisvoucher: getVoucherLabel(item.jenisVoucher),
      link: `${item.linkName} (@${item.linkUsername})`,
      cabang: item.cabangName,
      jumlahterjual: item.jumlahTerjual,
    }));

    exportToCSV(exportData, 'laporan-penjualan-voucher', headers);
  };

  const handleExportPendapatan = () => {
    if (!laporanData?.pendapatanVoucher.length) {
      toast({
        title: 'No Data',
        description: 'No revenue data to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Tanggal', 'Jenis Voucher', 'Link', 'Cabang', 'Harga Pokok', 'Harga Jual', 'Fee Link', 'Fee Cabang', 'Komisi Mitra', 'Pendapatan Bersih'];
    const exportData = laporanData.pendapatanVoucher.map(item => ({
      tanggal: formatDate(item.tanggal),
      jenisvoucher: getVoucherLabel(item.jenisVoucher),
      link: `${item.linkName} (@${item.linkUsername})`,
      cabang: item.cabangName,
      hargapokok: formatCurrency(item.hargaPokok),
      hargajual: formatCurrency(item.hargaJual),
      feelink: formatCurrency(item.feeLink),
      feecabang: formatCurrency(item.feeCabang),
      komisimitra: formatCurrency(item.komisiMitra),
      pendapatanbersih: formatCurrency(item.pendapatanBersih),
    }));

    exportToCSV(exportData, 'laporan-pendapatan-voucher', headers);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVoucherLabel = (voucherType: string) => {
    return VOUCHER_TYPES.find(t => t.value === voucherType)?.label || voucherType;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getLastWeekDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Laporan Voucher</h1>
          <p className="text-gray-600">Comprehensive voucher reports including stock, sales, and revenue</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">Dari Tanggal</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fromDate"
                    type="date"
                    value={filterData.fromDate}
                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDate">Sampai Tanggal</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="toDate"
                    type="date"
                    value={filterData.toDate}
                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mitraCabang">Mitra Cabang</Label>
                <Select 
                  value={filterData.mitraCabangId?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('mitraCabangId', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Mitra Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Mitra Cabang</SelectItem>
                    {hierarchyData?.mitraCabang.map((mitra) => (
                      <SelectItem key={mitra.id} value={mitra.id.toString()}>
                        {mitra.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cabang">Cabang</Label>
                <Select 
                  value={filterData.cabangId?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('cabangId', value ? parseInt(value) : undefined)}
                  disabled={!filterData.mitraCabangId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Cabang</SelectItem>
                    {availableCabang.map((cabang) => (
                      <SelectItem key={cabang.id} value={cabang.id.toString()}>
                        {cabang.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link</Label>
                <Select 
                  value={filterData.linkId?.toString() || ''} 
                  onValueChange={(value) => handleFilterChange('linkId', value ? parseInt(value) : undefined)}
                  disabled={!filterData.cabangId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Link</SelectItem>
                    {availableLinks.map((link) => (
                      <SelectItem key={link.id} value={link.id.toString()}>
                        {link.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Laporan'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterData({
                    fromDate: getLastWeekDate(),
                    toDate: getTodayDate(),
                    mitraCabangId: undefined,
                    cabangId: undefined,
                    linkId: undefined,
                  });
                }}
              >
                Last 7 Days
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterData({
                    fromDate: '',
                    toDate: '',
                    mitraCabangId: undefined,
                    cabangId: undefined,
                    linkId: undefined,
                  });
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stok" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stok Voucher
            </TabsTrigger>
            <TabsTrigger value="penjualan" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Voucher Terjual
            </TabsTrigger>
            <TabsTrigger value="pendapatan" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pendapatan
            </TabsTrigger>
          </TabsList>

          {/* Stok Voucher Tab */}
          <TabsContent value="stok">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Laporan Stok Voucher
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={handleExportStok}
                  disabled={!laporanData?.stokVoucher.length}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {laporanData?.stokVoucher.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Tanggal</th>
                          <th className="text-left p-3 font-medium">Jenis Voucher</th>
                          <th className="text-left p-3 font-medium">Link</th>
                          <th className="text-left p-3 font-medium">Cabang</th>
                          <th className="text-left p-3 font-medium">Mitra Cabang</th>
                          <th className="text-left p-3 font-medium">Stok Tersisa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laporanData.stokVoucher.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{formatDate(item.tanggal)}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getVoucherLabel(item.jenisVoucher)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{item.linkName}</div>
                                <div className="text-sm text-gray-500">@{item.linkUsername}</div>
                              </div>
                            </td>
                            <td className="p-3 font-medium">{item.cabangName}</td>
                            <td className="p-3 font-medium">{item.mitraCabangName}</td>
                            <td className="p-3 font-bold text-green-600">{item.stokTersisa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Data</h3>
                    <p className="text-gray-500">No stock data found for the selected filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Penjualan Tab */}
          <TabsContent value="penjualan">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Laporan Penjualan Voucher
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={handleExportPenjualan}
                  disabled={!laporanData?.penjualanVoucher.length}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {laporanData?.penjualanVoucher.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Tanggal</th>
                          <th className="text-left p-3 font-medium">Jenis Voucher</th>
                          <th className="text-left p-3 font-medium">Link</th>
                          <th className="text-left p-3 font-medium">Cabang</th>
                          <th className="text-left p-3 font-medium">Mitra Cabang</th>
                          <th className="text-left p-3 font-medium">Jumlah Terjual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laporanData.penjualanVoucher.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{formatDate(item.tanggal)}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {getVoucherLabel(item.jenisVoucher)}
                              </span>
                            </td>
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{item.linkName}</div>
                                <div className="text-sm text-gray-500">@{item.linkUsername}</div>
                              </div>
                            </td>
                            <td className="p-3 font-medium">{item.cabangName}</td>
                            <td className="p-3 font-medium">{item.mitraCabangName}</td>
                            <td className="p-3 font-bold text-blue-600">{item.jumlahTerjual}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h3>
                    <p className="text-gray-500">No sales data found for the selected filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pendapatan Tab */}
          <TabsContent value="pendapatan">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Laporan Pendapatan
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={handleExportPendapatan}
                  disabled={!laporanData?.pendapatanVoucher.length}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {laporanData?.pendapatanVoucher.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Tanggal</th>
                          <th className="text-left p-2 font-medium">Jenis Voucher</th>
                          <th className="text-left p-2 font-medium">Link</th>
                          <th className="text-left p-2 font-medium">Cabang</th>
                          <th className="text-left p-2 font-medium">Qty</th>
                          <th className="text-left p-2 font-medium">Harga Pokok</th>
                          <th className="text-left p-2 font-medium">Harga Jual</th>
                          <th className="text-left p-2 font-medium">Fee Link</th>
                          <th className="text-left p-2 font-medium">Fee Cabang</th>
                          <th className="text-left p-2 font-medium">Komisi Mitra</th>
                          <th className="text-left p-2 font-medium">Pendapatan Bersih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laporanData.pendapatanVoucher.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">{formatDate(item.tanggal)}</td>
                            <td className="p-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {getVoucherLabel(item.jenisVoucher)}
                              </span>
                            </td>
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{item.linkName}</div>
                                <div className="text-xs text-gray-500">@{item.linkUsername}</div>
                              </div>
                            </td>
                            <td className="p-2 font-medium">{item.cabangName}</td>
                            <td className="p-2 font-bold">{item.jumlahTerjual}</td>
                            <td className="p-2">{formatCurrency(item.hargaPokok)}</td>
                            <td className="p-2">{formatCurrency(item.hargaJual)}</td>
                            <td className="p-2 text-blue-600">{formatCurrency(item.feeLink)}</td>
                            <td className="p-2 text-green-600">{formatCurrency(item.feeCabang)}</td>
                            <td className="p-2 text-orange-600">{formatCurrency(item.komisiMitra)}</td>
                            <td className="p-2 font-bold text-purple-600">{formatCurrency(item.pendapatanBersih)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Revenue Data</h3>
                    <p className="text-gray-500">No revenue data found for the selected filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
