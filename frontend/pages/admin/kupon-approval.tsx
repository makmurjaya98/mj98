import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Award, CheckCircle, XCircle, Clock, User, Gift, Trophy } from 'lucide-react';
import backend from '~backend/client';
import type { KlaimListResponse, KlaimRecord } from '~backend/voucher/get_klaim_list';
import type { UpdateKlaimStatusRequest } from '~backend/voucher/update_klaim_status';

export default function KuponApproval() {
  const [klaimList, setKlaimList] = useState<KlaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchKlaimList = async () => {
    try {
      setLoading(true);
      const response = await backend.voucher.getKlaimList();
      setKlaimList(response.klaimList);
    } catch (error) {
      console.error('Failed to fetch claim list:', error);
      toast({
        title: 'Error',
        description: 'Failed to load claim list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKlaimList();
  }, [toast]);

  const handleUpdateStatus = async (klaimId: number, status: "disetujui" | "ditolak") => {
    let catatan: string | undefined;
    if (status === 'ditolak') {
      catatan = prompt("Please provide a reason for rejection:") || undefined;
      if (!catatan) {
        toast({ title: "Action Canceled", description: "Rejection requires a reason.", variant: "destructive" });
        return;
      }
    }

    try {
      const updateData: UpdateKlaimStatusRequest = { klaimId, status, catatan };
      const response = await backend.voucher.updateKlaimStatus(updateData);
      toast({ title: 'Success', description: response.message });
      fetchKlaimList(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  };

  const formatDate = (date: Date) => new Date(date).toLocaleString('id-ID');
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Menunggu</span>;
      case 'disetujui':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Disetujui</span>;
      case 'ditolak':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Ditolak</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Kupon Approval</h1>
          <p className="text-gray-600">Review and approve or reject coupon claims from users.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Daftar Klaim Hadiah
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading claims...</p>
            ) : klaimList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-medium">Kupon</th>
                      <th className="p-3 text-left font-medium">User</th>
                      <th className="p-3 text-left font-medium">Performance</th>
                      <th className="p-3 text-left font-medium">Reward</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Claim Time</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {klaimList.map((klaim) => (
                      <tr key={klaim.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{klaim.kuponNama}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{klaim.userName}</div>
                            <div className="text-xs text-gray-500">@{klaim.userUsername} ({klaim.role})</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">Sales: {formatCurrency(klaim.jumlahPenjualan || 0)}</div>
                            <div className="text-xs text-gray-500">Rank: {klaim.posisiPemenang}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-yellow-500" />
                            <span>{klaim.hadiahDiterima}</span>
                          </div>
                        </td>
                        <td className="p-3">{getStatusBadge(klaim.status)}</td>
                        <td className="p-3">{formatDate(klaim.createdAt)}</td>
                        <td className="p-3">
                          {klaim.status === 'menunggu' ? (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(klaim.id, 'disetujui')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(klaim.id, 'ditolak')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">Processed on {formatDate(klaim.updatedAt)}</p>
                          )}
                          {klaim.catatan && <p className="text-xs text-gray-500 mt-1">Note: {klaim.catatan}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Claims</h3>
                <p className="text-gray-500">There are no new coupon claims to review.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
