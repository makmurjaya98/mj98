import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Package, Users, ArrowRight, Plus, Eye, Warehouse } from 'lucide-react';
import backend from '~backend/client';
import type { AddStockRequest } from '~backend/voucher/add_stock';
import type { StockHierarchyResponse, StockHierarchyUser } from '~backend/voucher/get_stock_hierarchy';
import type { CurrentStockResponse, CurrentStockItem } from '~backend/voucher/get_current_stock';

interface FormData {
  mitraCabangId: number | undefined;
  cabangId: number | undefined;
  linkId: number | undefined;
  voucherType: string;
  amount: number;
}

const VOUCHER_TYPES = [
  { value: "JM_2jam", label: "JM 2 Jam" },
  { value: "MJ_15jam", label: "MJ 15 Jam" },
  { value: "MJ_1hari", label: "MJ 1 Hari" },
  { value: "MJ_7hari", label: "MJ 7 Hari" },
  { value: "MJ_30hari", label: "MJ 30 Hari" },
];

export default function StockManagement() {
  const [formData, setFormData] = useState<FormData>({
    mitraCabangId: undefined,
    cabangId: undefined,
    linkId: undefined,
    voucherType: '',
    amount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<StockHierarchyResponse | null>(null);
  const [currentStock, setCurrentStock] = useState<CurrentStockResponse | null>(null);
  const [availableCabang, setAvailableCabang] = useState<StockHierarchyUser[]>([]);
  const [availableLinks, setAvailableLinks] = useState<StockHierarchyUser[]>([]);
  const [showCurrentStock, setShowCurrentStock] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hierarchyResponse, stockResponse] = await Promise.all([
          backend.voucher.getStockHierarchy(),
          backend.voucher.getCurrentStock()
        ]);
        setHierarchyData(hierarchyResponse);
        setCurrentStock(stockResponse);
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
    if (formData.amount <= 0) return 'Amount must be greater than 0';
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
      const addStockData: AddStockRequest = {
        mitraCabangId: formData.mitraCabangId!,
        cabangId: formData.cabangId!,
        linkId: formData.linkId!,
        voucherType: formData.voucherType,
        amount: formData.amount,
      };

      const response = await backend.voucher.addStock(addStockData);

      toast({
        title: 'Success',
        description: response.message,
        variant: 'default',
      });

      // Reset form
      setFormData({
        mitraCabangId: undefined,
        cabangId: undefined,
        linkId: undefined,
        voucherType: '',
        amount: 0,
      });
      setAvailableCabang([]);
      setAvailableLinks([]);

      // Refresh current stock data
      const stockResponse = await backend.voucher.getCurrentStock();
      setCurrentStock(stockResponse);

    } catch (error: any) {
      console.error('Stock addition failed:', error);
      toast({
        title: 'Stock Addition Failed',
        description: error.message || 'Failed to add stock. Please try again.',
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Voucher Stock Management</h1>
            <p className="text-gray-600">Add voucher stock to Links through the hierarchy</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowCurrentStock(!showCurrentStock)}
            className="flex items-center gap-2"
          >
            {showCurrentStock ? <Plus className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showCurrentStock ? 'Add Stock' : 'View Current Stock'}
          </Button>
        </div>

        {!showCurrentStock ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Add Voucher Stock
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

                    {/* Voucher Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Voucher Details
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
                          <Label htmlFor="amount">Stock Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            value={formData.amount || ''}
                            onChange={(e) => handleInputChange('amount', parseInt(e.target.value) || 0)}
                            placeholder="Enter stock amount"
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
                      {loading ? 'Adding Stock...' : 'Add Stock'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Addition Summary</CardTitle>
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

                    {formData.voucherType && formData.amount > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium text-sm text-gray-600">Stock Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Voucher Type:</span>
                            <span className="font-medium">
                              {VOUCHER_TYPES.find(t => t.value === formData.voucherType)?.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount to Add:</span>
                            <span className="font-medium">{formData.amount} vouchers</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Current Stock View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Current Stock Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStock && currentStock.stocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Voucher Type</th>
                        <th className="text-left p-3 font-medium">Amount</th>
                        <th className="text-left p-3 font-medium">Link</th>
                        <th className="text-left p-3 font-medium">Cabang</th>
                        <th className="text-left p-3 font-medium">Mitra Cabang</th>
                        <th className="text-left p-3 font-medium">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStock.stocks.map((stock) => (
                        <tr key={stock.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {VOUCHER_TYPES.find(t => t.value === stock.voucherType)?.label || stock.voucherType}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{stock.amount}</td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{stock.linkName}</div>
                              <div className="text-sm text-gray-500">@{stock.linkUsername}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{stock.cabangName}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{stock.mitraCabangName}</div>
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {formatDate(stock.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Available</h3>
                  <p className="text-gray-500">No voucher stock has been added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
