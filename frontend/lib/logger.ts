/**
 * Safe logging utility
 * - Disabled in production builds
 * - Helpful in development
 * - Won't break anything
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

export const debug = (...args: any[]) => {
  if (isDev) console.log(...args);
};

export const info = (...args: any[]) => {
  if (isDev) console.info(...args);
};

export const warn = (...args: any[]) => {
  if (isDev) console.warn(...args);
};

export const error = (...args: any[]) => {
  // Always log errors, even in production
  console.error(...args);
};

/**
 * Usage:
 * 
 * import { debug, error } from '@/lib/logger';
 * 
 * debug('This only shows in dev'); ✅
 * error('This always shows'); ✅
 */
