import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileSpreadsheet, Calendar, Download, Filter, User } from 'lucide-react';
import backend from '~backend/client';
import type { HierarchyUser, DistributionHierarchyResponse } from '~backend/voucher/get_hierarchy_for_distribution';
import { usePermissions } from '../../hooks/usePermissions';

export default function ExportLinkReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mitraId, setMitraId] = useState<number | undefined>();
  const [cabangId, setCabangId] = useState<number | undefined>();
  const [linkId, setLinkId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<DistributionHierarchyResponse | null>(null);
  const [availableCabang, setAvailableCabang] = useState<HierarchyUser[]>([]);
  const [availableLinks, setAvailableLinks] = useState<HierarchyUser[]>([]);

  const { toast } = useToast();
  const { role, userId: currentUserId } = usePermissions(1); // Assuming user ID 1 for demo

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const data = await backend.voucher.getHierarchyForDistribution();
        setHierarchyData(data);
        
        if (role === 'Mitra Cabang') {
          setMitraId(currentUserId);
        } else if (role === 'Cabang') {
          const userCabang = data.cabang.find(c => c.id === currentUserId);
          if (userCabang) {
            setMitraId(userCabang.parentId);
            setCabangId(currentUserId);
          }
        } else if (role === 'Link') {
          const userLink = data.links.find(l => l.id === currentUserId);
          if (userLink) {
            const parentCabang = data.cabang.find(c => c.id === userLink.parentId);
            if (parentCabang) {
              setMitraId(parentCabang.parentId);
              setCabangId(parentCabang.id);
              setLinkId(currentUserId);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch hierarchy data:", error);
        toast({ title: "Error", description: "Failed to load hierarchy options.", variant: "destructive" });
      }
    };
    if (role && currentUserId) {
      fetchHierarchy();
    }
  }, [toast, role, currentUserId]);

  useEffect(() => {
    if (mitraId && hierarchyData) {
      const filtered = hierarchyData.cabang.filter(c => c.parentId === mitraId);
      setAvailableCabang(filtered);
      if (role === 'Owner' || role === 'Admin') {
        setCabangId(undefined);
        setLinkId(undefined);
      }
    } else if (hierarchyData && (role === 'Owner' || role === 'Admin')) {
      setAvailableCabang(hierarchyData.cabang);
    }
  }, [mitraId, hierarchyData, role]);

  useEffect(() => {
    if (cabangId && hierarchyData) {
      const filtered = hierarchyData.links.filter(l => l.parentId === cabangId);
      setAvailableLinks(filtered);
      if (role !== 'Link') {
        setLinkId(undefined);
      }
    } else if (hierarchyData && role !== 'Link') {
      setAvailableLinks(hierarchyData.links);
    }
  }, [cabangId, hierarchyData, role]);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Validation Error', description: 'Please select both a start and end date.', variant: 'destructive' });
      return;
    }
    if (!linkId) {
      toast({ title: 'Validation Error', description: 'Please select a Link to export the report for.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const response = await backend.exportService.reportByLink({
        startDate,
        endDate,
        linkId,
      });

      const byteCharacters = atob(response.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = response.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: 'Export Successful', description: `${response.fileName} has been downloaded.` });

    } catch (error: any) {
      console.error('Export failed:', error);
      toast({ title: 'Export Failed', description: error.message || 'An unexpected error occurred during export.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isOwnerOrAdmin = role === 'Owner' || role === 'Admin';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Export Laporan per Link</h1>
          <p className="text-gray-600">Generate a detailed Excel report for a specific Link user.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Pengaturan Ekspor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Laporan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Dari Tanggal</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Sampai Tanggal</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mitra-id">Mitra Cabang</Label>
                  <Select value={mitraId?.toString() || ''} onValueChange={(value) => setMitraId(value ? parseInt(value) : undefined)} disabled={!isOwnerOrAdmin}>
                    <SelectTrigger><SelectValue placeholder="Pilih Mitra Cabang" /></SelectTrigger>
                    <SelectContent>
                      {hierarchyData?.mitraCabang.map(m => (<SelectItem key={m.id} value={m.id.toString()}>{m.fullName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cabang-id">Cabang</Label>
                  <Select value={cabangId?.toString() || ''} onValueChange={(value) => setCabangId(value ? parseInt(value) : undefined)} disabled={!isOwnerOrAdmin && role !== 'Mitra Cabang'}>
                    <SelectTrigger><SelectValue placeholder="Pilih Cabang" /></SelectTrigger>
                    <SelectContent>
                      {availableCabang.map(c => (<SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-id">Link</Label>
                  <Select value={linkId?.toString() || ''} onValueChange={(value) => setLinkId(value ? parseInt(value) : undefined)} disabled={role === 'Link'}>
                    <SelectTrigger><SelectValue placeholder="Pilih Link" /></SelectTrigger>
                    <SelectContent>
                      {availableLinks.map(l => (<SelectItem key={l.id} value={l.id.toString()}>{l.fullName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button onClick={handleExport} disabled={loading || !linkId} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Mengekspor...' : 'Export Laporan Link'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
