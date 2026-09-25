/**
 * Diagnostic logger for Page Flow.
 * Disabled by default in production. Can be enabled via DevTools console with `window.PAGE_FLOW_DEBUG = true`.
 */

let isEnabled = false;

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
  if (typeof window !== "undefined") {
    const win = window as unknown as { PAGE_FLOW_DEBUG?: boolean };
    if (win.PAGE_FLOW_DEBUG !== undefined) {
      return Boolean(win.PAGE_FLOW_DEBUG);
    }
  }
  return isEnabled;
}

/**
 * Logs a debug message with `[Page Flow]` prefix only if debug logging is enabled.
 */
export function debugLog(...args: unknown[]): void {
  if (isDebugLogEnabled()) {
    console.debug("[Page Flow]", ...args);
  }
}
