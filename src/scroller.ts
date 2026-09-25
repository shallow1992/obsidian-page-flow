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
 * Pure calculation helper: calculates maximum velocity for smooth scrolling.
 * Scales velocity under rapid consecutive key presses (chainCount).
 * Base velocity: Math.abs(delta) / baseDuration (px/ms).
 * Multipliers: 1.0x (1st) -> 1.55x (2nd) -> 2.1x (3rd) -> 2.65x (4th) -> 3.2x (5th+).
 */
export function calculateTargetVelocity(
  delta: number,
  baseDuration: number,
  chainCount: number
): number {
  const safeDuration = Math.max(50, baseDuration);
  const baseVelocity = Math.abs(delta) / safeDuration;
  const multiplier = 1 + Math.min(chainCount, 4) * 0.55;
  return baseVelocity * multiplier;
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
  targetScrollTop: number;
  currentVelocity: number; // px/ms
  chainCount: number;
  lastTime: number;
  frameId: number;
  delta: number;
  duration: number;
}

const activeAnimations = new WeakMap<HTMLElement, ActiveScrollAnimation>();

/**
 * Natural smooth scroll with continuous momentum physics and CodeMirror layout-shift resistance.
 * Preserves velocity across rapid key presses, accelerating up to 3.2x without halting.
 * Capped at 8 screens to allow swift chained navigation while preventing infinite runaway.
 */
export function smoothScrollBy(
  container: HTMLElement,
  delta: number,
  duration = 280
): void {
  const clientHeight = container.clientHeight;
  const maxScroll = Math.max(0, container.scrollHeight - clientHeight);
  const maxQueuedDistance = clientHeight * 8.0;

  const existing = activeAnimations.get(container);
  const currentScroll = container.scrollTop;

  // Base target: chain from existing target if animating
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

  // If already at target, finish immediately
  if (Math.abs(clampedTarget - currentScroll) < 1) {
    container.scrollTop = clampedTarget;
    if (existing) {
      cancelAnimationFrame(existing.frameId);
      activeAnimations.delete(container);
    }
    return;
  }

  // If already animating, seamlessly extend target and boost chainCount without resetting velocity!
  if (existing) {
    existing.targetScrollTop = clampedTarget;
    existing.chainCount += 1;
    existing.delta = delta;
    existing.duration = duration;
    return;
  }

  // Start new continuous velocity physics loop
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const anim: ActiveScrollAnimation = {
    targetScrollTop: clampedTarget,
    currentVelocity: 0.1, // initial gentle impulse
    chainCount: 0,
    lastTime: startTime,
    frameId: 0,
    delta,
    duration,
  };

  const step = (now: number) => {
    const currentAnim = activeAnimations.get(container);
    if (!currentAnim) return;

    const dt = Math.min(32, Math.max(1, now - currentAnim.lastTime));
    currentAnim.lastTime = now;

    const currScroll = container.scrollTop;
    const remaining = currentAnim.targetScrollTop - currScroll;
    const distance = Math.abs(remaining);

    // Reached target within 1px
    if (distance <= 1) {
      container.scrollTop = currentAnim.targetScrollTop;
      activeAnimations.delete(container);
      return;
    }

    const direction = Math.sign(remaining);
    const maxVelocity = calculateTargetVelocity(
      currentAnim.delta,
      currentAnim.duration,
      currentAnim.chainCount
    );

    // Deceleration zone: natural ease-out brake near the target
    const brakeDistance = Math.max(80, Math.abs(currentAnim.delta) * 0.7);
    let targetSpeed = maxVelocity;

    if (distance < brakeDistance) {
      const ratio = distance / brakeDistance;
      targetSpeed = Math.max(0.1, maxVelocity * Math.sqrt(ratio));
    }

    // Smooth velocity adjustment
    if (currentAnim.currentVelocity < targetSpeed) {
      const accelRate = 0.012; // px/ms^2
      currentAnim.currentVelocity = Math.min(
        targetSpeed,
        currentAnim.currentVelocity + accelRate * dt
      );
    } else {
      const decelRate = 0.018; // px/ms^2
      currentAnim.currentVelocity = Math.max(
        targetSpeed,
        currentAnim.currentVelocity - decelRate * dt
      );
    }

    const stepMove = Math.min(distance, currentAnim.currentVelocity * dt);
    container.scrollTop = currScroll + stepMove * direction;

    currentAnim.frameId = requestAnimationFrame(step);
  };

  anim.frameId = requestAnimationFrame(step);
  activeAnimations.set(container, anim);
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
