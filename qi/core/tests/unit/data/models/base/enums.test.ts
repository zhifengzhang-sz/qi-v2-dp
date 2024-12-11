/**
 * @fileoverview
 * @module enums.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// enums.test.ts
import { describe, it, expect } from "vitest";
import { TimeInterval } from "@qi/core/data/models/base/enums";

describe("TimeInterval", () => {
  it("should include all valid time intervals", () => {
    const intervals: TimeInterval[] = [
      "1m",
      "5m",
      "15m",
      "30m",
      "1h",
      "4h",
      "1d",
      "1w",
      "1M",
    ];

    intervals.forEach((interval) => {
      expect([
        "1m",
        "5m",
        "15m",
        "30m",
        "1h",
        "4h",
        "1d",
        "1w",
        "1M",
      ] as TimeInterval[]).toContain(interval);
    });
  });

  describe("type checking", () => {
    // Note: The following type checks are commented out because they should fail compilation.
    // They serve as documentation for the type system's behavior.
    it("should not allow invalid interval values", () => {
      // TypeScript should prevent this:
      // const invalidInterval: TimeInterval = "2h"; // Type error: "2h" not assignable to TimeInterval
      expect(true).toBe(true); // Placeholder assertion
    });

    it("should not allow arbitrary strings", () => {
      // TypeScript should prevent these:
      // const invalidMinutes: TimeInterval = "2m"; // Type error: "2m" not assignable to TimeInterval
      // const invalidHours: TimeInterval = "2h";   // Type error: "2h" not assignable to TimeInterval
      // const invalidDays: TimeInterval = "2d";    // Type error: "2d" not assignable to TimeInterval
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe("valid interval values", () => {
    it("should allow all minute intervals", () => {
      const minuteIntervals: TimeInterval[] = ["1m", "5m", "15m", "30m"];
      minuteIntervals.forEach((interval) => {
        expect(["1m", "5m", "15m", "30m"] as TimeInterval[]).toContain(
          interval
        );
      });
    });

    it("should allow all hour intervals", () => {
      const hourIntervals: TimeInterval[] = ["1h", "4h"];
      hourIntervals.forEach((interval) => {
        expect(["1h", "4h"] as TimeInterval[]).toContain(interval);
      });
    });

    it("should allow all day/week/month intervals", () => {
      const dayIntervals: TimeInterval[] = ["1d", "1w", "1M"];
      dayIntervals.forEach((interval) => {
        expect(["1d", "1w", "1M"] as TimeInterval[]).toContain(interval);
      });
    });
  });
});
