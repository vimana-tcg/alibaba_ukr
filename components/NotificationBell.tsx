'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
  id: string; type: string; title: string;
  body: string | null; link: string | null;
  isRead: boolean; createdAt: string;
}

function formatTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const TYPE_ICONS: Record<string, string> = {
  new_message: '💬', new_rfq: '📋', rfq_response: '✅',
};

export default function NotificationBell({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; title: string }[]>([]);
  const lastCountRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  function showToast(title: string) {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  useEffect(() => {
    if (!userId) return;

    async function poll() {
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        if (!res.ok) return;
        const data: Notification[] = await res.json();
        const newUnread = data.filter(n => !n.isRead).length;
        // Show toast if new notifications arrived
        if (lastCountRef.current > 0 && newUnread > lastCountRef.current) {
          const newest = data.find(n => !n.isRead);
          if (newest) showToast(newest.title);
        }
        lastCountRef.current = newUnread;
        setNotifications(data);
      } catch { /* ignore */ }
    }

    poll();
    const interval = setInterval(poll, 8000); // poll every 8s
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    lastCountRef.current = 0;
    await fetch(`/api/notifications?userId=${userId}`, { method: 'PATCH' }).catch(() => {});
  }

  if (!userId) return null;

  return (
    <>
      {/* Toast */}
      <div style={{ position: 'fixed', top: 70, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#1e40af', color: '#fff', padding: '10px 14px', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: 260, fontSize: 13, animation: 'ntf-in .2s ease' }}>
            🔔 {t.title}
          </div>
        ))}
      </div>

      {/* Bell */}
      <div ref={panelRef} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
          🔔
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 300, background: '#fff', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>Notifications</div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔕</div>No notifications
                </div>
              ) : notifications.slice(0, 20).map(n => (
                <Link key={n.id} href={n.link ?? '/crm'} onClick={() => setOpen(false)}
                  style={{ display: 'flex', gap: 8, padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #f8fafc', background: n.isRead ? 'transparent' : '#fafbff' }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_ICONS[n.type] ?? '🔔'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 12, color: '#0f172a', lineHeight: 1.3 }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{formatTime(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 3 }} />}
                </Link>
              ))}
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <Link href="/crm" onClick={() => setOpen(false)} style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                Open Messages →
              </Link>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes ntf-in { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }`}</style>
    </>
  );
}
