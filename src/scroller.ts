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
  // If the content is smaller than or equal to client height, it's considered at the bottom
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
 * Pure easing function: easeOutCubic.
 * Starts fast and decelerates smoothly to an instant, gentle stop.
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface ActiveScrollAnimation {
  targetScrollTop: number;
  frameId: number;
}

const activeAnimations = new WeakMap<HTMLElement, ActiveScrollAnimation>();

/**
 * Custom smooth scroll using requestAnimationFrame and easeOutCubic.
 * Resolves rapidly (~130ms) to avoid CodeMirror 6 height-measurement jitter.
 * Queues up target positions if triggered multiple times consecutively.
 */
export function smoothScrollTo(
  container: HTMLElement,
  delta: number,
  duration = 130
): void {
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  const existing = activeAnimations.get(container);

  // If already animating, smoothly chain from the existing target position
  const basePosition = existing ? existing.targetScrollTop : container.scrollTop;
  const targetScrollTop = Math.max(0, Math.min(maxScroll, basePosition + delta));

  if (existing) {
    cancelAnimationFrame(existing.frameId);
  }

  const startPosition = container.scrollTop;
  const distance = targetScrollTop - startPosition;

  if (Math.abs(distance) < 1) {
    container.scrollTop = targetScrollTop;
    activeAnimations.delete(container);
    return;
  }

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);

    container.scrollTop = startPosition + distance * eased;

    if (progress < 1) {
      const frameId = requestAnimationFrame(step);
      activeAnimations.set(container, { targetScrollTop, frameId });
    } else {
      container.scrollTop = targetScrollTop;
      activeAnimations.delete(container);
    }
  };

  const frameId = requestAnimationFrame(step);
  activeAnimations.set(container, { targetScrollTop, frameId });
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
 * Scrolls the container downward by the configured percentage.
 * Returns true if scrolled, or false if already at the bottom.
 */
export function scrollDown(
  container: HTMLElement,
  percentage: number,
  smooth: boolean,
  threshold = 10
): boolean {
  const existing = activeAnimations.get(container);
  const currentOrTargetScrollTop = existing ? existing.targetScrollTop : container.scrollTop;

  if (checkIsAtBottom(currentOrTargetScrollTop, container.clientHeight, container.scrollHeight, threshold)) {
    return false;
  }

  const delta = calculateScrollDelta(container.clientHeight, percentage);

  if (smooth) {
    smoothScrollTo(container, delta);
  } else {
    container.scrollTop = Math.min(
      container.scrollHeight - container.clientHeight,
      container.scrollTop + delta
    );
  }

  return true;
}

/**
 * Scrolls the container upward by the configured percentage.
 * Returns true if scrolled, or false if already at the top.
 */
export function scrollUp(
  container: HTMLElement,
  percentage: number,
  smooth: boolean,
  threshold = 10
): boolean {
  const existing = activeAnimations.get(container);
  const currentOrTargetScrollTop = existing ? existing.targetScrollTop : container.scrollTop;

  if (checkIsAtTop(currentOrTargetScrollTop, threshold)) {
    return false;
  }

  const delta = calculateScrollDelta(container.clientHeight, percentage);

  if (smooth) {
    smoothScrollTo(container, -delta);
  } else {
    container.scrollTop = Math.max(0, container.scrollTop - delta);
  }

  return true;
}

/**
 * Immediately scrolls the container to the top.
 */
export function scrollToTop(container: HTMLElement, smooth = false): void {
  const existing = activeAnimations.get(container);
  if (existing) {
    cancelAnimationFrame(existing.frameId);
    activeAnimations.delete(container);
  }

  if (smooth) {
    smoothScrollTo(container, -container.scrollTop);
  } else {
    container.scrollTop = 0;
  }
}

/**
 * Immediately scrolls the container to the bottom.
 */
export function scrollToBottom(container: HTMLElement, smooth = false): void {
  const existing = activeAnimations.get(container);
  if (existing) {
    cancelAnimationFrame(existing.frameId);
    activeAnimations.delete(container);
  }

  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  if (smooth) {
    smoothScrollTo(container, maxScroll - container.scrollTop);
  } else {
    container.scrollTop = container.scrollHeight;
  }
}
