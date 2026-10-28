"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Beef, Baby, Scale, Syringe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useAnimalWeights } from "@/hooks/db/animal_weights/useAnimalWeights";
import { diffInDays, todayISO } from "@/utils/dates";

export function SectionCards() {
  const { data: animals, loading: animalsLoading } = useAnimals();
  const { data: weights, loading: weightsLoading } = useAnimalWeights(undefined);

  const today = todayISO();

  // KPI 1: Rebanho Ativo
  const { activeTotal, entradaEsteMes } = useMemo(() => {
    const active = animals.filter((a) => a.animal_state === "ATIVO");
    const thisMonth = today.slice(0, 7); // "YYYY-MM"
    const entradas = animals.filter(
      (a) => a.created_at && new Date(a.created_at).toISOString().slice(0, 7) === thisMonth,
    ).length;
    return { activeTotal: active.length, entradaEsteMes: entradas };
  }, [animals, today]);

  // KPI 2: Nascimentos nos últimos 30 dias
  const { nascimentos30d, femeasPrenhas } = useMemo(() => {
    const nasc = animals.filter((a) => {
      if (!a.born_date) return false;
      return diffInDays(a.born_date, today) <= 30 && diffInDays(a.born_date, today) >= 0;
    }).length;
    const prenhas = animals.filter((a) => a.animal_state === "PRENHA").length;
    return { nascimentos30d: nasc, femeasPrenhas: prenhas };
  }, [animals, today]);

  // KPI 3: GMD Médio (Ganho Médio Diário)
  const { gmdMedio, totalPesagens } = useMemo(() => {
    if (weights.length < 2) return { gmdMedio: null, totalPesagens: weights.length };
    // Agrupar pesagens por animal e calcular GMD
    const byAnimal: Record<string, typeof weights> = {};
    for (const w of weights) {
      if (!byAnimal[w.rgn]) byAnimal[w.rgn] = [];
      byAnimal[w.rgn].push(w);
    }
    const gmds: number[] = [];
    for (const [, ws] of Object.entries(byAnimal)) {
      if (ws.length < 2) continue;
      const sorted = [...ws].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const dias = diffInDays(first.date, last.date);
      if (dias > 0) {
        const gmd = (last.value - first.value) / dias;
        gmds.push(gmd);
      }
    }
    const avg = gmds.length > 0 ? gmds.reduce((s, v) => s + v, 0) / gmds.length : null;
    return { gmdMedio: avg, totalPesagens: weights.length };
  }, [weights]);

  // KPI 4: Alertas Sanitários (vacinações futuras em ≤30 dias com base em situações de alerta)
  const { animalEmTratamento, animalEmAlerta } = useMemo(() => {
    const tratamento = animals.filter((a) => a.animal_state === "EM_TRATAMENTO").length;
    const alerta = animals.filter((a) => a.animal_state === "ALERTA").length;
    return { animalEmTratamento: tratamento, animalEmAlerta: alerta };
  }, [animals]);

  const loading = animalsLoading || weightsLoading;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">

      {/* Card 1 — Rebanho Ativo */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Beef className="h-3.5 w-3.5" />
            Rebanho Ativo
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "—" : activeTotal}
          </CardTitle>
          {entradaEsteMes > 0 && (
            <CardAction>
              <Badge variant="outline" className="text-field-green border-field-green/40">
                <TrendingUp className="h-3 w-3" />
                +{entradaEsteMes} este mês
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-primary">
            Total de animais cadastrados e ativos
          </div>
          <div className="text-muted-foreground">
            Entradas e nascimentos no mês
          </div>
        </CardFooter>
      </Card>

      {/* Card 2 — Nascimentos */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Baby className="h-3.5 w-3.5" />
            Nascimentos & Maternidade
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "—" : nascimentos30d}
          </CardTitle>
          {femeasPrenhas > 0 && (
            <CardAction>
              <Badge variant="outline" className="text-amber-600 border-amber-400/40">
                {femeasPrenhas} prenhes
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-primary">
            Bezerros nascidos nos últimos 30 dias
          </div>
          <div className="text-muted-foreground">
            {femeasPrenhas > 0 ? `${femeasPrenhas} fêmeas prenhas no rebanho` : "Sem registros de prenhez"}
          </div>
        </CardFooter>
      </Card>

      {/* Card 3 — GMD Médio */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            Desempenho Ponderal
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "—" : gmdMedio !== null ? `${gmdMedio.toFixed(3)} kg/d` : "—"}
          </CardTitle>
          {gmdMedio !== null && (
            <CardAction>
              <Badge
                variant="outline"
                className={gmdMedio >= 0.5 ? "text-field-green border-field-green/40" : "text-destructive border-destructive/40"}
              >
                {gmdMedio >= 0.5 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                GMD Médio
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-primary">
            Ganho Médio Diário do rebanho
          </div>
          <div className="text-muted-foreground">
            {totalPesagens > 0 ? `Baseado em ${totalPesagens} pesagens` : "Sem pesagens registradas"}
          </div>
        </CardFooter>
      </Card>

      {/* Card 4 — Alertas Sanitários */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Syringe className="h-3.5 w-3.5" />
            Alertas Sanitários
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "—" : animalEmTratamento + animalEmAlerta}
          </CardTitle>
          {animalEmTratamento + animalEmAlerta > 0 && (
            <CardAction>
              <Badge variant="outline" className="text-destructive border-destructive/40">
                Atenção
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-primary">
            Animais em tratamento ou com alerta
          </div>
          <div className="text-muted-foreground">
            {animalEmTratamento > 0 ? `${animalEmTratamento} em tratamento` : "Nenhum em tratamento"}
            {animalEmAlerta > 0 ? ` · ${animalEmAlerta} com alerta` : ""}
          </div>
        </CardFooter>
      </Card>

    </div>
  );
}
