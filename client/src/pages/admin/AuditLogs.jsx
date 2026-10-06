import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

export default function AuditLogs() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.listAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-dark)]">Audit logs</h1>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{log.User?.name || 'System'}</td>
                <td className="px-4 py-3 font-semibold text-[var(--color-dark)]">{log.action}</td>
                <td className="px-4 py-3 text-gray-500">
                  {log.entityType ? `${log.entityType} #${log.entityId}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
