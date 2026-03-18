import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/conversations?userId=xxx  — list conversations for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

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
            rfq: { select: { rfqNumber: true, status: true } },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const conversations = participations.map(p => ({
      ...p.conversation,
      unreadCount: p.unreadCount,
    }));

    return NextResponse.json(conversations);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}

// POST /api/conversations  — create conversation (auto-linked to RFQ)
export async function POST(req: NextRequest) {
  try {
    const { rfqId, buyerUserId, vendorUserId, title } = await req.json();
    if (!buyerUserId || !vendorUserId) {
      return NextResponse.json({ error: 'buyerUserId and vendorUserId required' }, { status: 400 });
    }

    // Check if conversation for this RFQ already exists
    if (rfqId) {
      const existing = await prisma.conversation.findUnique({ where: { rfqId } });
      if (existing) return NextResponse.json(existing);
    }

    const conversation = await prisma.conversation.create({
      data: {
        rfqId: rfqId ?? undefined,
        title: title ?? 'New conversation',
        participants: {
          create: [
            { userId: buyerUserId },
            { userId: vendorUserId },
          ],
        },
      },
    });

    return NextResponse.json(conversation);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
