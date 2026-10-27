import { formatDate } from "@/utils/dates";

/* ---------- Tipos ---------- */

export type Diagnostic = "prenha" | "vazia";

export interface ProtocolConfig {
  tabLabel: string;
  diagnosticLabel: string;
  iatf: { d8: string; d10: string };
  resync: { d0: string; d8: string; d10: string };
  monta: { entry: string; exit: string };
}

/* ---------- Configuração por protocolo (Strategy) ---------- */
/* Para adicionar um protocolo novo (ex.: D12), basta incluir uma entrada. */

const SYNC_D10: ProtocolConfig = {
  tabLabel: "SYNC D10",
  diagnosticLabel: "DIAGNOSTICO GESTACIONAL (D30)",
  iatf: { d8: "Data D8", d10: "Data D10" },
  resync: {
    d0: "Data D0 (D22)",
    d8: "Data D8 (D30)",
    d10: "Data D10 (D32)",
  },
  monta: { entry: "Data Entrada (D35)", exit: "Data Saída (D80)" },
};

const SYNC_D11: ProtocolConfig = {
  tabLabel: "SYNC D11",
  diagnosticLabel: "DIAGNOSTICO GESTACIONAL (D32)",
  iatf: { d8: "Data D9", d10: "Data D11" },
  resync: {
    d0: "Data D0 (D23)",
    d8: "Data D9 (D32)",
    d10: "Data D11 (D34)",
  },
  monta: { entry: "Data Entrada (D37)", exit: "Data Saída (D82)" },
};

const PROTOCOLS: Record<string, ProtocolConfig> = {
  "Sync D11": SYNC_D11,
  "Sync D10": SYNC_D10,
};

export const getProtocolConfig = (name?: string | null): ProtocolConfig =>
  (name && PROTOCOLS[name]) || SYNC_D10;

/* ---------- Diagnóstico ---------- */

export const DIAGNOSTIC_STYLES: Record<
  Diagnostic,
  { label: string; className: string }
> = {
  prenha: {
    label: "PRENHA",
    className: "text-emerald-700 border-emerald-200 bg-emerald-100",
  },
  vazia: {
    label: "VAZIA",
    className: "text-rose-700 border-rose-200 bg-rose-100",
  },
};

export const isDiagnostic = (value?: string | null): value is Diagnostic =>
  value === "prenha" || value === "vazia";

/* ---------- Helpers ---------- */

export const formatDateOrDash = (date?: string | null): string =>
  date ? formatDate(date) : "-";
