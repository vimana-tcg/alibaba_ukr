import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';

// No-op broadcast — using polling instead of Pusher
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function broadcast(_channel: string, _event: string, _data: unknown) { }

let openai: OpenAI | null = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for message translation.');
  }

  if (!openai) {
    openai = new OpenAI({ apiKey });
  }

  return openai;
}

// Translate content to a target language using GPT-4o-mini
async function translateMessage(content: string, targetLang: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional B2B translator. Translate the message to the target language. Return ONLY the translated text.' },
        { role: 'user', content: `Translate to ${targetLang}:\n\n${content}` },
      ],
      temperature: 0,
      max_tokens: 500,
    });
    return res.choices[0].message.content ?? content;
  } catch {
    return content;
  }
}

// GET /api/messages?conversationId=xxx&userLang=de
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId');
  const userLang = req.nextUrl.searchParams.get('userLang') ?? 'en';
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
        translations: { where: { language: userLang } },
      },
    });

    // Return each message with translation if available
    const result = messages.map(m => ({
      ...m,
      displayContent: m.translations[0]?.content ?? m.content,
      originalContent: m.content,
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

// POST /api/messages  — send a message
export async function POST(req: NextRequest) {
  try {
    const { conversationId, senderId, content, senderLanguage = 'en' } = await req.json();
    if (!conversationId || !senderId || !content?.trim()) {
      return NextResponse.json({ error: 'conversationId, senderId, content required' }, { status: 400 });
    }

    // 1. Save message
    const message = await prisma.message.create({
      data: { conversationId, senderId, content: content.trim(), originalLanguage: senderLanguage },
      include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    });

    // 2. Update conversation.updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 3. Get all OTHER participants and their preferred languages
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
      include: { user: { select: { id: true, preferredLanguage: true } } },
    });

    // 4. Increment unread count for all participants except sender
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    // 5. Translate + notify each participant asynchronously (don't block response)
    const translationPromises = participants.map(async (p) => {
      const lang = p.user.preferredLanguage;
      if (lang === senderLanguage || lang === 'en') return;

      try {
        const translated = await translateMessage(content, lang);
        await prisma.messageTranslation.upsert({
          where: { messageId_language: { messageId: message.id, language: lang } },
          create: { messageId: message.id, language: lang, content: translated },
          update: { content: translated },
        });
        // Broadcast translated message to specific user channel
        await broadcast(`private-user-${p.userId}`, 'translated-message', {
          messageId: message.id,
          conversationId,
          translatedContent: translated,
          language: lang,
        });
      } catch (err) {
        console.error(`Translation failed for lang ${lang}:`, err);
      }
    });

    // 6. Broadcast original message to conversation channel
    await broadcast(`conversation-${conversationId}`, 'new-message', {
      ...message,
      displayContent: message.content,
    });

    // 7. Create in-app notifications for participants
    for (const p of participants) {
      await prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'new_message',
          title: `New message from ${message.sender.name ?? 'Someone'}`,
          body: content.slice(0, 100),
          link: `/crm/${conversationId}`,
        },
      });
      // Broadcast notification count update
      await broadcast(`private-user-${p.userId}`, 'new-notification', {
        type: 'new_message',
        title: `💬 ${message.sender.name ?? 'New message'}`,
        body: content.slice(0, 60),
        conversationId,
      });
    }

    // Run translations in background (after response)
    Promise.all(translationPromises).catch(console.error);

    return NextResponse.json({ ...message, displayContent: message.content });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
