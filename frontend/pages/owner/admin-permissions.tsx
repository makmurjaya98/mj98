import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheck, User, Eye, Edit, Trash2 } from 'lucide-react';
import backend from '~backend/client';
import type { AdminUser } from '~backend/owner/get_admins';
import type { AdminPermission } from '~backend/owner/get_admin_permissions';

const MODULES = [
  { key: "stok", label: "Manajemen Stok" },
  { key: "penjualan", label: "Penjualan Voucher" },
  { key: "laporan", label: "Laporan" },
  { key: "pengaturan-harga", label: "Pengaturan Harga" },
  { key: "penyetoran", label: "Manajemen Penyetoran" },
  { key: "kupon", label: "Kupon Hadiah" },
  { key: "user-management", label: "Manajemen User" },
  { key: "excel-management", label: "Manajemen Excel" },
];

export default function AdminPermissions() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, { view: boolean; edit: boolean; delete: boolean }>>>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState<number>(1); // Should come from auth context

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [adminsRes, permissionsRes] = await Promise.all([
          backend.owner.getAdmins(),
          backend.owner.getAdminPermissions(),
        ]);
        setAdmins(adminsRes.admins);
        
        const perms: Record<string, Record<string, { view: boolean; edit: boolean; delete: boolean }>> = {};
        for (const p of permissionsRes.permissions) {
          if (!perms[p.adminId]) {
            perms[p.adminId] = {};
          }
          perms[p.adminId][p.moduleName] = { view: p.canView, edit: p.canEdit, delete: p.canDelete };
        }
        setPermissions(perms);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ title: "Error", description: "Failed to load admin permissions.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handlePermissionChange = async (adminId: number, moduleName: string, action: 'view' | 'edit' | 'delete', value: boolean) => {
    const newPermissions = { ...permissions };
    if (!newPermissions[adminId]) newPermissions[adminId] = {};
    if (!newPermissions[adminId][moduleName]) newPermissions[adminId][moduleName] = { view: false, edit: false, delete: false };
    
    newPermissions[adminId][moduleName][action] = value;
    setPermissions(newPermissions);

    try {
      await backend.owner.setAdminPermission({
        performerId: currentUserId,
        adminId,
        moduleName,
        canView: newPermissions[adminId][moduleName].view,
        canEdit: newPermissions[adminId][moduleName].edit,
        canDelete: newPermissions[adminId][moduleName].delete,
      });
      toast({ title: "Success", description: `Permission for ${moduleName} updated.` });
    } catch (error: any) {
      console.error("Failed to update permission:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      // Revert state on failure
      // (For simplicity, we're not reverting here, but in a real app you would)
    }
  };

  if (loading) {
    return <div className="p-4">Loading admin permissions...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Access Management</h1>
          <p className="text-gray-600">Set granular module permissions for each Admin user.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Admin Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {admins.map(admin => (
                <div key={admin.id}>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <User className="h-5 w-5" />
                    {admin.fullName} <span className="text-sm font-normal text-gray-500">(@{admin.username})</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="p-3 text-left font-medium">Module</th>
                          <th className="p-3 text-center font-medium">View</th>
                          <th className="p-3 text-center font-medium">Edit</th>
                          <th className="p-3 text-center font-medium">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULES.map(module => (
                          <tr key={module.key} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{module.label}</td>
                            <td className="p-3 text-center">
                              <Checkbox
                                checked={permissions[admin.id]?.[module.key]?.view || false}
                                onCheckedChange={(checked) => handlePermissionChange(admin.id, module.key, 'view', checked as boolean)}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Checkbox
                                checked={permissions[admin.id]?.[module.key]?.edit || false}
                                onCheckedChange={(checked) => handlePermissionChange(admin.id, module.key, 'edit', checked as boolean)}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Checkbox
                                checked={permissions[admin.id]?.[module.key]?.delete || false}
                                onCheckedChange={(checked) => handlePermissionChange(admin.id, module.key, 'delete', checked as boolean)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
