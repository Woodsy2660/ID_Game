import { Platform, TextStyle } from 'react-native';
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
    fontSize: 30,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 35,
    letterSpacing: -0.4,
    color: Colors.ink,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 26,
    letterSpacing: -0.2,
    color: Colors.ink,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
    color: Colors.ink,
  },
  helper: {
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 20,
    color: Colors.inkSoft,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 16,
    color: Colors.inkSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
  /** Monospace treatment for codes, DLN fields, scores, timers. */
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' }),
    letterSpacing: 1,
    color: Colors.ink,
  },
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;
