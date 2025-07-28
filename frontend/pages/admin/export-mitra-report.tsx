import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileSpreadsheet, Calendar, Download, Filter, User } from 'lucide-react';
import backend from '~backend/client';
import type { HierarchyUser } from '~backend/voucher/get_hierarchy_for_distribution';

export default function ExportMitraReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mitraId, setMitraId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [mitraOptions, setMitraOptions] = useState<HierarchyUser[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const data = await backend.voucher.getHierarchyForDistribution();
        setMitraOptions(data.mitraCabang);
      } catch (error) {
        console.error("Failed to fetch Mitra Cabang data:", error);
        toast({ title: "Error", description: "Failed to load Mitra Cabang options.", variant: "destructive" });
      }
    };
    fetchHierarchy();
  }, [toast]);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Validation Error', description: 'Please select both a start and end date.', variant: 'destructive' });
      return;
    }
    if (!mitraId) {
      toast({ title: 'Validation Error', description: 'Please select a Mitra Cabang to export the report for.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const response = await backend.exportService.reportByMitra({
        startDate,
        endDate,
        mitraId,
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Export Laporan per Mitra Cabang</h1>
          <p className="text-gray-600">Generate a detailed financial report for a specific Mitra Cabang's network.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mitra-id">Mitra Cabang</Label>
                  <Select value={mitraId?.toString() || ''} onValueChange={(value) => setMitraId(value ? parseInt(value) : undefined)}>
                    <SelectTrigger><SelectValue placeholder="Pilih Mitra Cabang" /></SelectTrigger>
                    <SelectContent>
                      {mitraOptions.map(m => (<SelectItem key={m.id} value={m.id.toString()}>{m.fullName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Dari Tanggal</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Sampai Tanggal</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            <Button onClick={handleExport} disabled={loading || !mitraId} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Mengekspor...' : 'Export Laporan Mitra Cabang'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
