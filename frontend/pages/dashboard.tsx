import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import LinkDashboard from '../components/dashboard/LinkDashboard';
import CabangDashboard from '../components/dashboard/CabangDashboard';
import MitraDashboard from '../components/dashboard/MitraDashboard';
import AdminOwnerDashboard from '../components/dashboard/AdminOwnerDashboard';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  // In a real app, the user ID would come from an authentication context.
  // We use a static ID for demonstration purposes.
  const { role, userId, loading } = usePermissions(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading Dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId) {
    return <div>Error: User not found.</div>;
  }

  switch (role) {
    case 'Link':
      return <LinkDashboard userId={userId} />;
    case 'Cabang':
      return <CabangDashboard userId={userId} />;
    case 'Mitra Cabang':
      return <MitraDashboard userId={userId} />;
    case 'Admin':
    case 'Owner':
      return <AdminOwnerDashboard />;
    default:
      return <div>Invalid role or not logged in. Please register or log in.</div>;
  }
}
