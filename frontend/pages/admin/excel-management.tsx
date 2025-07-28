import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FileDown, FileUp, Table, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import backend from '~backend/client';

type ImportType = 'stock' | 'sales';

export default function ExcelManagement() {
  const [importType, setImportType] = useState<ImportType>('stock');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);

  const { toast } = useToast();

  const handleDownloadTemplate = (type: ImportType) => {
    const headers = type === 'stock'
      ? ['mitra_cabang', 'cabang', 'link', 'jenis_voucher', 'jumlah']
      : ['mitra_cabang', 'cabang', 'link', 'jenis_voucher', 'jumlah_terjual'];
    
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    const fileName = `template_${type}_import.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: 'Template Downloaded',
      description: `${fileName} has been downloaded.`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(json);
        toast({
          title: 'File Parsed',
          description: `${json.length} rows found in ${file.name}.`,
        });
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast({
          title: 'File Parse Error',
          description: 'Could not read the file. Please ensure it is a valid Excel file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmitToDatabase = async () => {
    if (parsedData.length === 0) {
      toast({
        title: 'No Data',
        description: 'There is no data to import.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      let response;
      if (importType === 'stock') {
        response = await backend.voucher.importStock({ items: parsedData });
      } else {
        response = await backend.voucher.importSales({ items: parsedData });
      }
      
      setImportResult(response);
      toast({
        title: 'Import Complete',
        description: `${response.successCount} rows imported successfully, ${response.errorCount} rows failed.`,
        variant: response.errorCount > 0 ? 'destructive' : 'default',
      });

    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'An unexpected error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewTable = () => {
    if (parsedData.length === 0) {
      return <p className="text-center text-gray-500">Upload a file to see a preview.</p>;
    }
    const headers = Object.keys(parsedData[0]);
    return (
      <div className="overflow-x-auto max-h-96">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {headers.map(header => <th key={header} className="p-2 text-left font-medium">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {parsedData.slice(0, 10).map((row, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                {headers.map(header => <td key={header} className="p-2">{row[header]}</td>)}
              </tr>
            ))}
            {parsedData.length > 10 && (
              <tr>
                <td colSpan={headers.length} className="p-2 text-center text-gray-500">
                  ... and {parsedData.length - 10} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manajemen Excel</h1>
          <p className="text-gray-600">Download templates and import data in bulk.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Download Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Download Template Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Download a template to ensure your data is in the correct format for import.</p>
              <div className="flex gap-4">
                <Button onClick={() => handleDownloadTemplate('stock')} className="flex-1">
                  Template Input Stok
                </Button>
                <Button onClick={() => handleDownloadTemplate('sales')} className="flex-1">
                  Template Input Penjualan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Import Data dari Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Jenis Import</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={importType === 'stock' ? 'default' : 'outline'}
                    onClick={() => setImportType('stock')}
                  >
                    Import Stok
                  </Button>
                  <Button 
                    variant={importType === 'sales' ? 'default' : 'outline'}
                    onClick={() => setImportType('sales')}
                  >
                    Import Penjualan
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload File Excel</Label>
                <Input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
                {fileName && <p className="text-sm text-gray-500">File: {fileName}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview and Submit */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Preview dan Submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderPreviewTable()}
            <Button 
              onClick={handleSubmitToDatabase} 
              disabled={loading || parsedData.length === 0}
              className="w-full"
            >
              {loading ? 'Mengimport...' : `Submit ${parsedData.length} baris ke Database`}
            </Button>
          </CardContent>
        </Card>

        {/* Import Results */}
        {importResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.errorCount > 0 ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                Hasil Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 text-center">
                <div className="flex-1 p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{importResult.successCount}</div>
                  <div className="text-sm text-green-600">Berhasil</div>
                </div>
                <div className="flex-1 p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{importResult.errorCount}</div>
                  <div className="text-sm text-red-600">Gagal</div>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Detail Error:</h4>
                  <div className="max-h-48 overflow-y-auto bg-gray-100 p-3 rounded-md text-sm font-mono">
                    {importResult.errors.map((err, i) => <p key={i}>{err}</p>)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
