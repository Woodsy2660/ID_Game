import { TextStyle } from 'react-native';
import { Colors } from './colors';

/**
 * Typography hierarchy — clear size jumps between each level.
 *
 * display:  Screen titles — 28–40px, 800 weight, white or primary
 * heading:  Section headings — 20px, 700 weight
 * body:     Instruction / body text — 15px, 400 weight, white
 * helper:   Status / helper text — 14px, 400 weight, muted
 * label:    Eyebrow / section labels — 11px, 600 weight, uppercase, muted
 */
export const Typography = {
  display: {
    fontSize: 28,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 34,
    color: Colors.white,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 26,
    color: Colors.white,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
    color: Colors.white,
  },
  helper: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    color: Colors.muted,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 16,
    color: Colors.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;
