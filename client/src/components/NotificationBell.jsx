import { useState } from 'react';
import { Link } from 'react-router-dom';
import usePolling from '../hooks/usePolling';
import * as notificationService from '../services/notifications';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell({ basePath }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  usePolling(() => {
    notificationService.getUnreadCount().then(setCount).catch(() => {});
  }, 10000);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const data = await notificationService.listNotifications().catch(() => []);
      setItems(data);
    }
  };

  const markRead = async (id) => {
    await notificationService.markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-dark)] transition-colors hover:bg-[var(--color-sand)]"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="reveal-scale is-visible absolute right-0 top-12 z-40 w-80 rounded-xl border border-black/5 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            <Link to={`${basePath}/notifications`} className="text-xs text-[var(--color-accent)]" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-400">No notifications yet.</p>}
            {items.slice(0, 8).map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`block w-full border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-gray-50 ${
                  n.isRead ? 'opacity-60' : ''
                }`}
              >
                <p className="font-semibold text-[var(--color-dark)]">{n.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
