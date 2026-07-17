import { Platform } from 'react-native';
import { Colors } from './colors';

/** Monospace family for license-number / DLN / score treatments. Cross-platform. */
export const Mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, Consolas, monospace',
}) as string;

/**
 * Soft card elevation for the light theme — a low navy-tinted shadow.
 * Works on web (boxShadow via RN-web) and native (shadow* / elevation).
 */
export const Shadow = {
  card: {
    shadowColor: '#132360',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: '#132360',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
