'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface User { id: string; name: string | null; email?: string; role: string; avatarUrl: string | null; preferredLanguage: string; }
interface Participant { id: string; userId: string; user: { id: string; name: string | null; avatarUrl: string | null; role: string }; }
interface RfqInfo { rfqNumber: string; status: string; destinationCountry: string; }
interface Conversation {
  id: string; title: string | null; status: string; updatedAt: string;
  unreadCount: number;
  messages: { content: string; sender: { name: string | null } }[];
  participants: Participant[];
  rfq: RfqInfo | null;
}
interface Message {
  id: string; senderId: string; content: string; displayContent: string;
  originalContent?: string; originalLanguage: string; createdAt: string;
  sender: { id: string; name: string | null; avatarUrl: string | null; role: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Avatar({ name, url, size = 36 }: { name?: string | null; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={name ?? ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  const letter = (name ?? '?')[0].toUpperCase();
  const colors = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706'];
  const bg = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.4, flexShrink: 0 }}>
      {letter}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const STATUS_COLORS: Record<string, string> = {
  submitted: '#3b82f6', responded: '#f59e0b', accepted: '#10b981', closed: '#6b7280', draft: '#94a3b8',
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CRMLayout({ user, conversations: initConversations, unreadTotal: initUnread }: {
  user: User;
  conversations: Conversation[];
  unreadTotal: number;
}) {
  const [conversations, setConversations] = useState(initConversations);
  const [activeId, setActiveId] = useState<string | null>(initConversations[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showTranslated, setShowTranslated] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(initUnread);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageId = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const convPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeConversation = conversations.find(c => c.id === activeId);
  const otherParticipant = activeConversation?.participants.find(p => p.userId !== user.id)?.user;

  function showToast(text: string) {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  // ── Load messages ────────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (convId: string, silent = false) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}&userLang=${user.preferredLanguage}`);
      if (!res.ok) return;
      const data: Message[] = await res.json();
      if (!data.length) { if (!silent) setMessages([]); return; }

      const newLastId = data[data.length - 1].id;

      setMessages(prev => {
        // Check if there are new messages
        if (silent && lastMessageId.current && newLastId !== lastMessageId.current) {
          const newMsgs = data.filter(m => !prev.find(p => p.id === m.id) && m.senderId !== user.id);
          newMsgs.forEach(m => showToast(`💬 ${m.sender.name ?? 'Message'}: ${m.content.slice(0, 50)}`));
        }
        lastMessageId.current = newLastId;
        return data;
      });

      if (!silent) {
        // Mark as read
        fetch('/api/conversations/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: convId, userId: user.id }),
        }).catch(() => {});
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
      }
    } catch { /* ignore */ }
  }, [user.preferredLanguage, user.id]);

  // ── Load conversations (for sidebar refresh) ─────────────────────────────────
  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?userId=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data);
      const total = data.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0);
      setUnreadTotal(total);
    } catch { /* ignore */ }
  }, [user.id]);

  // ── Switch conversation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeId) return;
    lastMessageId.current = null;
    loadMessages(activeId);

    // Poll messages every 2 seconds
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => loadMessages(activeId, true), 2000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeId, loadMessages]);

  // ── Poll conversations list every 5s ────────────────────────────────────────
  useEffect(() => {
    convPollingRef.current = setInterval(refreshConversations, 5000);
    return () => { if (convPollingRef.current) clearInterval(convPollingRef.current); };
  }, [refreshConversations]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');

    // Optimistic UI
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      senderId: user.id,
      content: text,
      displayContent: text,
      originalLanguage: user.preferredLanguage,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name, avatarUrl: user.avatarUrl, role: user.role },
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, senderId: user.id, content: text, senderLanguage: user.preferredLanguage }),
      });
      const real = await res.json();
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...real, displayContent: real.content } : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const getDisplay = (msg: Message) =>
    (!showTranslated || msg.senderId === user.id)
      ? (msg.originalContent ?? msg.content)
      : (msg.displayContent ?? msg.content);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#f1f5f9', overflow: 'hidden' }}>

      {/* Toast container */}
      <div style={{ position: 'fixed', top: 70, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#1e40af', color: '#fff', padding: '12px 16px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', maxWidth: 280, fontSize: 13, animation: 'slideIn .2s ease' }}>
            {t.text}
          </div>
        ))}
      </div>

      {/* ═══ LEFT: Conversation List ══════════════════════════════════════════ */}
      <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 18 }}>💬</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>Messages</div>
                <div style={{ fontSize: 11, color: unreadTotal > 0 ? '#2563eb' : '#94a3b8', fontWeight: unreadTotal > 0 ? 700 : 400 }}>
                  {unreadTotal > 0 ? `${unreadTotal} unread` : 'All caught up ✓'}
                </div>
              </div>
            </div>
            <Avatar name={user.name} url={user.avatarUrl} size={30} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              No conversations yet.<br />Send an RFQ to start chatting.
            </div>
          ) : conversations.map(conv => {
            const other = conv.participants.find(p => p.userId !== user.id)?.user;
            const lastMsg = conv.messages[0];
            const isActive = conv.id === activeId;
            return (
              <button key={conv.id} onClick={() => setActiveId(conv.id)}
                style={{ width: '100%', padding: '11px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: isActive ? '#eff6ff' : 'transparent', borderLeft: `3px solid ${isActive ? '#2563eb' : 'transparent'}`, display: 'block' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={other?.name} url={other?.avatarUrl} size={38} />
                    {conv.unreadCount > 0 && (
                      <div style={{ position: 'absolute', top: -3, right: -3, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <div style={{ fontWeight: conv.unreadCount > 0 ? 800 : 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        {other?.name ?? conv.title ?? 'Conversation'}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{formatTime(conv.updatedAt)}</div>
                    </div>
                    {conv.rfq && (
                      <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, marginBottom: 2 }}>
                        📋 {conv.rfq.rfqNumber}
                        <span style={{ marginLeft: 5, background: STATUS_COLORS[conv.rfq.status] ?? '#94a3b8', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>
                          {conv.rfq.status}
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: conv.unreadCount > 0 ? '#374151' : '#94a3b8', fontWeight: conv.unreadCount > 0 ? 600 : 400, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {lastMsg ? `${lastMsg.sender.name ?? 'You'}: ${lastMsg.content}` : 'No messages yet'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc' }}>
          <Avatar name={user.name} url={user.avatarUrl} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name ?? user.email}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{user.role} · {user.preferredLanguage.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* ═══ CENTER: Chat Thread ═════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={otherParticipant?.name} url={otherParticipant?.avatarUrl} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                  {otherParticipant?.name ?? activeConversation.title ?? 'Conversation'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {otherParticipant?.role === 'vendor' ? '🏭 Manufacturer' : '🌍 Buyer'}
                  {activeConversation.rfq && <span> · 📋 {activeConversation.rfq.rfqNumber} · {activeConversation.rfq.destinationCountry}</span>}
                </div>
              </div>
              <button onClick={() => setShowTranslated(v => !v)}
                style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${showTranslated ? '#93c5fd' : '#e2e8f0'}`, background: showTranslated ? '#eff6ff' : '#f8fafc', color: showTranslated ? '#2563eb' : '#64748b', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                🌐 {showTranslated ? 'Auto-translate ON' : 'Original'}
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 60, color: '#94a3b8' }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>👋</div>
                  <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>Start the conversation</div>
                  <div style={{ fontSize: 13 }}>Messages auto-translate to each person&apos;s language via GPT-4o mini</div>
                </div>
              ) : messages.map(msg => {
                const isMine = msg.senderId === user.id;
                const display = getDisplay(msg);
                const hasTranslation = !isMine && msg.displayContent && msg.displayContent !== msg.content;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 7, alignItems: 'flex-end' }}>
                    {!isMine && <Avatar name={msg.sender.name} url={msg.sender.avatarUrl} size={26} />}
                    <div style={{ maxWidth: '60%' }}>
                      {!isMine && <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, marginLeft: 2 }}>{msg.sender.name ?? 'Unknown'}</div>}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMine ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#fff',
                        color: isMine ? '#fff' : '#1e293b',
                        fontSize: 14, lineHeight: 1.55,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        border: isMine ? 'none' : '1px solid #e2e8f0',
                        opacity: msg.id.startsWith('tmp-') ? 0.6 : 1,
                      }}>
                        {display}
                      </div>
                      {hasTranslation && showTranslated && (
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, marginLeft: 2 }}>
                          🌐 Auto-translated
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: isMine ? 'right' : 'left', marginRight: isMine ? 2 : 0, marginLeft: isMine ? 0 : 2 }}>
                        {formatTime(msg.createdAt)}
                        {msg.id.startsWith('tmp-') && ' · sending…'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '8px 12px' }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: 14, lineHeight: 1.5, background: 'transparent', fontFamily: 'inherit', maxHeight: 100, overflowY: 'auto' }} />
                <button onClick={sendMessage} disabled={sending || !input.trim()}
                  style={{ padding: '8px 18px', borderRadius: 10, background: input.trim() ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e2e8f0', color: input.trim() ? '#fff' : '#94a3b8', fontWeight: 800, fontSize: 15, border: 'none', cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                  {sending ? '…' : '→'}
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4, textAlign: 'center' }}>
                🌐 GPT-4o mini auto-translates · ⟳ updates every 2s · Enter to send
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#374151', marginBottom: 8 }}>Select a conversation</div>
            <div style={{ fontSize: 14 }}>or send an RFQ to start one</div>
            <Link href="/rfq/new" style={{ marginTop: 20, background: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
              + New RFQ →
            </Link>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: Profile Panel ════════════════════════════════════════════ */}
      <div style={{ width: 260, flexShrink: 0, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeConversation && otherParticipant ? (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', padding: '24px 16px', textAlign: 'center', color: '#fff' }}>
              <Avatar name={otherParticipant.name} url={otherParticipant.avatarUrl} size={56} />
              <div style={{ marginTop: 10, fontWeight: 800, fontSize: 15 }}>{otherParticipant.name ?? 'Unknown'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                {otherParticipant.role === 'vendor' ? '🏭 Manufacturer' : '🌍 Buyer'}
              </div>
            </div>

            <div style={{ padding: '14px' }}>
              {activeConversation.rfq && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a', marginBottom: 8 }}>📋 RFQ Details</div>
                  {[
                    { label: 'Number', value: activeConversation.rfq.rfqNumber },
                    { label: 'Status', value: <span style={{ background: STATUS_COLORS[activeConversation.rfq.status] ?? '#94a3b8', color: '#fff', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>{activeConversation.rfq.status}</span> },
                    { label: 'Ship to', value: `🌍 ${activeConversation.rfq.destinationCountry}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 5, marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#0f172a', marginBottom: 8 }}>👥 Participants</div>
                {activeConversation.participants.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Avatar name={p.user.name} url={p.user.avatarUrl} size={24} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, color: '#0f172a' }}>{p.user.name ?? 'Unknown'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.user.role}</div>
                    </div>
                    {p.userId === user.id && <span style={{ fontSize: 9, background: '#eff6ff', color: '#2563eb', padding: '1px 4px', borderRadius: 3, fontWeight: 700 }}>You</span>}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Link href="/rfq/new" style={{ display: 'block', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '10px', borderRadius: 10, fontWeight: 800, fontSize: 12, textDecoration: 'none', textAlign: 'center' }}>
                  📋 New RFQ →
                </Link>
                <Link href="/calculator" style={{ display: 'block', background: '#fffbeb', color: '#92400e', border: '1.5px solid #fde68a', padding: '9px', borderRadius: 10, fontWeight: 700, fontSize: 11, textDecoration: 'none', textAlign: 'center' }}>
                  🧮 Duty Calculator
                </Link>
              </div>

              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px', marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 3 }}>🌐 Auto-Translation Active</div>
                <div style={{ fontSize: 10, color: '#166534', lineHeight: 1.5 }}>
                  Messages auto-translate to each user&apos;s language · GPT-4o mini · ~$0.02/month
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: 8, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>👤</div>
            <div style={{ fontSize: 12 }}>Select a conversation</div>
          </div>
        )}
      </div>

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
