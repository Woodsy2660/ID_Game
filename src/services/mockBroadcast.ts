/**
 * Mock broadcast channel — simulates Supabase Realtime broadcast events.
 *
 * In production, this is replaced by:
 *   const channel = supabase.channel(`game:${roomCode}`)
 *   channel.on('broadcast', { event: 'round:all_answered' }, callback)
 *
 * The mock version uses local EventEmitter-style pub/sub with optional delays
 * to simulate network latency and other players submitting answers.
 */

type Listener = (payload: any) => void;

class MockBroadcastChannel {
  private listeners: Map<string, Listener[]> = new Map();

  /** Subscribe to a broadcast event */
  on(event: string, callback: Listener): () => void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(callback);
    this.listeners.set(event, existing);
    // Return unsubscribe function
    return () => {
      const list = this.listeners.get(event) ?? [];
      this.listeners.set(event, list.filter((l) => l !== callback));
    };
  }

  /** Emit a broadcast event (optionally with delay to simulate network) */
  emit(event: string, payload: any, delayMs = 0): void {
    const fire = () => {
      const list = this.listeners.get(event) ?? [];
      list.forEach((l) => l(payload));
    };
    if (delayMs > 0) {
      setTimeout(fire, delayMs);
    } else {
      fire();
    }
  }

  /** Clear all listeners */
  unsubscribe(): void {
    this.listeners.clear();
  }
}

// Singleton channel per room — in production this is created per room connection
let channel: MockBroadcastChannel | null = null;

export function getGameChannel(): MockBroadcastChannel {
  if (!channel) channel = new MockBroadcastChannel();
  return channel;
}

export function resetChannel(): void {
  channel?.unsubscribe();
  channel = null;
}
