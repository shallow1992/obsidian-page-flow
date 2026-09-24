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
 * Pure calculation helper: calculates effective duration under rapid consecutive key presses.
 * Uses exponential decay (0.65^chainCount) down to minDuration (default: 150ms).
 */
export function calculateChainedDuration(
  baseDuration: number,
  chainCount: number,
  minDuration = 150
): number {
  const effectiveMin = Math.min(minDuration, baseDuration);
  if (chainCount <= 0 || baseDuration <= effectiveMin) {
    return baseDuration;
  }
  const decayFactor = Math.pow(0.65, chainCount);
  return Math.max(effectiveMin, Math.round(baseDuration * decayFactor));
}

/**
 * Pure easing function: easeInOutCubic.
 * Smooth acceleration and deceleration for minimum visual stutter.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Pure easing function: easeOutCubic.
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface ActiveScrollAnimation {
  startScrollTop: number;
  targetScrollTop: number;
  startTime: number;
  duration: number;
  frameId: number;
  chainCount: number;
}

const activeAnimations = new WeakMap<HTMLElement, ActiveScrollAnimation>();

/**
 * Natural smooth scroll with smart queuing and CodeMirror layout-shift resistance.
 * Default duration: 280ms (comfortable, readable speed matching browser physics).
 * Capped at 2.5 screens to prevent runaway scrolling on excessive key presses.
 */
export function smoothScrollBy(
  container: HTMLElement,
  delta: number,
  duration = 280
): void {
  const clientHeight = container.clientHeight;
  const maxScroll = Math.max(0, container.scrollHeight - clientHeight);
  const maxQueuedDistance = clientHeight * 2.5;

  const existing = activeAnimations.get(container);
  const currentScroll = container.scrollTop;

  // Calculate chained input acceleration
  const chainCount = existing ? existing.chainCount + 1 : 0;
  const effectiveDuration = calculateChainedDuration(duration, chainCount);

  // If already animating, chain from the existing target position
  const baseTarget = existing ? existing.targetScrollTop : currentScroll;
  let newTarget = baseTarget + delta;

  // Cap maximum queued distance ahead of current position
  if (newTarget > currentScroll + maxQueuedDistance) {
    newTarget = currentScroll + maxQueuedDistance;
  } else if (newTarget < currentScroll - maxQueuedDistance) {
    newTarget = currentScroll - maxQueuedDistance;
  }

  // Clamp within container scrollable range
  const clampedTarget = Math.max(0, Math.min(maxScroll, newTarget));

  if (existing) {
    cancelAnimationFrame(existing.frameId);
  }

  const startScrollTop = container.scrollTop;
  const distance = clampedTarget - startScrollTop;

  if (Math.abs(distance) < 1) {
    container.scrollTop = clampedTarget;
    activeAnimations.delete(container);
    return;
  }

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / effectiveDuration);
    const eased = easeInOutCubic(progress);

    container.scrollTop = startScrollTop + distance * eased;

    if (progress < 1) {
      const frameId = requestAnimationFrame(step);
      activeAnimations.set(container, {
        startScrollTop,
        targetScrollTop: clampedTarget,
        startTime,
        duration: effectiveDuration,
        frameId,
        chainCount,
      });
    } else {
      // Guarantee exact arrival at target and reset animation tracking
      container.scrollTop = clampedTarget;
      activeAnimations.delete(container);
    }
  };

  const frameId = requestAnimationFrame(step);
  activeAnimations.set(container, {
    startScrollTop,
    targetScrollTop: clampedTarget,
    startTime,
    duration: effectiveDuration,
    frameId,
    chainCount,
  });
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
 * Uses smart queuing smooth scroll with dynamic chained acceleration to resist CodeMirror 6 layout shifts.
 */
export function scrollDown(
  container: HTMLElement,
  percentage: number,
  smooth: boolean,
  threshold = 10,
  duration = 280
): boolean {
  const existing = activeAnimations.get(container);
  const currentOrTargetScrollTop = existing ? existing.targetScrollTop : container.scrollTop;
  const clientHeight = container.clientHeight;
  const scrollHeight = container.scrollHeight;

  if (checkIsAtBottom(currentOrTargetScrollTop, clientHeight, scrollHeight, threshold)) {
    return false;
  }

  const delta = calculateScrollDelta(clientHeight, percentage);

  if (smooth) {
    smoothScrollBy(container, delta, duration);
  } else {
    container.scrollTop = Math.min(
      scrollHeight - clientHeight,
      container.scrollTop + delta
    );
  }

  return true;
}

/**
 * Scrolls the container upward by the configured percentage.
 */
export function scrollUp(
  container: HTMLElement,
  percentage: number,
  smooth: boolean,
  threshold = 10,
  duration = 280
): boolean {
  const existing = activeAnimations.get(container);
  const currentOrTargetScrollTop = existing ? existing.targetScrollTop : container.scrollTop;
  const clientHeight = container.clientHeight;

  if (checkIsAtTop(currentOrTargetScrollTop, threshold)) {
    return false;
  }

  const delta = calculateScrollDelta(clientHeight, percentage);

  if (smooth) {
    smoothScrollBy(container, -delta, duration);
  } else {
    container.scrollTop = Math.max(0, container.scrollTop - delta);
  }

  return true;
}

/**
 * Immediately scrolls the container to the top.
 */
export function scrollToTop(
  container: HTMLElement,
  smooth = false,
  duration = 280
): void {
  const existing = activeAnimations.get(container);
  if (existing) {
    cancelAnimationFrame(existing.frameId);
    activeAnimations.delete(container);
  }

  if (smooth) {
    smoothScrollBy(container, -container.scrollTop, duration);
  } else {
    container.scrollTop = 0;
  }
}

/**
 * Immediately scrolls the container to the bottom.
 */
export function scrollToBottom(
  container: HTMLElement,
  smooth = false,
  duration = 280
): void {
  const existing = activeAnimations.get(container);
  if (existing) {
    cancelAnimationFrame(existing.frameId);
    activeAnimations.delete(container);
  }

  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  if (smooth) {
    smoothScrollBy(container, maxScroll - container.scrollTop, duration);
  } else {
    container.scrollTop = container.scrollHeight;
  }
}
