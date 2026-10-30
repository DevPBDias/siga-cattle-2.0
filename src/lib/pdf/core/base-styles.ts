import { UserOptions } from "jspdf-autotable";
import { getTenantBranding } from "@/lib/branding/get-tenant-branding";

const DEFAULT_COLORS = {
  PRIMARY: [30, 59, 43] as [number, number, number],
  TEXT_DARK_BLUE: [30, 59, 43] as [number, number, number],
  SECONDARY: [80, 80, 80] as [number, number, number],
  HEADER_BG: [255, 255, 255] as [number, number, number],
  TEXT: [0, 0, 0] as [number, number, number],
  TITLE_RED: [180, 0, 0] as [number, number, number],
  LINE_GRAY: [180, 180, 180] as [number, number, number],
  STRIPE_GRAY: [248, 248, 248] as [number, number, number],
};

/**
 * Cores do relatório dinamicamente resolvidas de acordo com a fazenda ativa.
 */
export const REPORT_COLORS = new Proxy(DEFAULT_COLORS, {
  get(target, prop: keyof typeof DEFAULT_COLORS) {
    if (prop === "PRIMARY" || prop === "TEXT_DARK_BLUE") {
      try {
        return getTenantBranding().primaryRgb;
      } catch {
        return target[prop];
      }
    }
    return target[prop];
  },
});

export const DEFAULT_TABLE_STYLES: UserOptions = {
  styles: {
    font: "helvetica",
    fontSize: 8,
    cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
    textColor: [0, 0, 0],
    lineWidth: 0,
    valign: "middle",
    halign: "left",
    minCellHeight: 9.3,
  },
  headStyles: {
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    fontStyle: "bold",
    halign: "left",
    lineWidth: { top: 0, bottom: 0.1, left: 0, right: 0 },
    lineColor: [180, 180, 180],
  },
  alternateRowStyles: {
    fillColor: [248, 248, 248],
  },
  margin: { top: 25, bottom: 12, left: 10, right: 10 },
};
