import React from 'react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '../hooks/usePermissions';
import { Shield } from 'lucide-react';

interface PermissionButtonProps {
  feature: string;
  action: 'view' | 'edit' | 'delete';
  userId?: number;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export function PermissionButton({
  feature,
  action,
  userId,
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  ...props
}: PermissionButtonProps) {
  const { hasPermission, loading } = usePermissions(userId);

  const isDisabled = disabled || loading || !hasPermission(feature, action);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isDisabled}
      onClick={onClick}
      title={!hasPermission(feature, action) ? `No permission to ${action} ${feature}` : undefined}
      {...props}
    >
      {!hasPermission(feature, action) && !loading && (
        <Shield className="h-3 w-3 mr-1 text-gray-400" />
      )}
      {children}
    </Button>
  );
}
