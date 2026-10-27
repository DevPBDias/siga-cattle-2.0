import { diffInDays, parseDate, compareDates } from "@/utils/dates";

export function parseData(dataStr: string): Date {
  const parsed = parseDate(dataStr);
  if (!parsed) throw new Error("Formato de data inválido: " + dataStr);
  return parsed;
}

export function diferencaEmDias(data1: string, data2: string): number {
  return diffInDays(data1, data2);
}

export function calcularGanhoDiario(
  pesosMedidos?: { mes: string; valor: number }[]
): {
  initialDate: string;
  endDate: string;
  days: number;
  totalGain: number;
  dailyGain: number;
}[] {
  if (!pesosMedidos || pesosMedidos.length < 2) return [];

  const valid = pesosMedidos
    .map((p) => ({ mes: p?.mes ?? "", valor: Number(p?.valor ?? NaN) }))
    .filter((p) => p.mes && !Number.isNaN(p.valor));

  if (valid.length < 2) return [];

  const ordenado = [...valid].sort((a, b) => compareDates(a.mes, b.mes));

  const ganhos = ordenado.slice(1).map((pAtual, i) => {
    const pAnterior = ordenado[i];

    const days = diffInDays(pAnterior.mes, pAtual.mes);
    const totalGain = pAtual.valor - pAnterior.valor;
    const dailyGain = days > 0 ? totalGain / days : 0;

    return {
      initialDate: pAnterior.mes,
      endDate: pAtual.mes,
      days,
      totalGain: Number(totalGain.toFixed(2)),
      dailyGain: Number(dailyGain.toFixed(3)),
    };
  });

  return ganhos;
}
