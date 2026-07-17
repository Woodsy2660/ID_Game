/**
 * Design system palette — light theme, "driver's license meets Brawl Stars".
 * Values sampled from assets/images/logo.png:
 *   gold  #FFD400  (logo card)
 *   navy  #1B2F7C  (logo shadow card)  •  edge #132360
 *
 * Golden rule for the light theme: GOLD IS A FILL, NEVER A TEXT COLOUR.
 * Gold text on the light ground fails contrast — use navy ink on gold instead.
 */
export const Colors = {
  // ── Grounds & surfaces ────────────────────────────────────────────────────
  bg: '#FAF7F0',        // warm white — screen backgrounds
  bgAlt: '#F1EBDD',     // subtle banded / inset areas
  surface: '#FFFFFF',   // cards
  raised: '#FFFFFF',    // elevated card (kept distinct name for callers)

  // ── Ink & text ────────────────────────────────────────────────────────────
  ink: '#16224E',       // primary text (deep navy)
  inkSoft: '#5B6070',   // secondary text (warm-navy grey), 4.6:1 on bg
  onPrimary: '#16224E', // text/icons sitting on gold
  onNavy: '#F5F7FF',    // text sitting on navy

  muted: '#5B6070',     // legacy alias for secondary text
  border: 'rgba(19,35,96,0.14)',      // hairline dividers / card borders
  borderStrong: 'rgba(19,35,96,0.28)',

  // ── Primary (gold) ────────────────────────────────────────────────────────
  primary: '#FFD400',
  primaryDim: '#F2C200',
  primaryEdge: '#C39B00',              // solid depth edge under gold buttons/cards
  primaryMuted: 'rgba(255,212,0,0.16)',

  // Legacy amber aliases
  amber: '#FFD400',
  amberDim: '#C39B00',

  // ── Secondary (navy) ──────────────────────────────────────────────────────
  secondary: '#1B2F7C',
  secondaryLight: '#3F51B5',
  navy: '#1B2F7C',
  navyEdge: '#132360',
  navySoft: 'rgba(27,47,124,0.08)',

  // ── Tertiary / success (green) ────────────────────────────────────────────
  tertiary: '#1E9E57',
  tertiaryDim: '#17824A',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success: '#1E9E57',
  warn: '#C8791A',        // amber-orange for warnings (legible on the light ground)
  error: '#E5484D',
  errorMuted: 'rgba(229,72,77,0.12)',

  /**
   * Deprecated legacy aliases. In the old dark theme `black` meant both
   * "screen background" and "text on gold", and `white` meant "primary text".
   * Under the light theme both resolve to navy ink so the ~55 text/on-accent
   * call sites stay correct automatically. Background call sites have been
   * migrated to `bg` / `surface`. Prefer ink / onPrimary / bg / surface in new code.
   */
  black: '#16224E',
  white: '#16224E',
} as const;
