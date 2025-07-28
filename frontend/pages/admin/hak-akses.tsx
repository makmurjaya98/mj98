import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Settings, Users, Eye, Edit, Trash2, Plus, Check, X } from 'lucide-react';
import backend from '~backend/client';
import type { SetRolePermissionRequest } from '~backend/auth/set_role_permission';
import type { RolePermissionsResponse, RolePermission } from '~backend/auth/get_role_permissions';
import type { DeleteRolePermissionRequest } from '~backend/auth/delete_role_permission';

interface FormData {
  role: string;
  feature: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const ROLES = [
  { value: "Admin", label: "Admin" },
  { value: "Mitra Cabang", label: "Mitra Cabang" },
  { value: "Cabang", label: "Cabang" },
  { value: "Link", label: "Link" },
];

const FEATURES = [
  { value: "stok", label: "Manajemen Stok" },
  { value: "penjualan", label: "Penjualan Voucher" },
  { value: "laporan", label: "Laporan" },
  { value: "pengaturan-harga", label: "Pengaturan Harga" },
  { value: "penyetoran", label: "Manajemen Penyetoran" },
  { value: "kupon", label: "Kupon Hadiah" },
  { value: "hak-akses", label: "Hak Akses" },
  { value: "user", label: "Manajemen User" },
];

export default function HakAkses() {
  const [formData, setFormData] = useState<FormData>({
    role: '',
    feature: '',
    canView: false,
    canEdit: false,
    canDelete: false,
  });

  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<RolePermissionsResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState('manage');

  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async (role?: string) => {
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      
      const response = await fetch(`/auth/role-permissions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      
      const data: RolePermissionsResponse = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.role) return 'Please select a role';
    if (!formData.feature) return 'Please select a feature';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const permissionData: SetRolePermissionRequest = {
        role: formData.role,
        feature: formData.feature,
        canView: formData.canView,
        canEdit: formData.canEdit,
        canDelete: formData.canDelete,
      };

      const response = await backend.auth.setRolePermission(permissionData);

      toast({
        title: 'Success',
        description: response.message,
        variant: 'default',
      });

      // Reset form
      setFormData({
        role: '',
        feature: '',
        canView: false,
        canEdit: false,
        canDelete: false,
      });

      // Refresh permissions
      await fetchPermissions(selectedRole);

    } catch (error: any) {
      console.error('Permission update failed:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update permission. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    try {
      const deleteData: DeleteRolePermissionRequest = {
        permissionId,
      };

      const response = await backend.auth.deleteRolePermission(deleteData);

      toast({
        title: 'Success',
        description: response.message,
        variant: 'default',
      });

      // Refresh permissions
      await fetchPermissions(selectedRole);

    } catch (error: any) {
      console.error('Permission deletion failed:', error);
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete permission. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    fetchPermissions(role || undefined);
  };

  const getFeatureLabel = (feature: string) => {
    return FEATURES.find(f => f.value === feature)?.label || feature;
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    );
  };

  const groupedPermissions = permissions?.permissions.reduce((acc, permission) => {
    if (!acc[permission.role]) {
      acc[permission.role] = [];
    }
    acc[permission.role].push(permission);
    return acc;
  }, {} as Record<string, RolePermission[]>) || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Manajemen Hak Akses</h1>
          <p className="text-gray-600">Kelola hak akses per role untuk fitur-fitur sistem</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Kelola Hak Akses
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Lihat Hak Akses
            </TabsTrigger>
          </TabsList>

          {/* Manage Permissions Tab */}
          <TabsContent value="manage">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Atur Hak Akses Role
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select 
                            value={formData.role} 
                            onValueChange={(value) => handleInputChange('role', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="feature">Fitur</Label>
                          <Select 
                            value={formData.feature} 
                            onValueChange={(value) => handleInputChange('feature', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih fitur" />
                            </SelectTrigger>
                            <SelectContent>
                              {FEATURES.map((feature) => (
                                <SelectItem key={feature.value} value={feature.value}>
                                  {feature.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Hak Akses</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="canView"
                              checked={formData.canView}
                              onCheckedChange={(checked) => handleInputChange('canView', checked as boolean)}
                            />
                            <Label htmlFor="canView" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Lihat Data
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="canEdit"
                              checked={formData.canEdit}
                              onCheckedChange={(checked) => handleInputChange('canEdit', checked as boolean)}
                            />
                            <Label htmlFor="canEdit" className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit Data
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="canDelete"
                              checked={formData.canDelete}
                              onCheckedChange={(checked) => handleInputChange('canDelete', checked as boolean)}
                            />
                            <Label htmlFor="canDelete" className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Hapus Data
                            </Label>
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loading}
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Hak Akses'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Ringkasan Hak Akses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-600">Role yang Dipilih</h4>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formData.role ? ROLES.find(r => r.value === formData.role)?.label : 'Belum dipilih'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-600">Fitur yang Dipilih</h4>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formData.feature ? getFeatureLabel(formData.feature) : 'Belum dipilih'}
                          </div>
                        </div>
                      </div>

                      {(formData.canView || formData.canEdit || formData.canDelete) && (
                        <div className="space-y-2 pt-4 border-t">
                          <h4 className="font-medium text-sm text-gray-600">Hak Akses</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span>Lihat Data:</span>
                              {getPermissionIcon(formData.canView)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Edit Data:</span>
                              {getPermissionIcon(formData.canEdit)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Hapus Data:</span>
                              {getPermissionIcon(formData.canDelete)}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-4 p-2 bg-blue-50 rounded">
                        <Shield className="h-3 w-3 inline mr-1" />
                        Hanya Owner yang dapat mengubah hak akses sistem
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* View Permissions Tab */}
          <TabsContent value="view">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Daftar Hak Akses
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="roleFilter">Filter Role:</Label>
                  <Select value={selectedRole} onValueChange={handleRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Semua Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Role</SelectItem>
                      <SelectItem value="Owner">Owner</SelectItem>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {permissions && permissions.permissions.length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([role, rolePermissions]) => (
                      <div key={role} className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {role}
                          <span className="text-sm font-normal text-gray-500">
                            ({rolePermissions.length} fitur)
                          </span>
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-200 p-3 text-left font-medium">Fitur</th>
                                <th className="border border-gray-200 p-3 text-center font-medium">Lihat</th>
                                <th className="border border-gray-200 p-3 text-center font-medium">Edit</th>
                                <th className="border border-gray-200 p-3 text-center font-medium">Hapus</th>
                                {role !== 'Owner' && (
                                  <th className="border border-gray-200 p-3 text-center font-medium">Aksi</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {rolePermissions.map((permission) => (
                                <tr key={permission.id} className="hover:bg-gray-50">
                                  <td className="border border-gray-200 p-3 font-medium">
                                    {getFeatureLabel(permission.feature)}
                                  </td>
                                  <td className="border border-gray-200 p-3 text-center">
                                    {getPermissionIcon(permission.canView)}
                                  </td>
                                  <td className="border border-gray-200 p-3 text-center">
                                    {getPermissionIcon(permission.canEdit)}
                                  </td>
                                  <td className="border border-gray-200 p-3 text-center">
                                    {getPermissionIcon(permission.canDelete)}
                                  </td>
                                  {role !== 'Owner' && (
                                    <td className="border border-gray-200 p-3 text-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeletePermission(permission.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Found</h3>
                    <p className="text-gray-500">
                      {selectedRole 
                        ? `No permissions found for ${selectedRole} role.`
                        : 'No permissions have been configured yet.'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
