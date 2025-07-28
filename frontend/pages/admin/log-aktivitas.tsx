import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { History, User, Clock } from 'lucide-react';
import backend from '~backend/client';
import type { ActivityLog, ActivityLogsResponse } from '~backend/auth/get_activity_logs';

export default function LogAktivitas() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const offset = (page - 1) * limit;
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        const response = await fetch(`/auth/activity-logs?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch activity logs');
        }
        
        const data: ActivityLogsResponse = await response.json();
        setLogs(data.logs);
        setTotalLogs(data.total);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load activity logs. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, toast]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Log Aktivitas Sistem</h1>
          <p className="text-gray-600">Tinjau semua aktivitas penting yang terjadi di dalam sistem.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Riwayat Aktivitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading logs...</p>
            ) : logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-left font-medium">Timestamp</th>
                      <th className="p-3 text-left font-medium">User</th>
                      <th className="p-3 text-left font-medium">Aksi</th>
                      <th className="p-3 text-left font-medium">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatDate(log.timestamp)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{log.username || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{log.role || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.aksi}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700">{log.deskripsi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
                <p className="text-gray-500">There are no activity logs to display.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
