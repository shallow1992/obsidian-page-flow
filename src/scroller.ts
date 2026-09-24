import { MarkdownView } from "obsidian";

/**
 * Pure calculation helper: checks whether the container scroll is at the bottom.
 */
export function checkIsAtBottom(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  threshold = 10
): boolean {
  if (scrollHeight <= clientHeight) {
    return true;
  }
  return scrollTop + clientHeight >= scrollHeight - threshold;
}

/**
 * Pure calculation helper: checks whether the container scroll is at the top.
 */
export function checkIsAtTop(scrollTop: number, threshold = 10): boolean {
  return scrollTop <= threshold;
}

/**
 * Pure calculation helper: calculates scroll delta in pixels based on viewport height and percentage.
 */
export function calculateScrollDelta(clientHeight: number, percentage: number): number {
  const clampedPercentage = Math.max(10, Math.min(100, percentage));
  return Math.round(clientHeight * (clampedPercentage / 100));
}

/**
 * Helper to log debug messages with [PageFlow] prefix if debug mode is active.
 */
export function logDebug(enabled: boolean, message: string, data?: any): void {
  if (!enabled) return;
  if (data !== undefined) {
    console.log(`[PageFlow] ${message}`, data);
  } else {
    console.log(`[PageFlow] ${message}`);
  }
}

/**
 * Retrieves the scrollable HTMLElement for the given active MarkdownView.
 * Supports both Reading View (.markdown-preview-view) and Live Preview/Source (.cm-scroller).
 */
export function getScrollContainer(view: MarkdownView): HTMLElement | null {
  if (!view || !view.contentEl) {
    return null;
  }

  const mode = view.getMode ? view.getMode() : "source";

  if (mode === "preview") {
    const previewEl = view.contentEl.querySelector<HTMLElement>(".markdown-preview-view");
    if (previewEl) {
      return previewEl;
    }
  }

  // Live preview or default fallback
  const scrollerEl = view.contentEl.querySelector<HTMLElement>(".cm-scroller");
  if (scrollerEl) {
    return scrollerEl;
  }

  return view.contentEl.querySelector<HTMLElement>(".markdown-preview-view") || null;
}

/**
 * Scrolls the container downward by the configured percentage using native smooth scrolling.
 * Emits diagnostics to trace CodeMirror 6 virtual layout shifts and scrollbar movements.
 */
export function scrollDown(
  container: HTMLElement,
  percentage: number,
  smooth: boolean,
  threshold = 10,
  debug = false
): boolean {
  const beforeScrollTop = container.scrollTop;
  const clientHeight = container.clientHeight;
  const beforeScrollHeight = container.scrollHeight;

  if (checkIsAtBottom(beforeScrollTop, clientHeight, beforeScrollHeight, threshold)) {
    logDebug(debug, "scrollDown: Already at bottom -> triggering next file", {
      scrollTop: beforeScrollTop,
      clientHeight,
      scrollHeight: beforeScrollHeight,
      threshold,
    });
    return false;
  }

  const delta = calculateScrollDelta(clientHeight, percentage);

  logDebug(debug, "scrollDown: Executing scroll", {
    beforeScrollTop,
    clientHeight,
    beforeScrollHeight,
    delta,
    behavior: smooth ? "smooth" : "auto",
  });

  container.scrollBy({
    top: delta,
    behavior: smooth ? "smooth" : "auto",
  });

  // Track CodeMirror layout shift after smooth animation completes
  if (debug && smooth) {
    window.setTimeout(() => {
      const afterScrollTop = container.scrollTop;
      const afterScrollHeight = container.scrollHeight;
      const heightShift = afterScrollHeight - beforeScrollHeight;

      logDebug(debug, "scrollDown: Completed", {
        afterScrollTop,
        afterScrollHeight,
        heightShift: `${heightShift > 0 ? "+" : ""}${heightShift}px`,
      });

      if (heightShift !== 0) {
        logDebug(
          debug,
          `⚠️ CodeMirror height shifted by ${heightShift > 0 ? "+" : ""}${heightShift}px during scroll. This height correction causes the scrollbar thumb to adjust dynamically.`
        );
      }
    }, 450);
  }

  return true;
}

/**
 * Scrolls the container upward by the configured percentage using native smooth scrolling.
 */
export function scrollUp(
  container: HTMLElement,
  percentage: number,
  smooth: boolean,
  threshold = 10,
  debug = false
): boolean {
  const beforeScrollTop = container.scrollTop;
  const clientHeight = container.clientHeight;
  const beforeScrollHeight = container.scrollHeight;

  if (checkIsAtTop(beforeScrollTop, threshold)) {
    logDebug(debug, "scrollUp: Already at top -> triggering previous file", {
      scrollTop: beforeScrollTop,
      threshold,
    });
    return false;
  }

  const delta = calculateScrollDelta(clientHeight, percentage);

  logDebug(debug, "scrollUp: Executing scroll", {
    beforeScrollTop,
    clientHeight,
    beforeScrollHeight,
    delta,
    behavior: smooth ? "smooth" : "auto",
  });

  container.scrollBy({
    top: -delta,
    behavior: smooth ? "smooth" : "auto",
  });

  if (debug && smooth) {
    window.setTimeout(() => {
      const afterScrollTop = container.scrollTop;
      const afterScrollHeight = container.scrollHeight;
      const heightShift = afterScrollHeight - beforeScrollHeight;

      logDebug(debug, "scrollUp: Completed", {
        afterScrollTop,
        afterScrollHeight,
        heightShift: `${heightShift > 0 ? "+" : ""}${heightShift}px`,
      });

      if (heightShift !== 0) {
        logDebug(
          debug,
          `⚠️ CodeMirror height shifted by ${heightShift > 0 ? "+" : ""}${heightShift}px during scroll. This height correction causes the scrollbar thumb to adjust dynamically.`
        );
      }
    }, 450);
  }

  return true;
}

/**
 * Immediately scrolls the container to the top.
 */
export function scrollToTop(container: HTMLElement, smooth = false): void {
  container.scrollTo({
    top: 0,
    behavior: smooth ? "smooth" : "auto",
  });
}

/**
 * Immediately scrolls the container to the bottom.
 */
export function scrollToBottom(container: HTMLElement, smooth = false): void {
  container.scrollTo({
    top: container.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  });
}
