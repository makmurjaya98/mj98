import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Bell, MailOpen, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import backend from '~backend/client';
import type { Notification, NotificationsResponse } from '~backend/notification/get_all';

export default function Notifikasi() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState<number>(1); // This should come from authentication context

  const { toast } = useToast();

  useEffect(() => {
    const fetchAndMarkRead = async () => {
      if (!currentUserId) return;
      try {
        setLoading(true);
        // Fetch notifications
        const params = new URLSearchParams();
        params.append('userId', currentUserId.toString());
        const response = await fetch(`/notifications?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data: NotificationsResponse = await response.json();
        setNotifications(data.notifications);

        // Mark all as read
        if (data.unreadCount > 0) {
          await backend.notification.markAsRead({ userId: currentUserId });
        }
      } catch (error) {
        console.error('Failed to process notifications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notifications. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAndMarkRead();
  }, [currentUserId, toast]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Notifikasi</h1>
          <p className="text-gray-600">Riwayat semua notifikasi sistem Anda.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Riwayat Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading notifications...</p>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div key={notification.id} className={`flex items-start gap-4 p-4 rounded-lg border ${
                    notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div>{getIconForType(notification.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-sm text-gray-700">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MailOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Notifikasi</h3>
                <p className="text-gray-500">Kotak masuk notifikasi Anda kosong.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
