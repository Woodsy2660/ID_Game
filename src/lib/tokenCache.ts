/**
 * Synchronous access token cache.
 * Updated whenever the Supabase auth session changes so that
 * beforeunload handlers (which must be synchronous) can read it.
 */
let _token: string | null = null

export function setCachedToken(token: string | null) {
  _token = token
}

export function getCachedToken(): string | null {
  return _token
}
