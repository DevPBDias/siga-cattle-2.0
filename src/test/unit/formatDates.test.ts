import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  getTodayFormatted,
  parseToDate,
  diffInDays,
  calculateAgeInMonths,
} from "@/utils/dates";

describe("parseToDate", () => {
  it("should parse BR format (DD/MM/YYYY)", () => {
    const date = parseToDate("25/12/2024");
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(11); // December
    expect(date?.getDate()).toBe(25);
    expect(date?.getHours()).toBe(12);
  });

  it("should parse ISO format (YYYY-MM-DD)", () => {
    const date = parseToDate("2024-12-25");
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(11);
    expect(date?.getDate()).toBe(25);
  });

  it("should handle T12 addition to avoid timezone shifts", () => {
    const date = parseToDate("2024-12-25");
    expect(date?.getHours()).toBe(12);
  });

  it("should return null for invalid date strings", () => {
    expect(parseToDate("invalid")).toBeNull();
    expect(parseToDate(null)).toBeNull();
  });
});

describe("formatDate", () => {
  it("should return empty string for undefined input", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("should return original string for non-string input if possible", () => {
    expect(formatDate(null)).toBe("");
  });

  it("should return DD/MM/YYYY format unchanged", () => {
    expect(formatDate("25/12/2024")).toBe("25/12/2024");
  });

  it("should convert ISO format (YYYY-MM-DD) to DD/MM/YYYY", () => {
    expect(formatDate("2024-12-25")).toBe("25/12/2024");
  });

  it("should handle ISO datetime with T separator", () => {
    expect(formatDate("2024-12-25T10:30:00")).toBe("25/12/2024");
  });
});

describe("diffInDays", () => {
  it("should calculate difference correctly", () => {
    expect(diffInDays("01/01/2024", "10/01/2024")).toBe(9);
    expect(diffInDays("2024-01-01", "2024-01-10")).toBe(9);
  });
});

describe("calculateAgeInMonths", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate age correctly", () => {
    expect(calculateAgeInMonths("2024-01-01")).toBe(12);
    expect(calculateAgeInMonths("01/01/2024")).toBe(12);
  });
});

describe("getTodayFormatted", () => {
  it("should return today's date in DD/MM/YYYY format", () => {
    const result = getTodayFormatted();
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    expect(result).toMatch(regex);
  });
});

