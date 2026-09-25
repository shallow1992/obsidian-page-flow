import { describe, expect, it } from "vitest";
import {
  calculateChainedDuration,
  calculateScrollDelta,
  calculateTargetVelocity,
  calculateVelocityMultiplier,
  checkIsAtBottom,
  checkIsAtTop,
  easeInOutCubic,
  easeOutCubic,
} from "../src/scroller";

describe("Scroller calculation logic", () => {
  describe("checkIsAtBottom", () => {
    it("returns true when content fits inside container (scrollHeight <= clientHeight)", () => {
      expect(checkIsAtBottom(0, 800, 600, 10)).toBe(true);
      expect(checkIsAtBottom(0, 800, 800, 10)).toBe(true);
    });

    it("returns false when user is in the middle of long content", () => {
      // scrollTop: 100, clientHeight: 800, scrollHeight: 2000 -> 900 < 1990 -> false
      expect(checkIsAtBottom(100, 800, 2000, 10)).toBe(false);
    });

    it("returns true when user is within the threshold from the bottom", () => {
      // scrollTop: 1195, clientHeight: 800, scrollHeight: 2000 -> 1995 >= 1990 -> true
      expect(checkIsAtBottom(1195, 800, 2000, 10)).toBe(true);
      // exactly at the bottom
      expect(checkIsAtBottom(1200, 800, 2000, 10)).toBe(true);
    });
  });

  describe("checkIsAtTop", () => {
    it("returns true when scrollTop is 0", () => {
      expect(checkIsAtTop(0, 10)).toBe(true);
    });

    it("returns true when within threshold", () => {
      expect(checkIsAtTop(5, 10)).toBe(true);
      expect(checkIsAtTop(10, 10)).toBe(true);
    });

    it("returns false when further down than threshold", () => {
      expect(checkIsAtTop(15, 10)).toBe(false);
      expect(checkIsAtTop(500, 10)).toBe(false);
    });
  });

  describe("calculateScrollDelta", () => {
    it("calculates correct delta based on clientHeight and percentage", () => {
      expect(calculateScrollDelta(1000, 85)).toBe(850);
      expect(calculateScrollDelta(800, 50)).toBe(400);
      expect(calculateScrollDelta(1000, 100)).toBe(1000);
    });

    it("clamps percentages between 10% and 100%", () => {
      expect(calculateScrollDelta(1000, 5)).toBe(100);
      expect(calculateScrollDelta(1000, 150)).toBe(1000);
    });
  });

  describe("calculateTargetVelocity", () => {
    it("calculates base velocity correctly for single input (chainCount 0)", () => {
      // 600px / 600ms = 1.0 px/ms
      expect(calculateTargetVelocity(600, 600, 0)).toBeCloseTo(1.0);
      // 560px / 280ms = 2.0 px/ms
      expect(calculateTargetVelocity(560, 280, 0)).toBeCloseTo(2.0);
    });

    it("accelerates velocity linearly per consecutive chain hit", () => {
      const base = calculateTargetVelocity(600, 600, 0); // 1.0
      // chain 1 -> 1.55x
      expect(calculateTargetVelocity(600, 600, 1)).toBeCloseTo(base * 1.55);
      // chain 2 -> 2.10x
      expect(calculateTargetVelocity(600, 600, 2)).toBeCloseTo(base * 2.10);
      // chain 3 -> 2.65x
      expect(calculateTargetVelocity(600, 600, 3)).toBeCloseTo(base * 2.65);
    });

    it("caps maximum velocity acceleration at chain 4 (3.2x)", () => {
      const base = calculateTargetVelocity(600, 600, 0);
      expect(calculateTargetVelocity(600, 600, 4)).toBeCloseTo(base * 3.20);
      expect(calculateTargetVelocity(600, 600, 10)).toBeCloseTo(base * 3.20);
    });
  });

  describe("calculateVelocityMultiplier", () => {
    it("returns 1.0 for chainCount 0", () => {
      expect(calculateVelocityMultiplier(0)).toBeCloseTo(1.0);
    });

    it("scales linearly by 0.55 per chain up to chain 4", () => {
      expect(calculateVelocityMultiplier(1)).toBeCloseTo(1.55);
      expect(calculateVelocityMultiplier(2)).toBeCloseTo(2.10);
      expect(calculateVelocityMultiplier(3)).toBeCloseTo(2.65);
      expect(calculateVelocityMultiplier(4)).toBeCloseTo(3.20);
    });

    it("caps at 3.20 for chainCount > 4", () => {
      expect(calculateVelocityMultiplier(5)).toBeCloseTo(3.20);
      expect(calculateVelocityMultiplier(10)).toBeCloseTo(3.20);
    });
  });

  describe("calculateChainedDuration", () => {
    it("returns baseDuration for single input (chainCount 0)", () => {
      expect(calculateChainedDuration(600, 0)).toBe(600);
      expect(calculateChainedDuration(280, 0)).toBe(280);
    });

    it("accelerates by exponential decay on rapid key presses", () => {
      // 600 * 0.65 = 390
      expect(calculateChainedDuration(600, 1)).toBe(390);
      // 600 * 0.65^2 = 253.5 -> 254
      expect(calculateChainedDuration(600, 2)).toBe(254);
      // 600 * 0.65^3 = 164.775 -> 165
      expect(calculateChainedDuration(600, 3)).toBe(165);
    });

    it("clamps to minDuration (150ms cap) on further chaining", () => {
      // 600 * 0.65^4 = 107.1 -> capped at 150
      expect(calculateChainedDuration(600, 4)).toBe(150);
      expect(calculateChainedDuration(600, 10)).toBe(150);
    });

    it("respects custom baseDuration smaller than default minDuration", () => {
      expect(calculateChainedDuration(100, 0)).toBe(100);
      expect(calculateChainedDuration(100, 2)).toBe(100);
    });
  });

  describe("Easing functions", () => {
    describe("easeInOutCubic", () => {
      it("returns 0 at progress 0 and 1 at progress 1", () => {
        expect(easeInOutCubic(0)).toBe(0);
        expect(easeInOutCubic(1)).toBe(1);
      });

      it("is symmetric at the midpoint (progress 0.5 yields 0.5)", () => {
        expect(easeInOutCubic(0.5)).toBe(0.5);
      });

      it("accelerates smoothly in the first half (progress 0.25 yields 0.0625)", () => {
        expect(easeInOutCubic(0.25)).toBe(0.0625);
      });

      it("decelerates smoothly in the second half (progress 0.75 yields 0.9375)", () => {
        expect(easeInOutCubic(0.75)).toBe(0.9375);
      });
    });

    describe("easeOutCubic", () => {
      it("returns 0 at progress 0 and 1 at progress 1", () => {
        expect(easeOutCubic(0)).toBe(0);
        expect(easeOutCubic(1)).toBe(1);
      });

      it("has rapid deceleration physics (progress 0.5 yields 0.875)", () => {
        expect(easeOutCubic(0.5)).toBe(0.875);
      });
    });
  });
});
