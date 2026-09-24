import { describe, expect, it } from "vitest";
import {
  calculateScrollDelta,
  checkIsAtBottom,
  checkIsAtTop,
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

  describe("easeOutCubic", () => {
    it("returns 0 at progress 0 and 1 at progress 1", () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
    });

    it("has deceleration physics (progress 0.5 yields 0.875)", () => {
      expect(easeOutCubic(0.5)).toBe(0.875);
    });
  });
});
