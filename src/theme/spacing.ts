/** Base-8 spacing scale: 4, 8, 16, 24, 32, 48, 64, 96 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

/** Named layout constants */
export const Layout = {
  screenPaddingH: 20,
  screenPaddingTop: 48,
  screenPaddingBottom: 32,
  cardPadding: 20,
  labelInputGap: 8,
  buttonGap: 12,
  listItemGap: 8,
} as const;
