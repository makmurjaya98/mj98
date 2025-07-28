import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Ticket, Plus, List } from 'lucide-react';
import backend from '~backend/client';
import type { CreateCouponRequest, Coupon } from '~backend/coupon/create';

export default function CouponManagement() {
  const [formData, setFormData] = useState<Omit<CreateCouponRequest, 'performerId'>>({
    kode: '',
    deskripsi: '',
    nilaiDiskon: 0,
    minPembelian: 0,
    expiredAt: '',
    target: 'pelanggan',
    isLoyaltyCoupon: false,
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId] = useState<number>(1); // Should come from auth context
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await backend.coupon.list();
      setCoupons(response.coupons);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast({ title: "Error", description: "Failed to load coupons.", variant: "destructive" });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await backend.coupon.create({ ...formData, performerId: currentUserId });
      toast({ title: "Success", description: `Coupon "${response.coupon.kode}" created.` });
      fetchCoupons();
      // Reset form
      setFormData({
        kode: '', deskripsi: '', nilaiDiskon: 0, minPembelian: 0,
        expiredAt: '', target: 'pelanggan', isLoyaltyCoupon: false,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Coupon Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus /> Create New Coupon</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kode">Kode Kupon</Label>
                  <Input id="kode" value={formData.kode} onChange={e => handleInputChange('kode', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea id="deskripsi" value={formData.deskripsi} onChange={e => handleInputChange('deskripsi', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nilaiDiskon">Nilai Diskon (Rp)</Label>
                  <Input id="nilaiDiskon" type="number" value={formData.nilaiDiskon} onChange={e => handleInputChange('nilaiDiskon', parseInt(e.target.value) || 0)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minPembelian">Min. Pembelian (Rp)</Label>
                  <Input id="minPembelian" type="number" value={formData.minPembelian} onChange={e => handleInputChange('minPembelian', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiredAt">Tanggal Kedaluwarsa</Label>
                  <Input id="expiredAt" type="date" value={formData.expiredAt} onChange={e => handleInputChange('expiredAt', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Select value={formData.target} onValueChange={value => handleInputChange('target', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pelanggan">Pelanggan</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="cabang">Cabang</SelectItem>
                      <SelectItem value="mitra">Mitra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="isLoyalty" checked={formData.isLoyaltyCoupon} onCheckedChange={checked => handleInputChange('isLoyaltyCoupon', !!checked)} />
                  <Label htmlFor="isLoyalty">Jadikan Kupon Loyalti Default</Label>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Coupon'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><List /> Existing Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Kode</th>
                      <th className="p-2 text-left">Deskripsi</th>
                      <th className="p-2 text-left">Diskon</th>
                      <th className="p-2 text-left">Target</th>
                      <th className="p-2 text-left">Loyalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon.id} className="border-b">
                        <td className="p-2 font-mono">{coupon.kode}</td>
                        <td className="p-2">{coupon.deskripsi}</td>
                        <td className="p-2">Rp {coupon.nilaiDiskon.toLocaleString()}</td>
                        <td className="p-2">{coupon.target}</td>
                        <td className="p-2">{coupon.isLoyaltyCoupon ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
