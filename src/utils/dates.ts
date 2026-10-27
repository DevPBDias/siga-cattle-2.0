/**
 * Utilitário Unificado de Datas e Fuso Horário — INDI Ouro 2.0
 * Arquivo: src/utils/dates.ts
 *
 * Centraliza parsing, formatação, cálculos e manipulação de datas do sistema.
 * 
 * Vantagens contra problemas de fuso horário (Supabase vs Horário de Brasília UTC-3):
 * 1. Trata datas de calendário (born_date, date de pesagens, eventos etc.) como DateOnly (YYYY-MM-DD),
 *    sem instanciar `new Date("YYYY-MM-DD")` que converteria para UTC 00:00 e recuaria para o dia anterior no Brasil (UTC-3).
 * 2. Gera a data de hoje via `todayISO()` no fuso local do dispositivo, evitando que após as 21h vire o dia de amanhã.
 * 3. Formata timestamps de auditoria (created_at, updated_at) explicitamente no fuso "America/Sao_Paulo".
 * 4. Aceita de forma resiliente tanto ISO (YYYY-MM-DD) quanto formato brasileiro (DD/MM/YYYY) e números seriais de planilhas Excel.
 */

export const SAO_PAULO_TIMEZONE = "America/Sao_Paulo";

export type AgeRange = "0 - 12 m" | "13 - 24 m" | "25 - 36 m" | "+36 m";

export interface DateParts {
  year: number;
  month: number;
  day: number;
  /** AAAAMMDD, ideal para ordenação lexicográfica segura */
  sortKey: string;
}

export interface FormatAgeOptions {
  short?: boolean;
  referenceDate?: string | Date | DateOnly;
}

const pad = (n: number): string => String(n).padStart(2, "0");

export const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
] as const;

