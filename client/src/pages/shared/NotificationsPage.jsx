import { useEffect, useState } from 'react';
import * as notificationService from '../../services/notifications';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function NotificationsPage() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => notificationService.listNotifications().then(setItems).finally(() => setLoading(false));
  useEffect(load, []);

  const markAll = async () => {
    await notificationService.markAllRead();
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-dark)]">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">Stock updates, order status, and demand alerts.</p>
        </div>
        {items.length > 0 && <Button variant="outline" onClick={markAll}>Mark all read</Button>}
      </div>

      {items.length === 0 && <EmptyState title="You're all caught up" message="New notifications will appear here." />}

      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className={n.isRead ? 'opacity-60' : 'border-l-4 border-[var(--color-accent)]'}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[var(--color-dark)]">{n.title}</p>
                <p className="mt-1 text-sm text-gray-500">{n.message}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
