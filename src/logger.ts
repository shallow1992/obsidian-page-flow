/**
 * Diagnostic logger for Page Flow.
 * Can be toggled in code via `setDebugLog(boolean)` or at runtime in DevTools console via `PAGE_FLOW_DEBUG = true/false`.
 */

let isEnabled = true;

/**
 * Enable or disable debug logging programmatically in code.
 */
export function setDebugLog(enabled: boolean): void {
  isEnabled = enabled;
}

/**
 * Checks whether debug logging is currently active.
 * Checks runtime global flag `window.PAGE_FLOW_DEBUG` first if defined, then internal flag.
 */
export function isDebugLogEnabled(): boolean {
  if (typeof globalThis !== "undefined" && (globalThis as any).PAGE_FLOW_DEBUG !== undefined) {
    return Boolean((globalThis as any).PAGE_FLOW_DEBUG);
  }
  return isEnabled;
}

/**
 * Logs a message with `[Page Flow]` prefix if debug logging is enabled.
 */
export function debugLog(...args: unknown[]): void {
  if (isDebugLogEnabled()) {
    console.log("[Page Flow]", ...args);
  }
}
