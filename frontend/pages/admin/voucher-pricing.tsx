import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, Percent, Calculator } from 'lucide-react';
import backend from '~backend/client';
import type { SetVoucherPricingRequest } from '~backend/voucher/set_pricing';
import type { HierarchyOptionsResponse } from '~backend/auth/get_hierarchy_options';

interface FormData {
  cabangId: number | undefined;
  voucherType: string;
  hargaPokok: number;
  hargaJual: number;
  shareHargaCabang: number;
  feeCabangPct: number;
  feeLinkPct: number;
  komisiMitraPct: number;
}

const VOUCHER_TYPES = [
  { value: "JM_2jam", label: "JM 2 Jam" },
  { value: "MJ_15jam", label: "MJ 15 Jam" },
  { value: "MJ_1hari", label: "MJ 1 Hari" },
  { value: "MJ_7hari", label: "MJ 7 Hari" },
  { value: "MJ_30hari", label: "MJ 30 Hari" },
];

export default function VoucherPricing() {
  const [formData, setFormData] = useState<FormData>({
    cabangId: undefined,
    voucherType: '',
    hargaPokok: 0,
    hargaJual: 0,
    shareHargaCabang: 0,
    feeCabangPct: 0,
    feeLinkPct: 0,
    komisiMitraPct: 0,
  });

  const [loading, setLoading] = useState(false);
  const [hierarchyOptions, setHierarchyOptions] = useState<HierarchyOptionsResponse | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const fetchHierarchyOptions = async () => {
      try {
        const options = await backend.auth.getHierarchyOptions();
        setHierarchyOptions(options);
      } catch (error) {
        console.error('Failed to fetch hierarchy options:', error);
        toast({
          title: 'Error',
          description: 'Failed to load Cabang options. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchHierarchyOptions();
  }, [toast]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.cabangId) return 'Please select a Cabang';
    if (!formData.voucherType) return 'Please select a voucher type';
    if (formData.hargaPokok <= 0) return 'Harga Pokok must be greater than 0';
    if (formData.hargaJual <= 0) return 'Harga Jual must be greater than 0';
    if (formData.shareHargaCabang <= 0) return 'Share Harga Cabang must be greater than 0';
    
    if (formData.hargaJual <= formData.hargaPokok) {
      return 'Harga Jual must be greater than Harga Pokok';
    }
    if (formData.shareHargaCabang > formData.hargaJual) {
      return 'Share Harga Cabang cannot be greater than Harga Jual';
    }

    const totalPercentage = formData.feeCabangPct + formData.feeLinkPct + formData.komisiMitraPct;
    if (totalPercentage > 100) {
      return 'Total of all percentages cannot exceed 100%';
    }

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
      const pricingData: SetVoucherPricingRequest = {
        cabangId: formData.cabangId!,
        voucherType: formData.voucherType,
        hargaPokok: formData.hargaPokok,
        hargaJual: formData.hargaJual,
        shareHargaCabang: formData.shareHargaCabang,
        feeCabangPct: formData.feeCabangPct,
        feeLinkPct: formData.feeLinkPct,
        komisiMitraPct: formData.komisiMitraPct,
      };

      const response = await backend.voucher.setVoucherPricing(pricingData);

      toast({
        title: 'Success',
        description: response.message,
        variant: 'default',
      });

      // Reset form
      setFormData({
        cabangId: undefined,
        voucherType: '',
        hargaPokok: 0,
        hargaJual: 0,
        shareHargaCabang: 0,
        feeCabangPct: 0,
        feeLinkPct: 0,
        komisiMitraPct: 0,
      });

    } catch (error: any) {
      console.error('Pricing configuration failed:', error);
      toast({
        title: 'Configuration Failed',
        description: error.message || 'Failed to configure pricing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCabang = hierarchyOptions?.cabang.find(c => c.id === formData.cabangId);
  const totalPercentage = formData.feeCabangPct + formData.feeLinkPct + formData.komisiMitraPct;
  const profit = formData.hargaJual - formData.hargaPokok;
  const remainingPercentage = 100 - totalPercentage;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Voucher Pricing Configuration</h1>
          <p className="text-gray-600">Configure pricing structure for vouchers per Cabang</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Set Voucher Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cabang">Cabang</Label>
                        <Select 
                          value={formData.cabangId?.toString() || ''} 
                          onValueChange={(value) => handleInputChange('cabangId', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Cabang" />
                          </SelectTrigger>
                          <SelectContent>
                            {hierarchyOptions?.cabang.map((cabang) => (
                              <SelectItem key={cabang.id} value={cabang.id.toString()}>
                                {cabang.fullName} (@{cabang.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Structure
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hargaPokok">Harga Pokok (Rp)</Label>
                        <Input
                          id="hargaPokok"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.hargaPokok || ''}
                          onChange={(e) => handleInputChange('hargaPokok', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hargaJual">Harga Jual (Rp)</Label>
                        <Input
                          id="hargaJual"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.hargaJual || ''}
                          onChange={(e) => handleInputChange('hargaJual', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shareHargaCabang">Share Harga Cabang (Rp)</Label>
                        <Input
                          id="shareHargaCabang"
                          type="number"
                          min="0"
                          step="100"
                          value={formData.shareHargaCabang || ''}
                          onChange={(e) => handleInputChange('shareHargaCabang', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Percentages */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Fee Structure (%)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="feeCabangPct">Fee Cabang (%)</Label>
                        <Input
                          id="feeCabangPct"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.feeCabangPct || ''}
                          onChange={(e) => handleInputChange('feeCabangPct', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="feeLinkPct">Fee Link (%)</Label>
                        <Input
                          id="feeLinkPct"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.feeLinkPct || ''}
                          onChange={(e) => handleInputChange('feeLinkPct', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="komisiMitraPct">Komisi Mitra (%)</Label>
                        <Input
                          id="komisiMitraPct"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.komisiMitraPct || ''}
                          onChange={(e) => handleInputChange('komisiMitraPct', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      Total percentage: {totalPercentage.toFixed(1)}% 
                      {totalPercentage > 100 && (
                        <span className="text-red-500 ml-2">⚠ Exceeds 100%</span>
                      )}
                      {totalPercentage <= 100 && (
                        <span className="text-green-500 ml-2">
                          (Remaining: {remainingPercentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Saving Configuration...' : 'Save Pricing Configuration'}
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
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-600">Configuration For</h4>
                    <div className="text-sm">
                      <div className="font-medium">
                        {selectedCabang?.fullName || 'No Cabang selected'}
                      </div>
                      <div className="text-gray-500">
                        {formData.voucherType ? 
                          VOUCHER_TYPES.find(t => t.value === formData.voucherType)?.label : 
                          'No voucher type selected'
                        }
                      </div>
                    </div>
                  </div>

                  {formData.hargaPokok > 0 && formData.hargaJual > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-medium text-sm text-gray-600">Financial Breakdown</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Harga Pokok:</span>
                          <span>Rp {formData.hargaPokok.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Harga Jual:</span>
                          <span>Rp {formData.hargaJual.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Profit:</span>
                          <span className={profit > 0 ? 'text-green-600' : 'text-red-600'}>
                            Rp {profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Share Cabang:</span>
                          <span>Rp {formData.shareHargaCabang.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {totalPercentage > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <h4 className="font-medium text-sm text-gray-600">Fee Distribution</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Fee Cabang:</span>
                          <span>{formData.feeCabangPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee Link:</span>
                          <span>{formData.feeLinkPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Komisi Mitra:</span>
                          <span>{formData.komisiMitraPct}%</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>Total:</span>
                          <span className={totalPercentage > 100 ? 'text-red-600' : 'text-green-600'}>
                            {totalPercentage.toFixed(1)}%
                          </span>
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
