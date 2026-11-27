import { describe, expect, it } from "vitest";
import {
  calculateAdjustedWeight210,
  calculateMaternalEfficiencyPercent,
} from "./weaning";

describe("weaning calculations", () => {
  it("calculates a linear adjusted weight for 210 days", () => {
    expect(calculateAdjustedWeight210(34, 100, 180)).toBe(111);
  });

  it("calculates maternal efficiency as a percentage", () => {
    expect(calculateMaternalEfficiencyPercent(111, 500)).toBe(22.2);
  });

  it("rejects invalid ages and weights", () => {
    expect(() => calculateAdjustedWeight210(34, 100, 0)).toThrow();
    expect(() => calculateMaternalEfficiencyPercent(111, 0)).toThrow();
  });
});
