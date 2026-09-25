import { afterEach, describe, expect, it, vi } from "vitest";
import { debugLog, isDebugLogEnabled, setDebugLog } from "../src/logger";

describe("Logger module", () => {
  afterEach(() => {
    setDebugLog(true);
    if (typeof globalThis !== "undefined") {
      delete (globalThis as any).PAGE_FLOW_DEBUG;
    }
    vi.restoreAllMocks();
  });

  it("logs messages when enabled", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    setDebugLog(true);
    debugLog("test message", 123);
    expect(consoleSpy).toHaveBeenCalledWith("[Page Flow]", "test message", 123);
  });

  it("suppresses messages when disabled via setDebugLog(false)", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    setDebugLog(false);
    debugLog("hidden message");
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(isDebugLogEnabled()).toBe(false);
  });

  it("respects globalThis.PAGE_FLOW_DEBUG runtime override", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Disabled in code
    setDebugLog(false);
    // Overridden to true at runtime
    (globalThis as any).PAGE_FLOW_DEBUG = true;
    expect(isDebugLogEnabled()).toBe(true);
    debugLog("runtime enabled");
    expect(consoleSpy).toHaveBeenCalledWith("[Page Flow]", "runtime enabled");

    // Overridden to false at runtime even if code has true
    setDebugLog(true);
    (globalThis as any).PAGE_FLOW_DEBUG = false;
    expect(isDebugLogEnabled()).toBe(false);
  });
});
