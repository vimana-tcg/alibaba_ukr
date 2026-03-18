import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/conversations/mark-read  { conversationId, userId }
export async function POST(req: NextRequest) {
  try {
    const { conversationId, userId } = await req.json();
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
