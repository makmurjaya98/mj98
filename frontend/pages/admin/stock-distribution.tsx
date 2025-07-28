import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Package, Users, ArrowRight } from 'lucide-react';
import backend from '~backend/client';
import type { DistributeStockRequest } from '~backend/voucher/distribute_stock';
import type { DistributionHierarchyResponse, HierarchyUser } from '~backend/voucher/get_hierarchy_for_distribution';

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

export default function StockDistribution() {
  const [formData, setFormData] = useState<FormData>({
    mitraCabangId: undefined,
    cabangId: undefined,
    linkId: undefined,
    voucherType: '',
    amount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<DistributionHierarchyResponse | null>(null);
  const [availableCabang, setAvailableCabang] = useState<HierarchyUser[]>([]);
  const [availableLinks, setAvailableLinks] = useState<HierarchyUser[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchHierarchyData = async () => {
      try {
        const data = await backend.voucher.getHierarchyForDistribution();
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
      const distributeData: DistributeStockRequest = {
        mitraCabangId: formData.mitraCabangId!,
        cabangId: formData.cabangId!,
        linkId: formData.linkId!,
        voucherType: formData.voucherType,
        amount: formData.amount,
      };

      const response = await backend.voucher.distributeStock(distributeData);

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

    } catch (error: any) {
      console.error('Stock distribution failed:', error);
      toast({
        title: 'Distribution Failed',
        description: error.message || 'Failed to distribute stock. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMitraCabang = hierarchyData?.mitraCabang.find(m => m.id === formData.mitraCabangId);
  const selectedCabang = availableCabang.find(c => c.id === formData.cabangId);
  const selectedLink = availableLinks.find(l => l.id === formData.linkId);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Stock Distribution</h1>
          <p className="text-gray-600">Distribute voucher stock to Links through the hierarchy</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Distribute Voucher Stock
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
                    {loading ? 'Distributing Stock...' : 'Distribute Stock'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Summary</CardTitle>
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
                      <h4 className="font-medium text-sm text-gray-600">Distribution Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Voucher Type:</span>
                          <span className="font-medium">
                            {VOUCHER_TYPES.find(t => t.value === formData.voucherType)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
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
      </div>
    </div>
  );
}
