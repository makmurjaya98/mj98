import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Banknote, Users, Calendar, FileText, DollarSign, History, Plus } from 'lucide-react';
import backend from '~backend/client';
import type { AddDepositRequest } from '~backend/voucher/add_deposit';
import type { DepositHistoryResponse, DepositRecord } from '~backend/voucher/get_deposit_history';
import type { UsersByRoleResponse, UserByRole } from '~backend/voucher/get_users_by_role';

type Kategori = "Link" | "Cabang" | "Mitra Cabang";

interface FormData {
  kategori: Kategori | '';
  userId: number | undefined;
  jumlah: number;
  keterangan: string;
}

export default function ManajemenPenyetoran() {
  const [formData, setFormData] = useState<FormData>({
    kategori: '',
    userId: undefined,
    jumlah: 0,
    keterangan: '',
  });

  const [loading, setLoading] = useState(false);
  const [depositHistory, setDepositHistory] = useState<DepositHistoryResponse | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserByRole[]>([]);
  const [showForm, setShowForm] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    const fetchDepositHistory = async () => {
      try {
        const history = await backend.voucher.getDepositHistory();
        setDepositHistory(history);
      } catch (error) {
        console.error('Failed to fetch deposit history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load deposit history. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchDepositHistory();
  }, [toast]);

  useEffect(() => {
    const fetchUsersByRole = async () => {
      if (!formData.kategori) {
        setAvailableUsers([]);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append('role', formData.kategori);
        
        const response = await fetch(`/voucher/users-by-role?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data: UsersByRoleResponse = await response.json();
        setAvailableUsers(data.users);
      } catch (error) {
        console.error('Failed to fetch users by role:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
        setAvailableUsers([]);
      }
    };

    fetchUsersByRole();
  }, [formData.kategori, toast]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleKategoriChange = (kategori: Kategori) => {
    setFormData(prev => ({
      ...prev,
      kategori,
      userId: undefined,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.kategori) return 'Please select a kategori';
    if (!formData.userId) return 'Please select a user';
    if (formData.jumlah <= 0) return 'Jumlah must be greater than 0';
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
      const depositData: AddDepositRequest = {
        kategori: formData.kategori as Kategori,
        userId: formData.userId!,
        jumlah: formData.jumlah,
        keterangan: formData.keterangan.trim() || undefined,
      };

      const response = await backend.voucher.addDeposit(depositData);

      toast({
        title: 'Success',
        description: response.message,
        variant: 'default',
      });

      // Reset form
      setFormData({
        kategori: '',
        userId: undefined,
        jumlah: 0,
        keterangan: '',
      });
      setAvailableUsers([]);

      // Refresh deposit history
      const history = await backend.voucher.getDepositHistory();
      setDepositHistory(history);

    } catch (error: any) {
      console.error('Deposit recording failed:', error);
      toast({
        title: 'Deposit Recording Failed',
        description: error.message || 'Failed to record deposit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = availableUsers.find(u => u.id === formData.userId);

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

  const getUserName = (deposit: DepositRecord) => {
    if (deposit.kategori === 'Link' && deposit.linkName) {
      return deposit.linkName;
    } else if (deposit.kategori === 'Cabang' && deposit.cabangName) {
      return deposit.cabangName;
    } else if (deposit.kategori === 'Mitra Cabang' && deposit.mitraName) {
      return deposit.mitraName;
    }
    return 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Penyetoran</h1>
            <p className="text-gray-600">Record revenue deposits from Link, Cabang, and Mitra Cabang</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            {showForm ? <History className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'View History' : 'Add Deposit'}
          </Button>
        </div>

        {showForm ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Record Deposit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Kategori Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Select Category
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="kategori">Kategori</Label>
                          <Select 
                            value={formData.kategori} 
                            onValueChange={handleKategoriChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Link">Link</SelectItem>
                              <SelectItem value="Cabang">Cabang</SelectItem>
                              <SelectItem value="Mitra Cabang">Mitra Cabang</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="user">
                            {formData.kategori ? `Select ${formData.kategori}` : 'Select User'}
                          </Label>
                          <Select 
                            value={formData.userId?.toString() || ''} 
                            onValueChange={(value) => handleInputChange('userId', parseInt(value))}
                            disabled={!formData.kategori}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                formData.kategori ? `Select ${formData.kategori}` : 'Select kategori first'
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.fullName} (@{user.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Deposit Details
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                          <Input
                            id="jumlah"
                            type="number"
                            min="1"
                            step="1000"
                            value={formData.jumlah || ''}
                            onChange={(e) => handleInputChange('jumlah', parseFloat(e.target.value) || 0)}
                            placeholder="Enter deposit amount"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="keterangan">Keterangan (Optional)</Label>
                          <Textarea
                            id="keterangan"
                            value={formData.keterangan}
                            onChange={(e) => handleInputChange('keterangan', e.target.value)}
                            placeholder="Enter additional notes..."
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? 'Recording Deposit...' : 'Record Deposit'}
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
                    <FileText className="h-5 w-5" />
                    Deposit Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-600">Deposit Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">Kategori:</span>
                          <span>{formData.kategori || 'Not selected'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">User:</span>
                          <span>{selectedUser?.fullName || 'Not selected'}</span>
                        </div>
                        {selectedUser && (
                          <div className="text-xs text-gray-500 ml-4">
                            @{selectedUser.username}
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.jumlah > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium text-sm text-gray-600">Amount Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Deposit Amount:</span>
                            <span className="font-bold text-green-600">
                              {formatCurrency(formData.jumlah)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.keterangan.trim() && (
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-medium text-sm text-gray-600">Notes</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {formData.keterangan}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-4 p-2 bg-yellow-50 rounded">
                      <Banknote className="h-3 w-3 inline mr-1" />
                      Recording this deposit will reset the corresponding revenue amounts to zero.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Deposit History */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Deposit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {depositHistory && depositHistory.deposits.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Kategori</th>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Amount</th>
                        <th className="text-left p-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depositHistory.deposits.map((deposit) => (
                        <tr key={deposit.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{formatDate(deposit.createdAt)}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              deposit.kategori === 'Link' ? 'bg-blue-100 text-blue-800' :
                              deposit.kategori === 'Cabang' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {deposit.kategori}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{getUserName(deposit)}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-green-600">
                              {formatCurrency(deposit.jumlah)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-gray-600">
                              {deposit.keterangan || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Deposits Recorded</h3>
                  <p className="text-gray-500">No deposit records have been created yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
