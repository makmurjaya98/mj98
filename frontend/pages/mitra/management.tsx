import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Users, Building, Link2 } from 'lucide-react';
import backend from '~backend/client';
import type { MyHierarchyResponse, HierarchyMember } from '~backend/mitra/get_my_hierarchy';

export default function MitraManagement() {
  const [hierarchy, setHierarchy] = useState<MyHierarchyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState<number>(1); // This should come from auth context (assuming user ID 1 is a Mitra Cabang)

  const { toast } = useToast();

  useEffect(() => {
    const fetchHierarchy = async () => {
      if (!currentUserId) return;
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('mitraId', currentUserId.toString());
        const response = await fetch(`/mitra/my-hierarchy?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch hierarchy');
        const data: MyHierarchyResponse = await response.json();
        setHierarchy(data);
      } catch (error) {
        console.error("Failed to fetch hierarchy:", error);
        toast({ title: "Error", description: "Failed to load your hierarchy.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchHierarchy();
  }, [currentUserId, toast]);

  if (loading) {
    return <div className="p-4">Loading your network...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Network Management</h1>
          <p className="text-gray-600">View and manage your Cabang and Link network.</p>
        </div>

        <Tabs defaultValue="cabang">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cabang" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Manage Cabang ({hierarchy?.cabang.length || 0})
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Manage Link ({hierarchy?.links.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cabang">
            <Card>
              <CardHeader>
                <CardTitle>Your Cabang</CardTitle>
              </CardHeader>
              <CardContent>
                <UserTable users={hierarchy?.cabang || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link">
            <Card>
              <CardHeader>
                <CardTitle>Your Links</CardTitle>
              </CardHeader>
              <CardContent>
                <UserTable users={hierarchy?.links || []} parentList={hierarchy?.cabang || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const UserTable = ({ users, parentList }: { users: HierarchyMember[], parentList?: HierarchyMember[] }) => {
  if (users.length === 0) {
    return <p className="text-center text-gray-500 py-8">No users found in this category.</p>;
  }

  const getParentName = (parentId: number | null) => {
    if (!parentId || !parentList) return '-';
    return parentList.find(p => p.id === parentId)?.fullName || 'Unknown';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-3 text-left font-medium">Full Name</th>
            <th className="p-3 text-left font-medium">Username</th>
            {parentList && <th className="p-3 text-left font-medium">Parent Cabang</th>}
            <th className="p-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium">{user.fullName}</td>
              <td className="p-3 text-gray-600">@{user.username}</td>
              {parentList && <td className="p-3">{getParentName(user.parentId)}</td>}
              <td className="p-3">
                {/* Action buttons can be added here, e.g., view reports */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
