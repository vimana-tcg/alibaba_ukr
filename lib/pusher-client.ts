import PusherJS from 'pusher-js';

// Singleton client-side Pusher instance
let pusherClientInstance: PusherJS | null = null;

export function getPusherClient(): PusherJS {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherJS(
      process.env.NEXT_PUBLIC_PUSHER_KEY ?? 'demo',
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu',
        authEndpoint: '/api/pusher/auth',
      }
    );
  }
  return pusherClientInstance;
}
