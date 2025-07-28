import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Users, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import backend from '~backend/client';
import type { UserListResponse, UserRecord } from '~backend/auth/get_users';

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await backend.auth.getUsers();
        setUsers(response.users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const handleExportToExcel = () => {
    if (users.length === 0) {
      toast({
        title: 'No Data',
        description: 'There is no user data to export.',
        variant: 'destructive',
      });
      return;
    }

    const dataToExport = users.map(user => ({
      'Full Name': user.fullName,
      'Username': user.username,
      'Email': user.email,
      'Role': user.role,
      'ID Number': user.idNumber,
      'Phone Number': user.phoneNumber,
      'Address': user.address,
      'Parent': user.parentName ? `${user.parentName} (${user.parentRole})` : 'N/A',
      'Registered At': new Date(user.createdAt).toLocaleString('id-ID'),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    
    const fileName = `laporan_pengguna_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: 'Export Successful',
      description: `${fileName} has been downloaded.`,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manajemen Pengguna
            </CardTitle>
            <Button onClick={handleExportToExcel} disabled={users.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Export ke Excel
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading user data...</p>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left font-medium">Full Name</th>
                      <th className="p-3 text-left font-medium">Username</th>
                      <th className="p-3 text-left font-medium">Role</th>
                      <th className="p-3 text-left font-medium">Parent</th>
                      <th className="p-3 text-left font-medium">Contact</th>
                      <th className="p-3 text-left font-medium">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{user.fullName}</td>
                        <td className="p-3 text-gray-600">@{user.username}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {user.parentName ? (
                            <div>
                              <div className="font-medium">{user.parentName}</div>
                              <div className="text-xs text-gray-500">{user.parentRole}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div>{user.email}</div>
                          <div className="text-xs text-gray-500">{user.phoneNumber}</div>
                        </td>
                        <td className="p-3 text-gray-600">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                <p className="text-gray-500">No users have been registered in the system yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
