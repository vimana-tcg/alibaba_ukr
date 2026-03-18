import { NextRequest, NextResponse } from 'next/server';

// Pusher private channel auth endpoint
export async function POST(req: NextRequest) {
  if (!process.env.PUSHER_APP_ID) {
    return NextResponse.json({ auth: 'demo' });
  }

  const { pusherServer } = await import('@/lib/pusher');
  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id') ?? '';
  const channel = params.get('channel_name') ?? '';

  // TODO: verify session here for production
  const auth = pusherServer.authorizeChannel(socketId, channel);
  return NextResponse.json(auth);
}