export const MONTHS_SHORT = [
  { value: "1", label: "Jan" },
  { value: "2", label: "Fev" },
  { value: "3", label: "Mar" },
  { value: "4", label: "Abr" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Jul" },
  { value: "8", label: "Ago" },
  { value: "9", label: "Set" },
  { value: "10", label: "Out" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dez" },
] as const;

/**
 * Representa uma data de calendário pura (ano, mês 1-12, dia 1-31)
 * sem interferência de fuso horário, UTC ou horário de verão.
 */
export class DateOnly {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31

  private constructor(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  /* =========================
   * FACTORIES
   * ========================= */

  /** Cria a partir de ano, mês (1-12) e dia (1-31) */
  static fromParts(year: number, month: number, day: number): DateOnly {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      throw new Error(`Data inválida: partes devem ser inteiras (${year}, ${month}, ${day})`);
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Data fora do intervalo válido: ${year}-${month}-${day}`);
    }
    return new DateOnly(year, month, day);
  }

  /** Cria a partir de string ISO YYYY-MM-DD (ou YYYY-MM-DDTHH:mm:ss...) */
  static fromISO(dateStr: string): DateOnly {
    if (!dateStr || typeof dateStr !== "string") {
      throw new Error(`Invalid DateOnly ISO format: ${dateStr}`);
    }

    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) {
      throw new Error(`Invalid DateOnly ISO format: ${dateStr}`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return DateOnly.fromParts(year, month, day);
  }

  /** Cria a partir de string brasileira DD/MM/YYYY */
  static fromBR(dateStr: string): DateOnly {
    if (!dateStr || typeof dateStr !== "string") {
      throw new Error(`Invalid DateOnly BR format: ${dateStr}`);
    }

    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) {
      throw new Error(`Invalid DateOnly BR format: ${dateStr}`);
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    return DateOnly.fromParts(year, month, day);
  }

  /** Cria a partir de objeto Date usando os componentes locais da data */
  static fromDate(date: Date): DateOnly {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error("Invalid Date instance provided to DateOnly.fromDate");
    }

    return new DateOnly(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );
  }

  /** Cria a partir da data atual no fuso local */
  static today(): DateOnly {
    return DateOnly.fromDate(new Date());
  }

  /**
   * Parser tolerante que aceita DateOnly, Date, YYYY-MM-DD, DD/MM/YYYY ou timestamp ISO.
   * Retorna null se não conseguir interpretar.
   */
  static parse(value: string | number | Date | DateOnly | null | undefined): DateOnly | null {
    if (value === null || value === undefined || value === "") return null;

    if (value instanceof DateOnly) {
      return value;
    }

    if (typeof value === "number") {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return DateOnly.fromDate(d);
    }

    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      return DateOnly.fromDate(value);
    }

    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
      try {
        return DateOnly.fromBR(trimmed);
      } catch {
        return null;
      }
    }

    // YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      try {
        return DateOnly.fromISO(trimmed);
      } catch {
        return null;
      }
    }

    // DD-MM-YYYY
    const brDash = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (brDash) {
      try {
        return DateOnly.fromParts(Number(brDash[3]), Number(brDash[2]), Number(brDash[1]));
      } catch {
        return null;
      }
    }

    // Fallback: tentar Date nativo
    const fallbackDate = new Date(trimmed);
    if (!isNaN(fallbackDate.getTime())) {
      return DateOnly.fromDate(fallbackDate);
    }

    return null;
  }

  /* =========================
   * OPERATIONS
   * ========================= */

  /** Retorna nova data somando/subtraindo dias (usa meio-dia para imunidade a DST) */
  addDays(days: number): DateOnly {
    const safeDate = new Date(this.year, this.month - 1, this.day, 12, 0, 0);
    safeDate.setDate(safeDate.getDate() + days);
    return DateOnly.fromDate(safeDate);
  }

  /** Retorna nova data somando meses */
  addMonths(months: number): DateOnly {
    const safeDate = new Date(this.year, this.month - 1, this.day, 12, 0, 0);
    safeDate.setMonth(safeDate.getMonth() + months);
    return DateOnly.fromDate(safeDate);
  }

  /** Retorna nova data somando anos */
  addYears(years: number): DateOnly {
    return DateOnly.fromParts(this.year + years, this.month, this.day);
  }

  /* =========================
   * SERIALIZATION
   * ========================= */

  /** YYYY-MM-DD (padrão de persistência Supabase e input date) */
  toISO(): string {
    return `${this.year}-${pad(this.month)}-${pad(this.day)}`;
  }

  /** Alias para toISO(), ideal para `<input type="date">` */
  toInputValue(): string {
    return this.toISO();
  }

  /** DD/MM/YYYY (formato brasileiro padrão de exibição) */
  toBR(): string {
    return `${pad(this.day)}/${pad(this.month)}/${this.year}`;
  }

  /** Retorna Date em horário seguro (meio-dia local) para componentes de calendário */
  toDate(): Date {
    return new Date(this.year, this.month - 1, this.day, 12, 0, 0);
  }

  /* =========================
   * COMPARISONS & DIFFS
   * ========================= */

  equals(other: DateOnly): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day
    );
  }

  isBefore(other: DateOnly): boolean {
    return this.toISO() < other.toISO();
  }

  isAfter(other: DateOnly): boolean {
    return this.toISO() > other.toISO();
  }

  diffInDays(other: DateOnly): number {
    const d1 = this.toDate().getTime();
    const d2 = other.toDate().getTime();
    return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  }

  diffInMonths(other: DateOnly): number {
    const yearsDiff = other.year - this.year;
    const monthsDiff = other.month - this.month;
    return Math.abs(yearsDiff * 12 + monthsDiff);
  }
}

/* ========================================================================== */
/* FUNÇÕES DE PARSING E CONVERSÃO                                             */
/* ========================================================================== */

/**
 * Converte qualquer formato de data para objeto Date seguro (meio-dia local)
 * evitando deslocamentos de timezone ao interagir com date-fns ou react-day-picker.
 */
export const parseToDate = (
  dateValue: string | number | Date | DateOnly | undefined | null,
): Date | null => {
  if (dateValue === null || dateValue === undefined || dateValue === "") return null;
  const parsed = DateOnly.parse(dateValue);
  return parsed ? parsed.toDate() : null;
};

/** Alias direto de parseToDate */
export const parseDate = parseToDate;

/**
 * Normaliza qualquer formato de data para string YYYY-MM-DD
 * para persistência segura no Supabase e preenchimento de inputs.
 */
export const toISODate = (
  value: string | number | Date | DateOnly | undefined | null,
): string => {
  if (value === null || value === undefined || value === "") return "";
  const parsed = DateOnly.parse(value);
  return parsed ? parsed.toISO() : "";
};

/** Alias de compatibilidade para toISODate */
export const toDateOnlyString = toISODate;

/**
 * Desmembra uma data em partes { year, month, day, sortKey }
 * sem qualquer interferência de fuso horário.
 */
export function parseDateParts(
  value: string | number | Date | DateOnly | undefined | null,
): DateParts | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = DateOnly.parse(value);
  if (!parsed) return null;

  return {
    year: parsed.year,
    month: parsed.month,
    day: parsed.day,
    sortKey: `${parsed.year}${pad(parsed.month)}${pad(parsed.day)}`,
  };
}

/**
 * Retorna a chave de ordenação textual 'AAAAMMDD' para uma data.
 */
export function getDateSortKey(
  value: string | number | Date | DateOnly | undefined | null,
): string {
  const parts = parseDateParts(value);
  return parts ? parts.sortKey : "";
}

/**
 * Converte datas de importação (planilhas Excel serializadas, DD/MM/AAAA ou ISO) para YYYY-MM-DD.
 */
export function parseImportedDate(dateValue: unknown): string | undefined {
  if (dateValue === null || dateValue === undefined) return undefined;

  // Número serial do Excel (ex: 45000)
  if (typeof dateValue === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(
      excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000
    );

    if (isNaN(jsDate.getTime())) return undefined;

    const y = jsDate.getFullYear();
    const m = jsDate.getMonth() + 1;
    const d = jsDate.getDate();
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  const dateStr = String(dateValue).trim();
  if (dateStr === "") return undefined;

  const iso = toISODate(dateStr);
  return iso || undefined;
}

/* ========================================================================== */
/* FORMATAÇÃO DE EXIBIÇÃO                                                     */
/* ========================================================================== */

/**
 * Formata qualquer data de evento ou negócio em DD/MM/YYYY.
 * Não converte para UTC e não desloca o dia.
 */
export const formatDate = (
  dateString: string | number | Date | DateOnly | undefined | null,
  fallback = "",
): string => {
  if (dateString === null || dateString === undefined || dateString === "") return fallback;

  // Se já for DD/MM/YYYY sem hora, retorna diretamente
  if (typeof dateString === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString.trim())) {
    return dateString.trim();
  }

  const parsed = DateOnly.parse(dateString);
  if (!parsed) return fallback;

  return parsed.toBR();
};

/**
 * Formata a data retornando "-" se inválida ou ausente.
 */
export const formatDateOrDash = (
  dateString: string | number | Date | DateOnly | undefined | null,
): string => {
  return formatDate(dateString, "-");
};

/**
 * Formata mês e ano no padrão "MM/AAAA" ou com nome do mês.
 */
export const formatMonthYear = (
  dateString: string | number | Date | DateOnly | undefined | null,
  options?: { monthName?: boolean; fallback?: string },
): string => {
  const fallback = options?.fallback ?? "";
  const parts = parseDateParts(dateString);
  if (!parts) return fallback;

  if (options?.monthName) {
    const monthObj = MONTHS.find((m) => Number(m.value) === parts.month);
    return monthObj ? `${monthObj.label} de ${parts.year}` : `${pad(parts.month)}/${parts.year}`;
  }

  return `${pad(parts.month)}/${parts.year}`;
};

/**
 * Formata timestamps de auditoria (created_at, updated_at, fetched_at)
 * explicitamente convertidos para o fuso America/Sao_Paulo.
 */
export const formatDateTime = (
  value: string | number | Date | undefined | null,
  options?: {
    includeSeconds?: boolean;
    fallback?: string;
  },
): string => {
  const fallback = options?.fallback ?? "";
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return fallback;

  try {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: SAO_PAULO_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(options?.includeSeconds ? { second: "2-digit" } : {}),
      hour12: false,
    });
    return formatter.format(date).replace(/,\s*/, " ");
  } catch {
    return formatDate(value as string, fallback);
  }
};

/**
 * Atalho semântico para timestamps de auditoria no formato "DD/MM/YYYY HH:mm"
 */
export const formatAuditTimestamp = (
  value: string | number | Date | undefined | null,
  fallback = "",
): string => {
  return formatDateTime(value, { fallback });
};

/**
 * Retorna a data de hoje no formato DD/MM/YYYY no fuso local do dispositivo.
 */
export const getTodayFormatted = (): string => {
  return DateOnly.today().toBR();
};

/**
 * Retorna a data de hoje no formato YYYY-MM-DD no fuso local do dispositivo.
 */
export const getTodayISO = (): string => {
  return DateOnly.today().toISO();
};

/** Alias direto de getTodayISO */
export const todayISO = getTodayISO;

/* ========================================================================== */
/* COMPARAÇÕES, FILTROS E DIFERENÇAS                                         */
/* ========================================================================== */

/**
 * Verifica se uma data é estritamente posterior a hoje (data futura).
 */
export const isFutureDate = (
  dateValue: string | number | Date | DateOnly | undefined | null,
): boolean => {
  if (dateValue === null || dateValue === undefined || dateValue === "") return false;
  const parsed = DateOnly.parse(dateValue);
  if (!parsed) return false;
  return parsed.isAfter(DateOnly.today());
};

/**
 * Função de comparação para usar em .sort(compareDates)
 * Ordena em ordem cronológica crescente.
 */
export const compareDates = (
  a: string | number | Date | DateOnly | undefined | null,
  b: string | number | Date | DateOnly | undefined | null,
): number => {
  const sortA = getDateSortKey(a);
  const sortB = getDateSortKey(b);
  if (sortA < sortB) return -1;
  if (sortA > sortB) return 1;
  return 0;
};

/**
 * Retorna a diferença absoluta em dias entre duas datas.
 */
export const diffInDays = (
  date1: string | number | Date | DateOnly,
  date2: string | number | Date | DateOnly,
): number => {
  const d1 = DateOnly.parse(date1);
  const d2 = DateOnly.parse(date2);

  if (!d1 || !d2) return 0;
  return d1.diffInDays(d2);
};

/** Alias para diffInDays */
export const daysBetween = diffInDays;

/**
 * Calcula idade em meses a partir de uma data de nascimento.
 * Suporta data de referência customizada (útil para testes ou projeções).
 */
export function calculateAgeInMonths(
  birthDate: string | number | Date | DateOnly | undefined | null,
  referenceDate?: string | number | Date | DateOnly,
): number {
  if (birthDate === null || birthDate === undefined || birthDate === "") return 0;

  const birth = DateOnly.parse(birthDate);
  if (!birth) return 0;

  const ref = referenceDate ? DateOnly.parse(referenceDate) : DateOnly.today();
  if (!ref) return 0;

  const yearsDiff = ref.year - birth.year;
  const monthsDiff = ref.month - birth.month;

  const total = yearsDiff * 12 + monthsDiff;
  return Math.max(0, total);
}

/**
 * Retorna a categoria/faixa de idade do animal.
 */
export function getAgeRange(months: number): AgeRange {
  if (months <= 12) {
    return "0 - 12 m";
  } else if (months <= 24) {
    return "13 - 24 m";
  } else if (months <= 36) {
    return "25 - 36 m";
  } else {
    return "+36 m";
  }
}

/**
 * Converte data de nascimento em texto amigável:
 * - Modo longo (padrão): "X anos e Y meses"
 * - Modo curto ({ short: true }): "Xa Ym" ou "X meses"
 */
export function formatAge(
  bornDate?: string | number | Date | DateOnly | null,
  optionsOrRefDate?: FormatAgeOptions | string | number | Date | DateOnly,
): string {
  if (bornDate === null || bornDate === undefined || bornDate === "") return "Não informada";

  let isShort = false;
  let refDate: string | number | Date | DateOnly | undefined = undefined;

  if (optionsOrRefDate && typeof optionsOrRefDate === "object" && !(optionsOrRefDate instanceof Date) && !(optionsOrRefDate instanceof DateOnly)) {
    isShort = Boolean((optionsOrRefDate as FormatAgeOptions).short);
    refDate = (optionsOrRefDate as FormatAgeOptions).referenceDate;
  } else if (optionsOrRefDate) {
    refDate = optionsOrRefDate as string | number | Date | DateOnly;
  }

  const months = calculateAgeInMonths(bornDate, refDate);
  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (isShort) {
    if (months < 12) {
      return `${months} meses`;
    }
    if (rest === 0) {
      return `${years} ${years === 1 ? "ano" : "anos"}`;
    }
    return `${years}a ${rest}m`;
  }

  if (years === 0) {
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }

  return `${years} ${years === 1 ? "ano" : "anos"} e ${rest} ${
    rest === 1 ? "mês" : "meses"
  }`;
}

/* ========================================================================== */
/* FILTROS POR ANO E RELATÓRIOS                                              */
/* ========================================================================== */

/**
 * Extrai o ano de uma data sem risco de deslocamento por fuso horário.
 */
export function getYearFromDate(
  value: string | number | Date | DateOnly | undefined | null,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = DateOnly.parse(value);
  return parsed ? parsed.year : null;
}

/**
 * Verifica se uma data pertence a um determinado ano.
 */
export function isDateInYear(
  value: string | number | Date | DateOnly | undefined | null,
  year: number | string,
): boolean {
  const targetYear = Number(year);
  if (!targetYear || isNaN(targetYear)) return false;

  const dateYear = getYearFromDate(value);
  return dateYear === targetYear;
}

/**
 * Filtra uma coleção de itens pelo ano de uma data extraída.
 */
export function filterByYear<T>(
  items: T[],
  getDateFn: (item: T) => string | Date | DateOnly | undefined | null,
  year: number | string,
): T[] {
  if (!year || year === "all") return items;
  return items.filter((item) => isDateInYear(getDateFn(item), year));
}
