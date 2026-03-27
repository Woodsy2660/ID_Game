import { supabase } from './supabase'

/**
 * Removes ALL active Supabase Realtime channels from the client.
 *
 * Call this when leaving a game session (game ended, player exits)
 * to ensure no zombie channels linger and interfere with future sessions.
 */
export function removeAllChannels() {
  const channels = supabase.getChannels()
  if (channels.length > 0) {
    console.log('[channelCleanup] Removing', channels.length, 'stale channels')
    supabase.removeAllChannels()
  }
}

/**
 * Removes ALL existing channel instances whose topic matches the given name.
 *
 * supabase.channel() always creates a new instance (even if one with the same
 * name already exists), so multiple instances for the same topic can accumulate.
 * This function cleans up every one of them to guarantee a fresh start.
 */
export function removeChannelByName(name: string) {
  const topic = `realtime:${name}`
  let channels = supabase.getChannels()
  let stale = channels.filter((ch) => ch.topic === topic)
  if (stale.length > 0) {
    console.log('[channelCleanup] Removing', stale.length, 'channel(s):', name)
    stale.forEach((ch) => supabase.removeChannel(ch))
  }
}
