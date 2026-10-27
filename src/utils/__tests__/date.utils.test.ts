import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DateOnly,
  formatDate,
  formatDateTime,
  formatAuditTimestamp,
  getTodayFormatted,
  getTodayISO,
  parseToDate,
  toDateOnlyString,
  diffInDays,
  calculateAgeInMonths,
  getAgeRange,
  formatAge,
  getYearFromDate,
  isDateInYear,
  filterByYear,
} from "../dates";

describe("DateOnly", () => {
  it("deve criar DateOnly a partir de partes válidas", () => {
    const d = DateOnly.fromParts(2024, 5, 10);
    expect(d.year).toBe(2024);
    expect(d.month).toBe(5);
    expect(d.day).toBe(10);
    expect(d.toISO()).toBe("2024-05-10");
    expect(d.toBR()).toBe("10/05/2024");
  });

  it("deve lançar erro para partes inválidas", () => {
    expect(() => DateOnly.fromParts(2024, 13, 10)).toThrow();
    expect(() => DateOnly.fromParts(2024, 5, 32)).toThrow();
  });

  it("deve criar DateOnly a partir de ISO YYYY-MM-DD", () => {
    const d = DateOnly.fromISO("2024-12-25");
    expect(d.year).toBe(2024);
    expect(d.month).toBe(12);
    expect(d.day).toBe(25);
  });

  it("deve criar DateOnly a partir de formato brasileiro DD/MM/YYYY", () => {
    const d = DateOnly.fromBR("25/12/2024");
    expect(d.year).toBe(2024);
    expect(d.month).toBe(12);
    expect(d.day).toBe(25);
  });

  it("deve somar dias sem sofrer com horário de verão histórico ou virada de mês", () => {
    const d = DateOnly.fromParts(2024, 1, 31);
    const nextDay = d.addDays(1);
    expect(nextDay.toISO()).toBe("2024-02-01");

    const add10 = d.addDays(10);
    expect(add10.toISO()).toBe("2024-02-10");
  });

  it("deve comparar datas corretamente (equals, isBefore, isAfter)", () => {
    const d1 = DateOnly.fromParts(2024, 5, 10);
    const d2 = DateOnly.fromParts(2024, 5, 10);
    const d3 = DateOnly.fromParts(2024, 5, 11);

    expect(d1.equals(d2)).toBe(true);
    expect(d1.isBefore(d3)).toBe(true);
    expect(d3.isAfter(d1)).toBe(true);
  });
});

describe("parseToDate e toDateOnlyString", () => {
  it("deve converter para Date com segurança de meio-dia local", () => {
    const date = parseToDate("2024-05-10");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(4); // Maio
    expect(date?.getDate()).toBe(10);
    expect(date?.getHours()).toBe(12);
  });

  it("deve normalizar DD/MM/YYYY para YYYY-MM-DD", () => {
    expect(toDateOnlyString("10/05/2024")).toBe("2024-05-10");
  });

  it("deve manter YYYY-MM-DD inalterado", () => {
    expect(toDateOnlyString("2024-05-10")).toBe("2024-05-10");
  });

  it("deve retornar string vazia para valores nulos/indefinidos", () => {
    expect(toDateOnlyString(null)).toBe("");
    expect(toDateOnlyString(undefined)).toBe("");
  });
});

describe("formatDate e virada de dia / fuso horário", () => {
  it("deve retornar formato DD/MM/YYYY inalterado", () => {
    expect(formatDate("25/12/2024")).toBe("25/12/2024");
  });

  it("deve converter YYYY-MM-DD para DD/MM/YYYY sem deslocar o dia", () => {
    expect(formatDate("2024-05-10")).toBe("10/05/2024");
  });

  it("não deve deslocar o dia em strings ISO com meia-noite UTC (00:00:00Z)", () => {
    // Caso clássico de bug: '2024-05-10T00:00:00Z' virava dia 09 no fuso de Brasília UTC-3
    expect(formatDate("2024-05-10T00:00:00.000Z")).toBe("10/05/2024");
    expect(formatDate("2024-05-10T02:59:59.000Z")).toBe("10/05/2024");
    expect(formatDate("2024-05-10T23:59:59.000Z")).toBe("10/05/2024");
  });

  it("deve retornar fallback se data for inválida ou vazia", () => {
    expect(formatDate(undefined)).toBe("");
    expect(formatDate(null, "---")).toBe("---");
    expect(formatDate("invalid-date", "---")).toBe("---");
  });
});

