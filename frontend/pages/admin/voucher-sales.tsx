import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ShoppingCart, Users, ArrowRight, TrendingUp, Calendar, Calculator, DollarSign } from 'lucide-react';
import backend from '~backend/client';
import type { AddSaleRequest } from '~backend/voucher/add_sale';
import type { StockHierarchyResponse, StockHierarchyUser } from '~backend/voucher/get_stock_hierarchy';
import type { RecentSalesResponse, SaleRecord } from '~backend/voucher/get_recent_sales';

interface FormData {
  mitraCabangId: number | undefined;
  cabangId: number | undefined;
  linkId: number | undefined;
  voucherType: string;
  quantity: number;
}

const VOUCHER_TYPES = [
  { value: "JM_2jam", label: "JM 2 Jam" },
  { value: "MJ_15jam", label: "MJ 15 Jam" },
  { value: "MJ_1hari", label: "MJ 1 Hari" },
  { value: "MJ_7hari", label: "MJ 7 Hari" },
  { value: "MJ_30hari", label: "MJ 30 Hari" },
];

export default function VoucherSales() {
  const [formData, setFormData] = useState<FormData>({
    mitraCabangId: undefined,
    cabangId: undefined,
    linkId: undefined,
    voucherType: '',
    quantity: 0,
  });

  const [loading, setLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<StockHierarchyResponse | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSalesResponse | null>(null);
  const [availableCabang, setAvailableCabang] = useState<StockHierarchyUser[]>([]);
  const [availableLinks, setAvailableLinks] = useState<StockHierarchyUser[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hierarchyResponse, salesResponse] = await Promise.all([
          backend.voucher.getStockHierarchy(),
          backend.voucher.getRecentSales()
        ]);
        setHierarchyData(hierarchyResponse);
        setRecentSales(salesResponse);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [toast]);

  useEffect(() => {
    if (formData.mitraCabangId && hierarchyData) {
      const filteredCabang = hierarchyData.cabang.filter(
        cabang => cabang.parentId === formData.mitraCabangId
      );
      setAvailableCabang(filteredCabang);
      
      // Reset cabang and link selections when mitra cabang changes
      setFormData(prev => ({
        ...prev,
        cabangId: undefined,
        linkId: undefined,
      }));
      setAvailableLinks([]);
    } else {
      setAvailableCabang([]);
      setAvailableLinks([]);
    }
  }, [formData.mitraCabangId, hierarchyData]);

  useEffect(() => {
    if (formData.cabangId && hierarchyData) {
      const filteredLinks = hierarchyData.links.filter(
        link => link.parentId === formData.cabangId
      );
      setAvailableLinks(filteredLinks);
      
      // Reset link selection when cabang changes
      setFormData(prev => ({
        ...prev,
        linkId: undefined,
      }));
    } else {
      setAvailableLinks([]);
    }
  }, [formData.cabangId, hierarchyData]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.mitraCabangId) return 'Please select a Mitra Cabang';
    if (!formData.cabangId) return 'Please select a Cabang';
    if (!formData.linkId) return 'Please select a Link';
    if (!formData.voucherType) return 'Please select a voucher type';
    if (formData.quantity <= 0) return 'Quantity must be greater than 0';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const saleData: AddSaleRequest = {
        mitraCabangId: formData.mitraCabangId!,
        cabangId: formData.cabangId!,
        linkId: formData.linkId!,
        voucherType: formData.voucherType,
        quantity: formData.quantity,
      };

      const response = await backend.voucher.addSale(saleData);

      let toastDescription = response.message;
      if (response.pendapatanCalculation) {
        toastDescription += `\n\nPendapatan Distribution:
        • Link: ${formatCurrency(response.pendapatanCalculation.pendapatanLink)}
        • Cabang: ${formatCurrency(response.pendapatanCalculation.pendapatanCabang)}
        • Mitra: ${formatCurrency(response.pendapatanCalculation.pendapatanMitra)}
        • Owner: ${formatCurrency(response.pendapatanCalculation.pendapatanOwner)}`;
      }

      toast({
        title: 'Success',
        description: toastDescription,
        variant: 'default',
      });

      // Reset form
      setFormData({
        mitraCabangId: undefined,
        cabangId: undefined,
        linkId: undefined,
        voucherType: '',
        quantity: 0,
      });
      setAvailableCabang([]);
      setAvailableLinks([]);

      // Refresh sales data
      const salesResponse = await backend.voucher.getRecentSales();
      setRecentSales(salesResponse);

    } catch (error: any) {
      console.error('Sale recording failed:', error);
      toast({
        title: 'Sale Recording Failed',
        description: error.message || 'Failed to record sale. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMitraCabang = hierarchyData?.mitraCabang.find(m => m.id === formData.mitraCabangId);
  const selectedCabang = availableCabang.find(c => c.id === formData.cabangId);
  const selectedLink = availableLinks.find(l => l.id === formData.linkId);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Voucher Sales Management</h1>
          <p className="text-gray-600">Record voucher sales and track performance with automatic pendapatan calculation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Record Voucher Sale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Hierarchy Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Select Hierarchy
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mitraCabang">Mitra Cabang</Label>
                        <Select 
                          value={formData.mitraCabangId?.toString() || ''} 
                          onValueChange={(value) => handleInputChange('mitraCabangId', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Mitra Cabang" />
                          </SelectTrigger>
                          <SelectContent>
                            {hierarchyData?.mitraCabang.map((mitra) => (
                              <SelectItem key={mitra.id} value={mitra.id.toString()}>
                                {mitra.fullName} (@{mitra.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cabang">Cabang</Label>
                        <Select 
                          value={formData.cabangId?.toString() || ''} 
                          onValueChange={(value) => handleInputChange('cabangId', parseInt(value))}
                          disabled={!formData.mitraCabangId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Cabang" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCabang.map((cabang) => (
                              <SelectItem key={cabang.id} value={cabang.id.toString()}>
                                {cabang.fullName} (@{cabang.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="link">Link</Label>
                        <Select 
                          value={formData.linkId?.toString() || ''} 
                          onValueChange={(value) => handleInputChange('linkId', parseInt(value))}
                          disabled={!formData.cabangId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Link" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLinks.map((link) => (
                              <SelectItem key={link.id} value={link.id.toString()}>
                                {link.fullName} (@{link.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Sale Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Sale Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="voucherType">Voucher Type</Label>
                        <Select 
                          value={formData.voucherType} 
                          onValueChange={(value) => handleInputChange('voucherType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select voucher type" />
                          </SelectTrigger>
                          <SelectContent>
                            {VOUCHER_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Sold</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity || ''}
                          onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                          placeholder="Enter quantity sold"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Recording Sale...' : 'Record Sale'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Sale Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-600">Hierarchy Path</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">Mitra Cabang:</span>
                        <span>{selectedMitraCabang?.fullName || 'Not selected'}</span>
                      </div>
                      {selectedMitraCabang && (
                        <div className="ml-4">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Cabang:</span>
                        <span>{selectedCabang?.fullName || 'Not selected'}</span>
                      </div>
                      {selectedCabang && (
                        <div className="ml-4">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">Link:</span>
                        <span>{selectedLink?.fullName || 'Not selected'}</span>
                      </div>
                    </div>
                  </div>

                  {formData.voucherType && formData.quantity > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-medium text-sm text-gray-600">Sale Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Voucher Type:</span>
                          <span className="font-medium">
                            {VOUCHER_TYPES.find(t => t.value === formData.voucherType)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span className="font-medium">{formData.quantity} vouchers</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        Pendapatan will be calculated automatically based on pricing configuration
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Sales with Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales && recentSales.sales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Voucher Type</th>
                      <th className="text-left p-2 font-medium">Qty</th>
                      <th className="text-left p-2 font-medium">Link</th>
                      <th className="text-left p-2 font-medium">Cabang</th>
                      <th className="text-left p-2 font-medium">Link Revenue</th>
                      <th className="text-left p-2 font-medium">Cabang Revenue</th>
                      <th className="text-left p-2 font-medium">Mitra Commission</th>
                      <th className="text-left p-2 font-medium">Owner Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.sales.map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">{formatDate(sale.createdAt)}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {VOUCHER_TYPES.find(t => t.value === sale.voucherType)?.label || sale.voucherType}
                          </span>
                        </td>
                        <td className="p-2 font-medium">{sale.quantitySold}</td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium text-xs">{sale.linkName}</div>
                            <div className="text-xs text-gray-500">@{sale.linkUsername}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-xs">{sale.cabangName}</div>
                        </td>
                        <td className="p-2">
                          <span className="text-blue-600 font-medium">
                            {sale.totalPendapatanLink > 0 ? formatCurrency(sale.totalPendapatanLink) : '-'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-green-600 font-medium">
                            {sale.totalPendapatanCabang > 0 ? formatCurrency(sale.totalPendapatanCabang) : '-'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-orange-600 font-medium">
                            {sale.komisiMitra > 0 ? formatCurrency(sale.komisiMitra) : '-'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-purple-600 font-medium">
                            {sale.pendapatanOwner > 0 ? formatCurrency(sale.pendapatanOwner) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Recorded</h3>
                <p className="text-gray-500">No voucher sales have been recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
