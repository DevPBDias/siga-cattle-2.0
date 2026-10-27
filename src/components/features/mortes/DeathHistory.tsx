"use client";

import { useMemo, useState } from "react";
import { Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormRow } from "@/components/ui/FormRow";
import { useDeaths } from "@/hooks/db/deaths/useDeaths";
import { MONTHS } from "@/utils/birth.utils";
import { DeathCard } from "./DeathCard";
import { parseIsoDate } from "@/utils/death.utils";

const ALL = "all";
const PAGE_SIZE = 20;
const FIELD_CLASS = "h-10 w-full border-0 bg-muted/40 text-sm";

export function DeathHistory() {
  const { data: deaths = [], loading } = useDeaths();

  const [rgnQuery, setRgnQuery] = useState("");
  const [year, setYear] = useState(ALL);
  const [month, setMonth] = useState(ALL);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Qualquer mudança de filtro volta para a primeira página
  const updateFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setLimit(PAGE_SIZE);
  };

  // Mortes com a data interpretada, da mais recente para a mais antiga
  const records = useMemo(
    () =>
      deaths
        .filter((death) => !death._deleted)
        .map((death) => ({ death, date: parseIsoDate(death.date) }))
        .filter(
          (record): record is { death: (typeof deaths)[number]; date: NonNullable<ReturnType<typeof parseIsoDate>> } =>
            record.date !== null,
        )
        .sort(
          (a, b) =>
            b.death.date.localeCompare(a.death.date) ||
            b.death.created_at - a.death.created_at,
        ),
    [deaths],
  );

  const years = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.date.year))).sort(
        (a, b) => b - a,
      ),
    [records],
  );

  const filtered = useMemo(() => {
    const query = rgnQuery.trim().toLowerCase();

    return records.filter(({ death, date }) => {
      if (year !== ALL && date.year !== Number(year)) return false;
      if (month !== ALL && date.month !== Number(month)) return false;
      if (query && !death.animal_rgn.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [records, rgnQuery, year, month]);

  const hasFilters = rgnQuery.trim() !== "" || year !== ALL || month !== ALL;

  const clearFilters = () => {
    setRgnQuery("");
    setYear(ALL);
    setMonth(ALL);
    setLimit(PAGE_SIZE);
  };

  const visible = filtered.slice(0, limit);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <section
        className="space-y-3 rounded-xl border border-border bg-card p-3"
        aria-label="Filtros do histórico de mortes"
      >
        <FormRow label="RGN" htmlFor="filter-death-rgn">
          <Input
            id="filter-death-rgn"
            value={rgnQuery}
            onChange={(e) =>
              updateFilter(setRgnQuery)(e.target.value.toUpperCase())
            }
            autoComplete="off"
            spellCheck={false}
            className={`${FIELD_CLASS} placeholder:text-xs`}
            placeholder="Digite o RGN"
          />
        </FormRow>

        <FormRow label="Ano" htmlFor="filter-death-year">
          <Select value={year} onValueChange={updateFilter(setYear)}>
            <SelectTrigger id="filter-death-year" className={FIELD_CLASS}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow label="Mês" htmlFor="filter-death-month">
          <Select value={month} onValueChange={updateFilter(setMonth)}>
            <SelectTrigger id="filter-death-month" className={FIELD_CLASS}>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      </section>

      {/* Resumo */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "morte" : "mortes"}
        </h3>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs font-bold uppercase text-primary"
            onClick={clearFilters}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-8 text-center text-muted-foreground">
          <SearchX className="h-6 w-6" />
          <p className="text-sm">
            {hasFilters
              ? "Nenhuma morte para esses filtros."
              : "Nenhuma morte registrada."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map(({ death }) => (
            <DeathCard key={death.id} death={death} />
          ))}

          {filtered.length > visible.length && (
            <Button
              type="button"
              variant="outline"
              className="h-11 text-xs font-bold uppercase tracking-wider"
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
            >
              Mostrar mais ({filtered.length - visible.length})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
