import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  display: {
    fontSize: 28,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 32,
    color: Colors.white,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 24,
    color: Colors.white,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 21,
    color: Colors.white,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 11,
    color: Colors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
} as const;

export const Radius = {
  sm: 8,
  lg: 12,
} as const;
