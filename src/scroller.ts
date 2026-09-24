import { MarkdownView } from "obsidian";
import { EasingStyle } from "./types";

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
 * Pure easing function: easeOutCubic.
 * Rapid start with deceleration.
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Pure easing function: easeOutQuad.
 * Gentle deceleration with moderate initial velocity.
 */
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Pure easing function: easeInOutCubic.
 * Smooth acceleration and deceleration for minimum visual stutter.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Pure easing function: linear.
 * Constant velocity across the animation.
 */
export function linear(t: number): number {
  return t;
}

/**
 * Returns the corresponding easing function for the specified style.
 */
export function getEasingFunction(style: EasingStyle): (t: number) => number {
  switch (style) {
    case "ease-in-out":
      return easeInOutCubic;
    case "ease-out-gentle":
      return easeOutQuad;
    case "linear":
      return linear;
    case "ease-out":
    default:
      return easeOutCubic;
  }
}

interface ActiveScrollAnimation {
  startScrollTop: number;
  targetScrollTop: number;
  startTime: number;
  duration: number;
  frameId: number;
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
  duration = 280,
  easingStyle: EasingStyle = "ease-in-out"
): void {
  const clientHeight = container.clientHeight;
  const maxScroll = Math.max(0, container.scrollHeight - clientHeight);
  const maxQueuedDistance = clientHeight * 2.5;

  const existing = activeAnimations.get(container);
  const currentScroll = container.scrollTop;

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
  const easingFn = getEasingFunction(easingStyle);

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easingFn(progress);

    container.scrollTop = startScrollTop + distance * eased;

    if (progress < 1) {
      const frameId = requestAnimationFrame(step);
      activeAnimations.set(container, {
        startScrollTop,
        targetScrollTop: clampedTarget,
        startTime,
        duration,
        frameId,
      });
    } else {
      // Guarantee exact arrival at target
      container.scrollTop = clampedTarget;
      activeAnimations.delete(container);
    }
  };

  const frameId = requestAnimationFrame(step);
  activeAnimations.set(container, {
    startScrollTop,
    targetScrollTop: clampedTarget,
    startTime,
    duration,
    frameId,
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
 * Uses smart queuing smooth scroll to resist CodeMirror 6 layout shifts and ensure exact progress.
 */
export function scrollDown(
  container: HTMLElement,
  percentage: number,
  smooth: boolean,
  threshold = 10,
  duration = 280,
  easingStyle: EasingStyle = "ease-in-out"
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
    smoothScrollBy(container, delta, duration, easingStyle);
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
  duration = 280,
  easingStyle: EasingStyle = "ease-in-out"
): boolean {
  const existing = activeAnimations.get(container);
  const currentOrTargetScrollTop = existing ? existing.targetScrollTop : container.scrollTop;
  const clientHeight = container.clientHeight;

  if (checkIsAtTop(currentOrTargetScrollTop, threshold)) {
    return false;
  }

  const delta = calculateScrollDelta(clientHeight, percentage);

  if (smooth) {
    smoothScrollBy(container, -delta, duration, easingStyle);
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
  duration = 280,
  easingStyle: EasingStyle = "ease-in-out"
): void {
  const existing = activeAnimations.get(container);
  if (existing) {
    cancelAnimationFrame(existing.frameId);
    activeAnimations.delete(container);
  }

  if (smooth) {
    smoothScrollBy(container, -container.scrollTop, duration, easingStyle);
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
  duration = 280,
  easingStyle: EasingStyle = "ease-in-out"
): void {
  const existing = activeAnimations.get(container);
  if (existing) {
    cancelAnimationFrame(existing.frameId);
    activeAnimations.delete(container);
  }

  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  if (smooth) {
    smoothScrollBy(container, maxScroll - container.scrollTop, duration, easingStyle);
  } else {
    container.scrollTop = container.scrollHeight;
  }
}
