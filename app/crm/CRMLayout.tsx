'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getPusherClient } from '@/lib/pusher-client';

// ── Types ──────────────────────────────────────────────────────────────────────

interface User { id: string; name: string | null; email?: string; role: string; avatarUrl: string | null; preferredLanguage: string; }
interface Participant { id: string; userId: string; user: { id: string; name: string | null; avatarUrl: string | null; role: string }; }
interface Rfq { rfqNumber: string; status: string; destinationCountry: string; }
interface Conversation {
  id: string; title: string | null; status: string; updatedAt: string;
  unreadCount: number;
  messages: { content: string; sender: { name: string | null } }[];
  participants: Participant[];
  rfq: Rfq | null;
}
interface Message {
  id: string; senderId: string; content: string; displayContent: string;
  originalContent?: string; originalLanguage: string; createdAt: string;
  sender: { id: string; name: string | null; avatarUrl: string | null; role: string };
  translations?: { language: string; content: string }[];
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
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
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
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showTranslated, setShowTranslated] = useState(true);
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const [unreadTotal, setUnreadTotal] = useState(initUnread);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(c => c.id === activeId);
  const otherParticipant = activeConversation?.participants.find(p => p.userId !== user.id)?.user;

  // Load messages when conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}&userLang=${user.preferredLanguage}`);
      const data = await res.json();
      setMessages(data);
      // Mark as read
      await fetch('/api/conversations/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, userId: user.id }),
      });
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
      setUnreadTotal(prev => Math.max(0, prev - (conversations.find(c => c.id === convId)?.unreadCount ?? 0)));
    } catch { /* ignore */ }
    setLoadingMsgs(false);
  }, [user.preferredLanguage, user.id, conversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pusher real-time subscription
  useEffect(() => {
    if (!activeId) return;
    let channel: ReturnType<typeof getPusherClient>['subscribe'] extends (...args: infer A) => infer R ? R : never;
    try {
      const pusher = getPusherClient();
      channel = pusher.subscribe(`conversation-${activeId}`);
      (channel as { bind: (event: string, fn: (data: Message) => void) => void }).bind('new-message', (data: Message) => {
        setMessages(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, { ...data, displayContent: data.content }];
        });
        setConversations(c => c.map(conv => conv.id === activeId ? { ...conv, messages: [{ content: data.content, sender: data.sender }] } : conv));
      });

      // Subscribe to personal translation channel
      const userChannel = pusher.subscribe(`private-user-${user.id}`);
      (userChannel as { bind: (event: string, fn: (data: { messageId: string; translatedContent: string }) => void) => void }).bind('translated-message', (data: { messageId: string; translatedContent: string }) => {
        setTranslationMap(prev => ({ ...prev, [data.messageId]: data.translatedContent }));
      });
      (userChannel as { bind: (event: string, fn: (data: { conversationId: string }) => void) => void }).bind('new-notification', (data: { conversationId: string }) => {
        if (data.conversationId !== activeId) setUnreadTotal(p => p + 1);
      });
    } catch { /* Pusher not configured */ }

    return () => {
      try {
        const pusher = getPusherClient();
        pusher.unsubscribe(`conversation-${activeId}`);
      } catch { /* ignore */ }
    };
  }, [activeId, user.id]);

  async function sendMessage() {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, senderId: user.id, content: text, senderLanguage: user.preferredLanguage }),
      });
      const msg = await res.json();
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, { ...msg, displayContent: msg.content }]);
    } catch { /* ignore */ }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const getDisplayContent = (msg: Message) => {
    if (!showTranslated) return msg.originalContent ?? msg.content;
    if (msg.senderId === user.id) return msg.content;
    return translationMap[msg.id] ?? msg.displayContent ?? msg.content;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: '#f1f5f9', overflow: 'hidden' }}>

      {/* ═══ LEFT: Conversation List ═══════════════════════════════════════════ */}
      <div style={{ width: 320, flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20 }}>💬</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>Messages</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {unreadTotal > 0 ? <span style={{ color: '#2563eb', fontWeight: 700 }}>{unreadTotal} unread</span> : 'All caught up'}
                </div>
              </div>
            </div>
            <Avatar name={user.name} url={user.avatarUrl} size={32} />
          </div>
          <div style={{ position: 'relative' }}>
            <input placeholder="Search conversations…"
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              No conversations yet.<br />Send an RFQ to start.
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.participants.find(p => p.userId !== user.id)?.user;
              const lastMsg = conv.messages[0];
              const isActive = conv.id === activeId;
              return (
                <button key={conv.id} onClick={() => setActiveId(conv.id)}
                  style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background .1s', background: isActive ? '#eff6ff' : 'transparent', borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent', display: 'block' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar name={other?.name} url={other?.avatarUrl} size={40} />
                      {conv.unreadCount > 0 && (
                        <div style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <div style={{ fontWeight: conv.unreadCount > 0 ? 800 : 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 160, textOverflow: 'ellipsis' }}>
                          {other?.name ?? conv.title ?? 'Conversation'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{formatTime(conv.updatedAt)}</div>
                      </div>
                      {conv.rfq && (
                        <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, marginBottom: 2 }}>
                          📋 {conv.rfq.rfqNumber}
                          <span style={{ marginLeft: 6, background: STATUS_COLORS[conv.rfq.status], color: '#fff', padding: '1px 5px', borderRadius: 4 }}>
                            {conv.rfq.status}
                          </span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: conv.unreadCount > 0 ? '#374151' : '#94a3b8', fontWeight: conv.unreadCount > 0 ? 600 : 400, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        {lastMsg ? `${lastMsg.sender.name ?? 'You'}: ${lastMsg.content}` : 'No messages yet'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom: current user role */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc' }}>
          <Avatar name={user.name} url={user.avatarUrl} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name ?? user.email}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{user.role} · {user.preferredLanguage.toUpperCase()}</div>
          </div>
          <Link href="/dashboard" style={{ fontSize: 16, textDecoration: 'none' }}>⚙️</Link>
        </div>
      </div>

      {/* ═══ CENTER: Chat Thread ════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', minWidth: 0 }}>

        {activeConversation ? (
          <>
            {/* Chat header */}
            <div style={{ padding: '14px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={otherParticipant?.name} url={otherParticipant?.avatarUrl} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                  {otherParticipant?.name ?? activeConversation.title ?? 'Conversation'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {otherParticipant?.role === 'vendor' ? '🏭 Manufacturer' : '🌍 Buyer'}
                  {activeConversation.rfq && <span style={{ marginLeft: 8 }}>· 📋 {activeConversation.rfq.rfqNumber} · {activeConversation.rfq.destinationCountry}</span>}
                </div>
              </div>
              {/* Translation toggle */}
              <button onClick={() => setShowTranslated(v => !v)}
                style={{ padding: '6px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: showTranslated ? '#eff6ff' : '#f1f5f9', color: showTranslated ? '#2563eb' : '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {showTranslated ? '🌐 Auto-translated ON' : '🌐 Original'}
              </button>
              <div style={{ background: activeConversation.status === 'open' ? '#dcfce7' : '#f1f5f9', color: activeConversation.status === 'open' ? '#15803d' : '#64748b', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                {activeConversation.status.toUpperCase()}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40 }}>Loading messages…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 60, color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
                  <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>Start the conversation</div>
                  <div style={{ fontSize: 13 }}>Messages will be auto-translated to each person&apos;s language</div>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user.id;
                  const displayContent = getDisplayContent(msg);
                  const hasTranslation = !isMine && (translationMap[msg.id] || msg.displayContent !== msg.originalContent);
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                      {!isMine && <Avatar name={msg.sender.name} url={msg.sender.avatarUrl} size={28} />}
                      <div style={{ maxWidth: '65%' }}>
                        {!isMine && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, marginLeft: 2 }}>
                            {msg.sender.name ?? 'Unknown'}
                          </div>
                        )}
                        <div style={{
                          padding: '11px 15px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMine ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#fff',
                          color: isMine ? '#fff' : '#1e293b',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          fontSize: 14, lineHeight: 1.55,
                          border: isMine ? 'none' : '1px solid #e2e8f0',
                        }}>
                          {displayContent}
                        </div>
                        {/* Translation indicator */}
                        {hasTranslation && showTranslated && (
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, marginLeft: 2 }}>
                            🌐 Auto-translated · <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowTranslated(false)}>see original</span>
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: isMine ? 'right' : 'left', marginRight: isMine ? 2 : 0, marginLeft: isMine ? 0 : 2 }}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 20px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '8px 12px' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: 14, lineHeight: 1.5, background: 'transparent', fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto' }}
                />
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {user.preferredLanguage !== 'en' && (
                    <div style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center', marginRight: 4 }}>
                      🌐 {user.preferredLanguage.toUpperCase()}
                    </div>
                  )}
                  <button onClick={sendMessage} disabled={sending || !input.trim()}
                    style={{ padding: '8px 18px', borderRadius: 12, background: input.trim() ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e2e8f0', color: input.trim() ? '#fff' : '#94a3b8', fontWeight: 800, fontSize: 14, border: 'none', cursor: input.trim() ? 'pointer' : 'default', transition: 'all .15s' }}>
                    {sending ? '…' : '→'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 5, textAlign: 'center' }}>
                Messages are auto-translated to each person&apos;s preferred language · Powered by GPT-4o mini
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#374151', marginBottom: 8 }}>Select a conversation</div>
            <div style={{ fontSize: 14 }}>Choose from the list on the left</div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: Profile Panel ══════════════════════════════════════════════ */}
      <div style={{ width: 280, flexShrink: 0, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeConversation && otherParticipant ? (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Profile header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', padding: '28px 20px', textAlign: 'center', color: '#fff' }}>
              <Avatar name={otherParticipant.name} url={otherParticipant.avatarUrl} size={64} />
              <div style={{ marginTop: 12, fontWeight: 800, fontSize: 16 }}>{otherParticipant.name ?? 'Unknown'}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                {otherParticipant.role === 'vendor' ? '🏭 Manufacturer' : '🌍 Buyer'}
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              {/* RFQ Details */}
              {activeConversation.rfq && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 10 }}>📋 RFQ Details</div>
                  {[
                    { label: 'Number', value: activeConversation.rfq.rfqNumber },
                    { label: 'Status', value: <span style={{ background: STATUS_COLORS[activeConversation.rfq.status], color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{activeConversation.rfq.status}</span> },
                    { label: 'Destination', value: `🌍 ${activeConversation.rfq.destinationCountry}` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Participants */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 10 }}>👥 Participants</div>
                {activeConversation.participants.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar name={p.user.name} url={p.user.avatarUrl} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#0f172a' }}>{p.user.name ?? 'Unknown'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.user.role}</div>
                    </div>
                    {p.userId === user.id && <span style={{ fontSize: 10, background: '#eff6ff', color: '#2563eb', padding: '1px 5px', borderRadius: 4, fontWeight: 700, marginLeft: 'auto' }}>You</span>}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/rfq/new"
                  style={{ display: 'block', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '11px', borderRadius: 12, fontWeight: 800, fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
                  📋 New RFQ →
                </Link>
                <Link href="/calculator"
                  style={{ display: 'block', background: '#fffbeb', color: '#92400e', border: '1.5px solid #fde68a', padding: '10px', borderRadius: 12, fontWeight: 700, fontSize: 12, textDecoration: 'none', textAlign: 'center' }}>
                  🧮 Duty Calculator
                </Link>
              </div>

              {/* Translation info */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px', marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>🌐 Auto-Translation Active</div>
                <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.5 }}>
                  Your messages are automatically translated to each participant&apos;s language via GPT-4o mini.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: 8, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>👤</div>
            <div style={{ fontSize: 13 }}>Select a conversation to see details</div>
          </div>
        )}
      </div>
    </div>
  );
}
