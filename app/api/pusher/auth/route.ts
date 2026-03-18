import { NextResponse } from 'next/server';

// Pusher not used — polling instead. Kept as stub.
export async function POST() {
  return NextResponse.json({ auth: 'not-used' });
}
