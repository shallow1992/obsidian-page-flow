import { afterEach, describe, expect, it, vi } from "vitest";
import { debugLog, isDebugLogEnabled, setDebugLog } from "../src/logger";

describe("Logger module", () => {
  afterEach(() => {
    setDebugLog(false);
    if (typeof window !== "undefined") {
      delete (window as unknown as { PAGE_FLOW_DEBUG?: boolean }).PAGE_FLOW_DEBUG;
    }
    vi.restoreAllMocks();
  });

  it("is disabled by default in production", () => {
    expect(isDebugLogEnabled()).toBe(false);
  });

  it("logs messages when enabled", () => {
    const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    setDebugLog(true);
    debugLog("test message", 123);
    expect(consoleSpy).toHaveBeenCalledWith("[Page Flow]", "test message", 123);
  });

  it("suppresses messages when disabled via setDebugLog(false)", () => {
    const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    setDebugLog(false);
    debugLog("hidden message");
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(isDebugLogEnabled()).toBe(false);
  });

  it("respects window.PAGE_FLOW_DEBUG runtime override", () => {
    const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    
    // Ensure window object exists in Node environment for this test
    const hadWindow = typeof (globalThis as unknown as { window?: unknown }).window !== "undefined";
    if (!hadWindow) {
      (globalThis as unknown as { window?: unknown }).window = {};
    }

    try {
      setDebugLog(false);
      (window as unknown as { PAGE_FLOW_DEBUG?: boolean }).PAGE_FLOW_DEBUG = true;
      expect(isDebugLogEnabled()).toBe(true);
      debugLog("runtime enabled");
      expect(consoleSpy).toHaveBeenCalledWith("[Page Flow]", "runtime enabled");

      // Overridden to false at runtime even if code has true
      setDebugLog(true);
      (window as unknown as { PAGE_FLOW_DEBUG?: boolean }).PAGE_FLOW_DEBUG = false;
      expect(isDebugLogEnabled()).toBe(false);
    } finally {
      if (!hadWindow) {
        delete (globalThis as unknown as { window?: unknown }).window;
      }
    }
  });
});
