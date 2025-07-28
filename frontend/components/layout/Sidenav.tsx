import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Package,
  ShoppingCart,
  BarChart,
  FileSpreadsheet,
  Banknote,
  Gift,
  Users,
  FileText,
  History,
  Bell,
  LayoutDashboard,
  Network,
  Contact,
  Ticket,
  Trophy,
} from 'lucide-react';

interface SidenavProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  canView: (feature: string) => boolean;
  role: string;
}

const navItems = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' },
  { page: 'stock-management', label: 'Stock', icon: Package, feature: 'stok' },
  { page: 'voucher-sales', label: 'Sales', icon: ShoppingCart, feature: 'penjualan' },
  { page: 'laporan', label: 'Laporan', icon: BarChart, feature: 'laporan' },
  { page: 'top-pelanggan-report', label: 'Top Pelanggan', icon: Trophy, feature: 'top-customer-report' },
  { page: 'export-laporan', label: 'Export', icon: FileSpreadsheet, feature: 'export-laporan' },
  { page: 'export-link-report', label: 'Export Link', icon: FileSpreadsheet, feature: 'export-link-report' },
  { page: 'export-mitra-report', label: 'Export Mitra', icon: FileSpreadsheet, feature: 'export-mitra-report' },
  { page: 'export-owner-report', label: 'Export Owner', icon: FileSpreadsheet, feature: 'export-owner-report' },
  { page: 'export-owner-combined-report', label: 'Export Owner (Gabungan)', icon: FileSpreadsheet, feature: 'export-owner-combined-report' },
  { page: 'manajemen-penyetoran', label: 'Penyetoran', icon: Banknote, feature: 'penyetoran' },
  { page: 'kupon-hadiah', label: 'Kupon', icon: Gift, feature: 'kupon' },
  { page: 'kupon-approval', label: 'Kupon Approval', icon: Gift, feature: 'kupon' },
  { page: 'user-management', label: 'Users', icon: Users, feature: 'user-management' },
  { page: 'excel-management', label: 'Excel', icon: FileText, feature: 'excel-management' },
  { page: 'log-aktivitas', label: 'Logs', icon: History, feature: 'log-management' },
  { page: 'hak-akses', label: 'Permissions', icon: Shield, feature: 'hak-akses' },
  { page: 'admin-permissions', label: 'Admin Access', icon: Shield, feature: 'admin-permission-management' },
  { page: 'mitra-management', label: 'My Network', icon: Network, feature: 'mitra-management', roles: ['Mitra Cabang'] },
  { page: 'customer-management', label: 'Customers', icon: Contact, feature: 'customer-management', roles: ['Link'] },
  { page: 'coupon-management', label: 'Coupons', icon: Ticket, feature: 'coupon-management', roles: ['Owner', 'Admin'] },
  { page: 'notifikasi', label: 'Notifikasi', icon: Bell, feature: 'notifikasi' },
];

export default function Sidenav({ currentPage, setCurrentPage, canView, role }: SidenavProps) {
  return (
    <aside className="w-64 bg-[#6f4e37] dark:bg-gray-900 text-white p-4 flex flex-col">
      <div className="text-center mb-8 pt-4">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAADLM3zqAAAAA1BMVEX///+nxBvIAAAAjklEQVR4nO3BMQEAAAwCoNm/9F3hAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgFduAAD+NAwHAAAAAElFTkSuQmCC" alt="MJ98 Logo" className="w-24 h-auto mx-auto" />
        <h1 className="text-2xl font-bold text-[#FFD700] mt-2">MJ98</h1>
        <p className="text-xs text-gray-300/70">Voucher System</p>
      </div>
      <nav className="flex-grow space-y-2">
        {navItems.map(item => {
          const hasAccess = (item.feature === 'dashboard' || item.feature === 'notifikasi' || canView(item.feature)) &&
                            (!item.roles || item.roles.includes(role));
          
          if (!hasAccess) return null;

          const Icon = item.icon;
          const isActive = currentPage === item.page;

          return (
            <Button
              key={item.page}
              variant={isActive ? 'secondary' : 'ghost'}
              className={`w-full justify-start transition-all duration-200 ${
                isActive 
                  ? 'bg-[#FFD700]/20 text-[#FFD700] border-l-4 border-[#FFD700]' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => setCurrentPage(item.page)}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-[#FFD700]' : 'text-gray-400'}`} />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