describe("formatDateTime e timestamps de auditoria (America/Sao_Paulo)", () => {
  it("deve converter explicitamente timestamps UTC para o fuso de São Paulo (UTC-3)", () => {
    // 15:30 UTC -> 12:30 em Brasília (UTC-3)
    const formatted = formatDateTime("2024-05-10T15:30:00.000Z");
    expect(formatted).toBe("10/05/2024 12:30");
  });

  it("deve converter corretamente timestamp que cruza a meia-noite em UTC", () => {
    // 01:15 UTC do dia 15 -> 22:15 do dia 14 em Brasília (UTC-3)
    const formatted = formatDateTime("2024-01-15T01:15:00.000Z");
    expect(formatted).toBe("14/01/2024 22:15");
  });

  it("formatAuditTimestamp deve funcionar como atalho semântico", () => {
    const formatted = formatAuditTimestamp("2024-05-10T15:30:00.000Z");
    expect(formatted).toBe("10/05/2024 12:30");
  });
});

describe("Horário de verão histórico no Brasil", () => {
  it("deve manipular datas no período de horário de verão histórico sem falha (ex: nov/2018)", () => {
    // O Brasil teve horário de verão em 04/11/2018 (meia-noite adiantada para 01:00)
    const dstDate = "2018-11-04";
    expect(formatDate(dstDate)).toBe("04/11/2018");

    const d = DateOnly.fromISO(dstDate);
    const next = d.addDays(1);
    expect(next.toISO()).toBe("2018-11-05");
    expect(next.toBR()).toBe("05/11/2018");

    expect(diffInDays("2018-11-03", "2018-11-05")).toBe(2);
  });
});

describe("Filtros por ano e utilitários de relatório", () => {
  it("getYearFromDate deve extrair ano correto de diferentes formatos sem deslocamento", () => {
    expect(getYearFromDate("2024-01-01T00:00:00Z")).toBe(2024);
    expect(getYearFromDate("2024-12-31")).toBe(2024);
    expect(getYearFromDate("31/12/2024")).toBe(2024);
    expect(getYearFromDate(null)).toBeNull();
  });

  it("isDateInYear deve verificar pertinência ao ano corretamente", () => {
    expect(isDateInYear("2024-01-01", 2024)).toBe(true);
    expect(isDateInYear("2024-12-31", "2024")).toBe(true);
    expect(isDateInYear("2024-12-31", 2023)).toBe(false);
  });

  it("filterByYear deve filtrar coleção por ano da data", () => {
    const items = [
      { id: 1, event_date: "2023-11-10" },
      { id: 2, event_date: "2024-01-05" },
      { id: 3, event_date: "2024-08-20" },
      { id: 4, event_date: "2025-02-15" },
    ];

    const result2024 = filterByYear(items, (item) => item.event_date, 2024);
    expect(result2024.map((i) => i.id)).toEqual([2, 3]);

    const resultAll = filterByYear(items, (item) => item.event_date, "all");
    expect(resultAll.length).toBe(4);
  });
});

describe("Cálculos de idade e diferenças", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("diffInDays deve calcular diferença correta", () => {
    expect(diffInDays("01/01/2024", "10/01/2024")).toBe(9);
    expect(diffInDays("2024-01-01", "2024-01-10")).toBe(9);
  });

  it("calculateAgeInMonths deve calcular idade em meses corretamente", () => {
    expect(calculateAgeInMonths("2024-01-01")).toBe(12);
    expect(calculateAgeInMonths("01/01/2024")).toBe(12);
    expect(calculateAgeInMonths("2023-01-01")).toBe(24);
  });

  it("getAgeRange deve classificar nas faixas corretas", () => {
    expect(getAgeRange(6)).toBe("0 - 12 m");
    expect(getAgeRange(12)).toBe("0 - 12 m");
    expect(getAgeRange(18)).toBe("13 - 24 m");
    expect(getAgeRange(24)).toBe("13 - 24 m");
    expect(getAgeRange(30)).toBe("25 - 36 m");
    expect(getAgeRange(36)).toBe("25 - 36 m");
    expect(getAgeRange(42)).toBe("+36 m");
  });

  it("formatAge deve formatar texto em anos e meses", () => {
    expect(formatAge("2023-01-01")).toBe("2 anos e 0 meses");
    expect(formatAge("2024-01-01")).toBe("1 ano e 0 meses");
    expect(formatAge(null)).toBe("Não informada");
  });

  it("getTodayFormatted e getTodayISO devem retornar a data corrente", () => {
    expect(getTodayFormatted()).toBe("01/01/2025");
    expect(getTodayISO()).toBe("2025-01-01");
  });
});
