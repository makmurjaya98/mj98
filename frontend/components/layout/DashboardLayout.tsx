import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '../../hooks/usePermissions';
import Sidenav from './Sidenav';
import Header from './Header';

// Import all page components
import Register from '../../pages/auth/register';
import StockManagement from '../../pages/admin/stock-management';
import VoucherSales from '../../pages/admin/voucher-sales';
import Laporan from '../../pages/laporan';
import ManajemenPenyetoran from '../../pages/admin/manajemen-penyetoran';
import KuponHadiahPage from '../../pages/admin/kupon-hadiah';
import HakAkses from '../../pages/admin/hak-akses';
import UserManagement from '../../pages/admin/user-management';
import ExcelManagement from '../../pages/admin/excel-management';
import LogAktivitas from '../../pages/admin/log-aktivitas';
import Notifikasi from '../../pages/notifikasi';
import AdminPermissions from '../../pages/owner/admin-permissions';
import MitraManagement from '../../pages/mitra/management';
import KuponApproval from '../../pages/admin/kupon-approval';
import ExportLaporan from '../../pages/admin/export-laporan';
import ExportLinkReport from '../../pages/admin/export-link-report';
import ExportMitraReport from '../../pages/admin/export-mitra-report';
import ExportOwnerRevenue from '../../pages/owner/export-owner-revenue';
import ExportOwnerCombinedReport from '../../pages/owner/export-owner-combined';
import Dashboard from '../../pages/dashboard';
import CustomerManagement from '../../pages/link/customer-management';
import CouponManagement from '../../pages/admin/coupon-management';
import TopPelangganReport from '../../pages/laporan/top-pelanggan';

type Page = 'register' | 'dashboard' | 'stock-management' | 'voucher-sales' | 'laporan' | 'manajemen-penyetoran' | 'kupon-hadiah' | 'hak-akses' | 'user-management' | 'excel-management' | 'log-aktivitas' | 'notifikasi' | 'admin-permissions' | 'mitra-management' | 'kupon-approval' | 'export-laporan' | 'export-link-report' | 'export-mitra-report' | 'export-owner-report' | 'export-owner-combined-report' | 'customer-management' | 'coupon-management' | 'top-pelanggan-report';

interface DashboardLayoutProps {
  onLogout: () => void;
}

const AccessDenied = ({ feature }: { feature: string }) => (
  <div className="p-8">
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-600">
          You don't have permission to access {feature}. Please contact your administrator.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { role, canView, loading, userId } = usePermissions(1); // Assuming user ID 1 for demo

  const renderPage = () => {
    switch (currentPage) {
      case 'register': return <Register onNavigateToLogin={() => {}} />;
      case 'dashboard': return <Dashboard />;
      case 'stock-management': return canView('stok') ? <StockManagement /> : <AccessDenied feature="Stock Management" />;
      case 'voucher-sales': return canView('penjualan') ? <VoucherSales /> : <AccessDenied feature="Voucher Sales" />;
      case 'laporan': return canView('laporan') ? <Laporan /> : <AccessDenied feature="Laporan" />;
      case 'top-pelanggan-report': return canView('top-customer-report') ? <TopPelangganReport /> : <AccessDenied feature="Top Customer Report" />;
      case 'export-laporan': return canView('export-laporan') ? <ExportLaporan /> : <AccessDenied feature="Export Laporan" />;
      case 'export-link-report': return canView('export-link-report') ? <ExportLinkReport /> : <AccessDenied feature="Export Laporan per Link" />;
      case 'export-mitra-report': return canView('export-mitra-report') ? <ExportMitraReport /> : <AccessDenied feature="Export Laporan per Mitra" />;
      case 'export-owner-report': return canView('export-owner-report') ? <ExportOwnerRevenue /> : <AccessDenied feature="Export Laporan Owner" />;
      case 'export-owner-combined-report': return canView('export-owner-combined-report') ? <ExportOwnerCombinedReport /> : <AccessDenied feature="Export Laporan Gabungan Owner" />;
      case 'manajemen-penyetoran': return canView('penyetoran') ? <ManajemenPenyetoran /> : <AccessDenied feature="Manajemen Penyetoran" />;
      case 'kupon-hadiah': return canView('kupon') ? <KuponHadiahPage /> : <AccessDenied feature="Kupon Hadiah" />;
      case 'kupon-approval': return canView('kupon') ? <KuponApproval /> : <AccessDenied feature="Kupon Approval" />;
      case 'hak-akses': return canView('hak-akses') ? <HakAkses /> : <AccessDenied feature="Hak Akses" />;
      case 'user-management': return canView('user-management') ? <UserManagement /> : <AccessDenied feature="User Management" />;
      case 'excel-management': return canView('excel-management') ? <ExcelManagement /> : <AccessDenied feature="Excel Management" />;
      case 'log-aktivitas': return canView('log-management') ? <LogAktivitas /> : <AccessDenied feature="Log Aktivitas" />;
      case 'admin-permissions': return canView('admin-permission-management') ? <AdminPermissions /> : <AccessDenied feature="Admin Permissions" />;
      case 'mitra-management': return role === 'Mitra Cabang' ? <MitraManagement /> : <AccessDenied feature="Mitra Management" />;
      case 'customer-management': return canView('customer-management') ? <CustomerManagement /> : <AccessDenied feature="Customer Management" />;
      case 'coupon-management': return canView('coupon-management') ? <CouponManagement /> : <AccessDenied feature="Coupon Management" />;
      case 'notifikasi': return <Notifikasi />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading Permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5EEDA] dark:bg-[#3a2e25]">
      <Sidenav currentPage={currentPage} setCurrentPage={setCurrentPage} canView={canView} role={role} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header currentUserId={userId} onNotificationClick={() => setCurrentPage('notifikasi')} onLogout={onLogout} />
        <div className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
