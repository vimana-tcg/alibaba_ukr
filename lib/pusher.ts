// Pusher is not used — real-time is handled via polling.
// Stub kept so API routes compile without changes.
export const pusherServer = {
  trigger: async (_channel?: string, _event?: string, _data?: unknown) => {},
  authorizeChannel: () => ({ auth: '' }),
};
