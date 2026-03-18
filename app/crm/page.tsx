import { prisma } from '@/lib/db';
import CRMLayout from './CRMLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRM — Messages & Conversations',
};

// For demo: get the first user as "current user"
// In production: use session from NextAuth
async function getCurrentUser() {
  try {
    return await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, preferredLanguage: true },
    });
  } catch { return null; }
}

async function getConversations(userId: string) {
  try {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { name: true } } },
            },
            participants: {
              include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
            },
            rfq: { select: { rfqNumber: true, status: true, destinationCountry: true } },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });
    return participations.map(p => ({
      ...p.conversation,
      updatedAt: p.conversation.updatedAt.toISOString(),
      messages: p.conversation.messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
      unreadCount: p.unreadCount,
    }));
  } catch { return []; }
}

async function getUnreadCount(userId: string) {
  try {
    const result = await prisma.conversationParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount ?? 0;
  } catch { return 0; }
}

export default async function CRMPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>💬</div>
        <h2 style={{ fontWeight: 800, color: '#0f172a' }}>No users yet</h2>
        <p style={{ color: '#64748b' }}>Import a manufacturer first to start conversations</p>
      </div>
    );
  }

  const [conversations, unreadTotal] = await Promise.all([
    getConversations(user.id),
    getUnreadCount(user.id),
  ]);

  return <CRMLayout user={user} conversations={conversations} unreadTotal={unreadTotal} />;
}
