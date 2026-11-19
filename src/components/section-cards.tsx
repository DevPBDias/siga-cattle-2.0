"use client";

import { AlertTriangle, TrendingUp, TrendingDown, Beef, Baby, Scale, Syringe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/dashboard/useDashboardStats";

export function SectionCards({ farmId }: { farmId?: string }) {
  const { stats, loading, error } = useDashboardStats(farmId);
  const unavailable = loading || Boolean(error);
  const {
    activeTotal,
    entradaEsteMes,
    nascimentos30d,
    femeasPrenhas,
    gmdMedio,
    totalPesagens,
    animalEmTratamento,
    animalEmAlerta,
  } = stats;

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Não foi possível carregar os indicadores: {String(error)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">

      {/* Card 1 — Rebanho Ativo */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Beef className="h-3.5 w-3.5" />
            Rebanho Ativo
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {unavailable ? "—" : activeTotal}
          </CardTitle>
          {!unavailable && entradaEsteMes > 0 && (
            <CardAction>
              <Badge variant="outline" className="text-field-green border-field-green/40">
                <TrendingUp className="h-3 w-3" />
                +{entradaEsteMes} cadastros
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-primary">
            Total de animais cadastrados e ativos
          </div>
          <div className="text-muted-foreground">
            {unavailable ? "—" : "Animais cadastrados neste mês"}
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
            {unavailable ? "—" : nascimentos30d}
          </CardTitle>
          {!unavailable && femeasPrenhas > 0 && (
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
            {unavailable
              ? "—"
              : femeasPrenhas > 0
                ? `${femeasPrenhas} fêmeas prenhas no rebanho`
                : "Sem registros de prenhez"}
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
            {unavailable ? "—" : gmdMedio !== null ? `${gmdMedio.toFixed(3)} kg/d` : "—"}
          </CardTitle>
          {!unavailable && gmdMedio !== null && (
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
            {unavailable
              ? "—"
              : totalPesagens > 0
                ? `Baseado em ${totalPesagens} pesagens`
                : "Sem pesagens registradas"}
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
            {unavailable ? "—" : animalEmTratamento + animalEmAlerta}
          </CardTitle>
          {!unavailable && animalEmTratamento + animalEmAlerta > 0 && (
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
            {unavailable
              ? "—"
              : animalEmTratamento > 0
                ? `${animalEmTratamento} em tratamento`
                : "Nenhum em tratamento"}
            {!unavailable && animalEmAlerta > 0 ? ` · ${animalEmAlerta} com alerta` : ""}
          </div>
        </CardFooter>
      </Card>

      </div>
    </div>
  );
}
