/**
 * Design system color palette — derived from style guide.
 *
 * Primary:   #FFD700  (gold)
 * Secondary: #1A237E  (navy indigo)
 * Tertiary:  #00E676  (bright green)
 * Neutral:   #121212  (near-black)
 */
export const Colors = {
  // Neutrals
  black: '#121212',
  surface: '#1E1E1E',
  raised: '#2C2C2C',
  white: '#FAFAFA',
  muted: '#9E9E9E',
  border: '#333333',

  // Primary (gold)
  primary: '#FFD700',
  primaryDim: '#BFA100',
  primaryMuted: 'rgba(255, 215, 0, 0.12)',

  // Legacy aliases — keep so existing refs work
  amber: '#FFD700',
  amberDim: '#BFA100',

  // Secondary (navy)
  secondary: '#1A237E',
  secondaryLight: '#3F51B5',

  // Tertiary (green)
  tertiary: '#00E676',
  tertiaryDim: '#00C853',

  // Semantic
  success: '#00E676',
  error: '#FF5252',
  errorMuted: 'rgba(255, 82, 82, 0.12)',
} as const;
