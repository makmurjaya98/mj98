import { useState, useEffect } from 'react';
import backend from '~backend/client';
import type { UserPermissionsResponse, UserPermission } from '~backend/auth/get_user_permissions';

interface UsePermissionsResult {
  permissions: UserPermission[];
  role: string;
  userId?: number;
  loading: boolean;
  error: string | null;
  hasPermission: (feature: string, action: 'view' | 'edit' | 'delete') => boolean;
  canView: (feature: string) => boolean;
  canEdit: (feature: string) => boolean;
  canDelete: (feature: string) => boolean;
}

export function usePermissions(userId?: number): UsePermissionsResult {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('userId', userId.toString());
        
        const response = await fetch(`/auth/user-permissions?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user permissions');
        }
        
        const data: UserPermissionsResponse = await response.json();
        setPermissions(data.permissions);
        setRole(data.role);
      } catch (err: any) {
        console.error('Failed to fetch permissions:', err);
        setError(err.message || 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userId]);

  const hasPermission = (feature: string, action: 'view' | 'edit' | 'delete'): boolean => {
    const permission = permissions.find(p => p.feature === feature);
    if (!permission) return false;

    switch (action) {
      case 'view':
        return permission.canView;
      case 'edit':
        return permission.canEdit;
      case 'delete':
        return permission.canDelete;
      default:
        return false;
    }
  };

  const canView = (feature: string): boolean => hasPermission(feature, 'view');
  const canEdit = (feature: string): boolean => hasPermission(feature, 'edit');
  const canDelete = (feature: string): boolean => hasPermission(feature, 'delete');

  return {
    permissions,
    role,
    userId,
    loading,
    error,
    hasPermission,
    canView,
    canEdit,
    canDelete,
  };
}
