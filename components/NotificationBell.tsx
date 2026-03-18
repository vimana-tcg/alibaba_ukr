'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getPusherClient } from '@/lib/pusher-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function formatTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const TYPE_ICONS: Record<string, string> = {
  new_message: '💬',
  new_rfq: '📋',
  rfq_response: '✅',
};

export default function NotificationBell({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; title: string; body: string }[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!userId) return;
    // Load initial notifications
    fetch(`/api/notifications?userId=${userId}`)
      .then(r => r.json())
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Subscribe to Pusher for new notifications
    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(`private-user-${userId}`);
      (channel as { bind: (event: string, fn: (data: { type: string; title: string; body: string }) => void) => void })
        .bind('new-notification', (data: { type: string; title: string; body: string }) => {
          const newN: Notification = {
            id: Date.now().toString(),
            type: data.type,
            title: data.title,
            body: data.body,
            link: '/crm',
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          setNotifications(prev => [newN, ...prev]);
          // Show toast
          const toastId = Date.now().toString();
          setToasts(prev => [...prev, { id: toastId, title: data.title, body: data.body }]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
        });
    } catch { /* Pusher not configured */ }

    // Click outside to close
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userId]);

  async function markAllRead() {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await fetch(`/api/notifications?userId=${userId}`, { method: 'PATCH' }).catch(() => {});
  }

  return (
    <>
      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: 70, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#1e40af', color: '#fff', padding: '12px 16px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', maxWidth: 280, fontSize: 13, animation: 'slideIn .2s ease', pointerEvents: 'auto' }}>
            <div style={{ fontWeight: 700 }}>💬 {t.title}</div>
            {t.body && <div style={{ fontSize: 12, color: '#bfdbfe', marginTop: 3 }}>{t.body}</div>}
          </div>
        ))}
      </div>

      {/* Bell button */}
      <div ref={panelRef} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 8, fontSize: 20, lineHeight: 1 }}>
          🔔
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320, background: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Notifications</div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <Link key={n.id} href={n.link ?? '/crm'}
                    onClick={() => setOpen(false)}
                    style={{ display: 'flex', gap: 10, padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid #f8fafc', background: n.isRead ? 'transparent' : '#fafbff', transition: 'background .1s' }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICONS[n.type] ?? '🔔'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: 13, color: '#0f172a', lineHeight: 1.3 }}>{n.title}</div>
                      {n.body && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{formatTime(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 4 }} />}
                  </Link>
                ))
              )}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <Link href="/crm" onClick={() => setOpen(false)}
                style={{ fontSize: 13, color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                Open CRM →
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: none; } }`}</style>
    </>
  );
}
