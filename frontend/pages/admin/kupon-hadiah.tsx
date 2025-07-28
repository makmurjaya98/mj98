import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Gift, Plus, Trophy, Users, Calendar, Award, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import backend from '~backend/client';
import type { CreateKuponRequest } from '~backend/voucher/create_kupon';
import type { KuponListResponse, KuponHadiah } from '~backend/voucher/get_kupon_list';
import type { KuponPemenangResponse, PemenangKupon } from '~backend/voucher/get_kupon_pemenang';
import type { KlaimListResponse } from '~backend/voucher/get_klaim_list';
import type { ClaimKuponRequest } from '~backend/voucher/claim_kupon';

interface FormData {
  nama: string;
  deskripsi: string;
  targetRole: "Mitra Cabang" | "Cabang" | "Link" | '';
  minimalPenjualan: number;
  periodeMulai: string;
  periodeBerakhir: string;
  jumlahPemenang: number;
  hadiah: Array<{ posisi: number; hadiah: string }>;
}

export default function KuponHadiahPage() {
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    deskripsi: '',
    targetRole: '',
    minimalPenjualan: 0,
    periodeMulai: '',
    periodeBerakhir: '',
    jumlahPemenang: 1,
    hadiah: [{ posisi: 1, hadiah: '' }],
  });

  const [loading, setLoading] = useState(false);
  const [kuponList, setKuponList] = useState<KuponListResponse | null>(null);
  const [klaimList, setKlaimList] = useState<KlaimListResponse | null>(null);
  const [selectedKupon, setSelectedKupon] = useState<number | null>(null);
  const [kuponPemenang, setKuponPemenang] = useState<KuponPemenangResponse | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [currentUserId] = useState<number>(1); // This should come from auth context

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [kuponResponse, klaimResponse] = await Promise.all([
        backend.voucher.getKuponList(),
        backend.voucher.getKlaimList()
      ]);
      setKuponList(kuponResponse);
      setKlaimList(klaimResponse);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJumlahPemenangChange = (jumlah: number) => {
    const newHadiah = Array.from({ length: jumlah }, (_, i) => ({
      posisi: i + 1,
      hadiah: formData.hadiah[i]?.hadiah || '',
    }));
    setFormData(prev => ({ ...prev, jumlahPemenang: jumlah, hadiah: newHadiah }));
  };

  const handleHadiahChange = (posisi: number, hadiah: string) => {
    setFormData(prev => ({
      ...prev,
      hadiah: prev.hadiah.map(h => h.posisi === posisi ? { ...h, hadiah } : h),
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.nama.trim()) return 'Nama kupon is required';
    if (!formData.targetRole) return 'Target role is required';
    if (formData.minimalPenjualan <= 0) return 'Minimal penjualan must be greater than 0';
    if (!formData.periodeMulai || !formData.periodeBerakhir) return 'Periode is required';
    if (new Date(formData.periodeMulai) >= new Date(formData.periodeBerakhir)) return 'Periode berakhir must be after periode mulai';
    for (const h of formData.hadiah) {
      if (!h.hadiah.trim()) return `Hadiah for position ${h.posisi} is required`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast({ title: 'Validation Error', description: validationError, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const kuponData: CreateKuponRequest = { ...formData, targetRole: formData.targetRole as "Mitra Cabang" | "Cabang" | "Link" };
      const response = await backend.voucher.createKupon(kuponData);
      toast({ title: 'Success', description: response.message });
      setFormData({ nama: '', deskripsi: '', targetRole: '', minimalPenjualan: 0, periodeMulai: '', periodeBerakhir: '', jumlahPemenang: 1, hadiah: [{ posisi: 1, hadiah: '' }] });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Creation Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPemenang = async (kuponId: number) => {
    try {
      const params = new URLSearchParams();
      params.append('kuponId', kuponId.toString());
      const response = await fetch(`/voucher/kupon-pemenang?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch winners');
      const data: KuponPemenangResponse = await response.json();
      setKuponPemenang(data);
      setSelectedKupon(kuponId);
      setActiveTab('winners');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleClaim = async (kuponId: number, jumlahPenjualan: number, role: string) => {
    try {
      const claimData: ClaimKuponRequest = { kuponId, userId: currentUserId, jumlahPenjualan, role };
      const response = await backend.voucher.claimKupon(claimData);
      toast({ title: 'Claim Submitted', description: response.message });
      fetchData(); // Refresh data to show claim status
      if (selectedKupon) handleViewPemenang(selectedKupon); // Refresh winners view
    } catch (error: any) {
      toast({ title: 'Claim Failed', description: error.message, variant: 'destructive' });
    }
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);

  const getStatusBadge = (status: string) => {
    const styles = {
      aktif: "bg-green-100 text-green-800",
      selesai: "bg-gray-100 text-gray-800",
      dibatalkan: "bg-red-100 text-red-800",
    };
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-blue-100 text-blue-800'}`}>{status}</span>;
  };

  const getKlaimStatusBadge = (status: string) => {
    const styles = {
      menunggu: "bg-yellow-100 text-yellow-800",
      disetujui: "bg-green-100 text-green-800",
      ditolak: "bg-red-100 text-red-800",
    };
    const icons = {
      menunggu: <Clock className="h-3 w-3 mr-1" />,
      disetujui: <CheckCircle className="h-3 w-3 mr-1" />,
      ditolak: <XCircle className="h-3 w-3 mr-1" />,
    };
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{icons[status]}{status}</span>;
  };

  const hasClaimed = (kuponId: number) => klaimList?.klaimList.some(k => k.kuponId === kuponId && k.userId === currentUserId);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manajemen Kupon Hadiah</h1>
          <p className="text-gray-600">Create and manage performance-based gift coupons for your network</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="flex items-center gap-2"><Plus className="h-4 w-4" />Buat Kupon</TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2"><Gift className="h-4 w-4" />Daftar Kupon</TabsTrigger>
            <TabsTrigger value="winners" className="flex items-center gap-2"><Trophy className="h-4 w-4" />Pemenang</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" />Buat Kupon Hadiah Baru</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="nama">Nama Kupon</Label><Input id="nama" value={formData.nama} onChange={(e) => handleInputChange('nama', e.target.value)} required /></div>
                      <div className="space-y-2"><Label htmlFor="deskripsi">Deskripsi</Label><Textarea id="deskripsi" value={formData.deskripsi} onChange={(e) => handleInputChange('deskripsi', e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="targetRole">Target Role</Label><Select value={formData.targetRole} onValueChange={(value) => handleInputChange('targetRole', value)}><SelectTrigger><SelectValue placeholder="Select target role" /></SelectTrigger><SelectContent><SelectItem value="Mitra Cabang">Mitra Cabang</SelectItem><SelectItem value="Cabang">Cabang</SelectItem><SelectItem value="Link">Link</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label htmlFor="minimalPenjualan">Minimal Penjualan</Label><Input id="minimalPenjualan" type="number" min="1" value={formData.minimalPenjualan || ''} onChange={(e) => handleInputChange('minimalPenjualan', parseInt(e.target.value) || 0)} required /></div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="periodeMulai">Periode Mulai</Label><Input id="periodeMulai" type="date" value={formData.periodeMulai} onChange={(e) => handleInputChange('periodeMulai', e.target.value)} required /></div>
                        <div className="space-y-2"><Label htmlFor="periodeBerakhir">Periode Berakhir</Label><Input id="periodeBerakhir" type="date" value={formData.periodeBerakhir} onChange={(e) => handleInputChange('periodeBerakhir', e.target.value)} required /></div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="jumlahPemenang">Jumlah Pemenang</Label><Input id="jumlahPemenang" type="number" min="1" max="10" value={formData.jumlahPemenang} onChange={(e) => handleJumlahPemenangChange(parseInt(e.target.value) || 1)} required /></div>
                      <div className="space-y-4"><Label>Hadiah per Posisi</Label>{formData.hadiah.map((h) => (<div key={h.posisi} className="flex items-center gap-2"><span className="text-sm font-medium w-16">Posisi {h.posisi}:</span><Input value={h.hadiah} onChange={(e) => handleHadiahChange(h.posisi, e.target.value)} required /></div>))}</div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Buat Kupon'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" />Daftar Kupon Hadiah</CardTitle></CardHeader>
              <CardContent>
                {kuponList?.kuponList.length ? (<div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr className="border-b"><th className="p-3 text-left">Nama</th><th className="p-3 text-left">Target</th><th className="p-3 text-left">Periode</th><th className="p-3 text-left">Min. Sales</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th></tr></thead><tbody>{kuponList.kuponList.map((kupon) => (<tr key={kupon.id} className="border-b hover:bg-gray-50"><td className="p-3">{kupon.nama}</td><td className="p-3">{kupon.targetRole}</td><td className="p-3">{formatDate(kupon.periodeMulai)} - {formatDate(kupon.periodeBerakhir)}</td><td className="p-3">{formatCurrency(kupon.minimalPenjualan)}</td><td className="p-3">{getStatusBadge(kupon.status)}</td><td className="p-3"><Button variant="outline" size="sm" onClick={() => handleViewPemenang(kupon.id)}><Eye className="h-3 w-3 mr-1" />View</Button></td></tr>))}</tbody></table></div>) : (<p>No coupons found.</p>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="winners">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Pemenang Kupon {kuponPemenang && `- ${kuponPemenang.kuponInfo.nama}`}</CardTitle></CardHeader>
              <CardContent>
                {kuponPemenang ? (<div className="space-y-4">{kuponPemenang.pemenangList.length ? (<div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr className="border-b"><th className="p-3 text-left">Posisi</th><th className="p-3 text-left">Name</th><th className="p-3 text-left">Total Sales</th><th className="p-3 text-left">Hadiah</th><th className="p-3 text-left">Status Klaim</th><th className="p-3 text-left">Action</th></tr></thead><tbody>{kuponPemenang.pemenangList.map((p) => (<tr key={p.userId} className="border-b hover:bg-gray-50"><td className="p-3">{p.posisi}</td><td className="p-3">{p.fullName}</td><td className="p-3">{formatCurrency(p.totalPenjualan)}</td><td className="p-3">{p.hadiah}</td><td className="p-3">{p.statusKlaim ? getKlaimStatusBadge(p.statusKlaim) : 'Belum Diklaim'}</td><td className="p-3">{p.userId === currentUserId && !hasClaimed(kuponPemenang.kuponInfo.id) && (<Button size="sm" onClick={() => handleClaim(kuponPemenang.kuponInfo.id, p.totalPenjualan, p.role)}>Claim</Button>)}</td></tr>))}</tbody></table></div>) : (<p>No winners yet.</p>)}</div>) : (<p>Select a coupon to view winners.</p>)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
