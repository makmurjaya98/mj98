import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Calculator, DollarSign, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';
import backend from '~backend/client';
import type { CalculatePendapatanRequest, CalculatePendapatanResponse } from '~backend/voucher/calculate_pendapatan';
import type { TestCalculatePendapatanResponse } from '~backend/voucher/test_calculate_pendapatan';

interface FormData {
  jumlahTerjual: number;
  hargaPokok: number;
  hargaJual: number;
  shareHarga: number;
  feeLinkPercent: number;
  feeCabangPercent: number;
  komisiMitraPercent: number;
}

export default function CalculatePendapatan() {
  const [formData, setFormData] = useState<FormData>({
    jumlahTerjual: 1,
    hargaPokok: 10000,
    hargaJual: 20000,
    shareHarga: 4000,
    feeLinkPercent: 5,
    feeCabangPercent: 10,
    komisiMitraPercent: 5,
  });

  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculatePendapatanResponse | null>(null);
  const [testResult, setTestResult] = useState<TestCalculatePendapatanResponse | null>(null);

  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (formData.jumlahTerjual <= 0) return 'Jumlah terjual must be greater than 0';
    if (formData.hargaPokok <= 0) return 'Harga pokok must be greater than 0';
    if (formData.hargaJual <= 0) return 'Harga jual must be greater than 0';
    if (formData.shareHarga < 0) return 'Share harga cannot be negative';
    if (formData.feeLinkPercent < 0 || formData.feeLinkPercent > 100) return 'Fee link percent must be between 0 and 100';
    if (formData.feeCabangPercent < 0 || formData.feeCabangPercent > 100) return 'Fee cabang percent must be between 0 and 100';
    if (formData.komisiMitraPercent < 0 || formData.komisiMitraPercent > 100) return 'Komisi mitra percent must be between 0 and 100';
    
    if (formData.hargaJual <= formData.hargaPokok) return 'Harga jual must be greater than harga pokok';
    if (formData.shareHarga > formData.hargaJual) return 'Share harga cannot be greater than harga jual';
    
    const totalPercentage = formData.feeLinkPercent + formData.feeCabangPercent + formData.komisiMitraPercent;
    if (totalPercentage > 100) return 'Total of all percentages cannot exceed 100%';
    
    return null;
  };

  const handleCalculate = async () => {
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
      const request: CalculatePendapatanRequest = {
        jumlahTerjual: formData.jumlahTerjual,
        hargaPokok: formData.hargaPokok,
        hargaJual: formData.hargaJual,
        shareHarga: formData.shareHarga,
        feeLinkPercent: formData.feeLinkPercent,
        feeCabangPercent: formData.feeCabangPercent,
        komisiMitraPercent: formData.komisiMitraPercent,
      };

      const response = await backend.voucher.calculatePendapatanPreview(request);
      setCalculationResult(response);

      toast({
        title: 'Success',
        description: 'Pendapatan calculation completed successfully!',
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Calculation failed:', error);
      toast({
        title: 'Calculation Failed',
        description: error.message || 'Failed to calculate pendapatan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async () => {
    setTestLoading(true);

    try {
      const response = await backend.voucher.testCalculatePendapatan();
      setTestResult(response);

      toast({
        title: response.testPassed ? 'Test Passed' : 'Test Failed',
        description: response.testPassed 
          ? 'All calculations match expected results!' 
          : 'Some calculations do not match expected results.',
        variant: response.testPassed ? 'default' : 'destructive',
      });

    } catch (error: any) {
      console.error('Test failed:', error);
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to run test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPercentage = formData.feeLinkPercent + formData.feeCabangPercent + formData.komisiMitraPercent;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Calculate Pendapatan</h1>
          <p className="text-gray-600">Test and preview automatic financial distribution calculations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculation Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jumlahTerjual">Jumlah Terjual</Label>
                    <Input
                      id="jumlahTerjual"
                      type="number"
                      min="1"
                      value={formData.jumlahTerjual}
                      onChange={(e) => handleInputChange('jumlahTerjual', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hargaPokok">Harga Pokok (HP)</Label>
                    <Input
                      id="hargaPokok"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.hargaPokok}
                      onChange={(e) => handleInputChange('hargaPokok', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hargaJual">Harga Jual (HJ)</Label>
                    <Input
                      id="hargaJual"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.hargaJual}
                      onChange={(e) => handleInputChange('hargaJual', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shareHarga">Share Harga (SH)</Label>
                    <Input
                      id="shareHarga"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.shareHarga}
                      onChange={(e) => handleInputChange('shareHarga', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feeLinkPercent">Fee Link (%)</Label>
                    <Input
                      id="feeLinkPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.feeLinkPercent}
                      onChange={(e) => handleInputChange('feeLinkPercent', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feeCabangPercent">Fee Cabang (%)</Label>
                    <Input
                      id="feeCabangPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.feeCabangPercent}
                      onChange={(e) => handleInputChange('feeCabangPercent', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="komisiMitraPercent">Komisi Mitra (%)</Label>
                    <Input
                      id="komisiMitraPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.komisiMitraPercent}
                      onChange={(e) => handleInputChange('komisiMitraPercent', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Total percentage: {totalPercentage.toFixed(1)}% 
                  {totalPercentage > 100 && (
                    <span className="text-red-500 ml-2">⚠ Exceeds 100%</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCalculate} disabled={loading} className="flex-1">
                    {loading ? 'Calculating...' : 'Calculate Pendapatan'}
                  </Button>
                  <Button onClick={handleRunTest} disabled={testLoading} variant="outline">
                    {testLoading ? 'Testing...' : 'Run Test Case'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Calculation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calculationResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Pendapatan Link</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(calculationResult.result.pendapatanLink)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Pendapatan Cabang</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(calculationResult.result.pendapatanCabang)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Pendapatan Mitra</div>
                      <div className="text-lg font-bold text-orange-600">
                        {formatCurrency(calculationResult.result.pendapatanMitra)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Pendapatan Owner</div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(calculationResult.result.pendapatanOwner)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Fee Breakdown</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Fee Link:</span>
                        <div className="font-medium">{formatCurrency(calculationResult.result.feeLink)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Fee Cabang:</span>
                        <div className="font-medium">{formatCurrency(calculationResult.result.feeCabang)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Komisi Mitra:</span>
                        <div className="font-medium">{formatCurrency(calculationResult.result.komisiMitra)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Calculation Yet</h3>
                  <p className="text-gray-500">Enter parameters and click calculate to see results.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.testPassed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Test Case Results
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  testResult.testPassed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {testResult.testPassed ? 'PASSED' : 'FAILED'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Test Case Parameters</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">HP:</span>
                      <div className="font-medium">{formatCurrency(testResult.testCase.hargaPokok)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">HJ:</span>
                      <div className="font-medium">{formatCurrency(testResult.testCase.hargaJual)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">SH:</span>
                      <div className="font-medium">{formatCurrency(testResult.testCase.shareHarga)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Qty:</span>
                      <div className="font-medium">{testResult.testCase.jumlahTerjual}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                    <div>
                      <span className="text-gray-500">Fee Link:</span>
                      <div className="font-medium">{testResult.testCase.feeLinkPercent}%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Fee Cabang:</span>
                      <div className="font-medium">{testResult.testCase.feeCabangPercent}%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Komisi Mitra:</span>
                      <div className="font-medium">{testResult.testCase.komisiMitraPercent}%</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Expected Results</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Pendapatan Link:</span>
                        <span className="font-medium">{formatCurrency(testResult.expectedResult.pendapatanLink)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendapatan Cabang:</span>
                        <span className="font-medium">{formatCurrency(testResult.expectedResult.pendapatanCabang)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendapatan Mitra:</span>
                        <span className="font-medium">{formatCurrency(testResult.expectedResult.pendapatanMitra)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendapatan Owner:</span>
                        <span className="font-medium">{formatCurrency(testResult.expectedResult.pendapatanOwner)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Actual Results</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Pendapatan Link:</span>
                        <span className={`font-medium ${
                          testResult.actualResult.pendapatanLink === testResult.expectedResult.pendapatanLink 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(testResult.actualResult.pendapatanLink)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendapatan Cabang:</span>
                        <span className={`font-medium ${
                          testResult.actualResult.pendapatanCabang === testResult.expectedResult.pendapatanCabang 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(testResult.actualResult.pendapatanCabang)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendapatan Mitra:</span>
                        <span className={`font-medium ${
                          testResult.actualResult.pendapatanMitra === testResult.expectedResult.pendapatanMitra 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(testResult.actualResult.pendapatanMitra)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pendapatan Owner:</span>
                        <span className={`font-medium ${
                          testResult.actualResult.pendapatanOwner === testResult.expectedResult.pendapatanOwner 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(testResult.actualResult.pendapatanOwner)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Calculation Breakdown</h4>
                  <div className="space-y-1 text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded">
                    <div>Link: {testResult.calculations.pendapatanLinkBreakdown}</div>
                    <div>Cabang: {testResult.calculations.pendapatanCabangBreakdown}</div>
                    <div>Mitra: {testResult.calculations.pendapatanMitraBreakdown}</div>
                    <div>Owner: {testResult.calculations.pendapatanOwnerBreakdown}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
