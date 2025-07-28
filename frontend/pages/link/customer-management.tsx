import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Users, Plus, ShoppingCart, Ticket, History } from 'lucide-react';
import backend from '~backend/client';
import type { Customer } from '~backend/customer/add';
import type { GetCustomerDetailsResponse, CustomerTransaction, CustomerCoupon } from '~backend/customer/get_details';

const VOUCHER_TYPES = [
  { value: "JM_2jam", label: "JM 2 Jam" },
  { value: "MJ_15jam", label: "MJ 15 Jam" },
  { value: "MJ_1hari", label: "MJ 1 Hari" },
  { value: "MJ_7hari", label: "MJ 7 Hari" },
  { value: "MJ_30hari", label: "MJ 30 Hari" },
];

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [currentUserId] = useState<number>(1); // Should come from auth context
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ linkId: currentUserId.toString() });
      const response = await fetch(`/customer/by-link?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.customers);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load customers.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentUserId]);

  const handleSelectCustomer = async (customerId: number) => {
    try {
      const params = new URLSearchParams({ customerId: customerId.toString(), linkId: currentUserId.toString() });
      const response = await fetch(`/customer/details?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch customer details");
      const data = await response.json();
      setSelectedCustomer(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load customer details.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
          </DialogTrigger>
          <AddCustomerDialog linkId={currentUserId} onCustomerAdded={() => { fetchCustomers(); setIsAddCustomerOpen(false); }} />
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>My Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p>Loading...</p> : (
              <ul className="space-y-2">
                {customers.map(c => (
                  <li key={c.id}>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => handleSelectCustomer(c.id)}>
                      {c.nama}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          {selectedCustomer ? (
            <CustomerDetails customerData={selectedCustomer} linkId={currentUserId} onTransactionAdded={() => handleSelectCustomer(selectedCustomer.customer.id)} />
          ) : (
            <Card className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a customer to see details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AddCustomerDialog({ linkId, onCustomerAdded }: { linkId: number, onCustomerAdded: () => void }) {
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      await backend.customer.add({ linkId, nama, alamat, noHp });
      toast({ title: "Success", description: "Customer added." });
      onCustomerAdded();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add New Customer</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="nama">Nama Lengkap</Label>
          <Input id="nama" value={nama} onChange={e => setNama(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Input id="alamat" value={alamat} onChange={e => setAlamat(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="noHp">No. HP</Label>
          <Input id="noHp" value={noHp} onChange={e => setNoHp(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} className="w-full">Add Customer</Button>
      </div>
    </DialogContent>
  );
}

function CustomerDetails({ customerData, linkId, onTransactionAdded }: { customerData: GetCustomerDetailsResponse, linkId: number, onTransactionAdded: () => void }) {
  const [voucherType, setVoucherType] = useState('');
  const [qty, setQty] = useState(1);
  const { toast } = useToast();

  const handleAddTransaction = async () => {
    if (!voucherType || qty <= 0) {
      toast({ title: "Error", description: "Please select a voucher and quantity.", variant: "destructive" });
      return;
    }
    try {
      const response = await backend.customer.addTransaction({ linkId, customerId: customerData.customer.id, voucherType, qty });
      toast({ title: "Success", description: response.message });
      if (response.issuedCoupon) {
        toast({ title: "Coupon Awarded!", description: "Customer has received a loyalty coupon.", variant: "default" });
      }
      onTransactionAdded();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{customerData.customer.nama}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Purchases: {customerData.customer.totalPembelian}</p>
          <p>Address: {customerData.customer.alamat || 'N/A'}</p>
          <p>Phone: {customerData.customer.noHp || 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart /> Add New Transaction</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label>Voucher Type</Label>
            <Select value={voucherType} onValueChange={setVoucherType}>
              <SelectTrigger><SelectValue placeholder="Select voucher" /></SelectTrigger>
              <SelectContent>
                {VOUCHER_TYPES.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} min="1" />
          </div>
          <Button onClick={handleAddTransaction}>Add</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History /> Transaction History</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {customerData.transactions.map(tx => (
                <li key={tx.id} className="text-sm">{new Date(tx.tanggal).toLocaleDateString()}: {tx.qty}x {tx.voucherType}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Ticket /> Available Coupons</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {customerData.coupons.map(c => (
                <li key={c.id} className={`text-sm ${c.isUsed ? 'line-through text-gray-500' : ''}`}>{c.kode}: {c.deskripsi}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
