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
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useAnimalWeights } from "@/hooks/db/animal_weights";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { useUserProfiles } from "@/hooks/db/user_profiles/useUserProfiles";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import { MONTHS, parseBirthDate, BirthDateParts } from "@/utils/birth.utils";
import { Animal } from "@/types/animal.type";
import { Movement } from "@/types/movement.type";
import { BirthCard } from "./BirthCard";

const ALL = "all";
const PAGE_SIZE = 20;
const FIELD_CLASS = "h-6 w-full border-0 bg-muted/40 text-sm";

export function BirthHistory() {
  const { data: animals = [], loading: animalsLoading } = useAnimals();
  const { data: farms = [], loading: farmsLoading } = useFarms();
  const { data: allWeights = [] } = useAnimalWeights();
  const { data: movements = [], loading: movementsLoading } = useMovements();
  const { data: profiles = [] } = useUserProfiles();
  const { role } = useUserAccess();
  const { data: userProfile } = useUserProfile();

  const [year, setYear] = useState(ALL);
  const [month, setMonth] = useState(ALL);
  const [farmFilter, setFarmFilter] = useState(ALL);
  const [motherQuery, setMotherQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Mapeamento de farm_id -> nome da fazenda
  const farmNames = useMemo(
    () => new Map(farms.map((farm) => [farm.id, farm.farm_name])),
    [farms],
  );

  // Mapeamento de id do perfil -> nome ou e-mail
  const profileMap = useMemo(
    () =>
      new Map(
        profiles.map((p) => [
          p.id,
          p.full_name?.trim() || p.email?.trim() || "",
        ]),
      ),
    [profiles],
  );

  // Se o usuário for membro, vincula à fazenda do perfil
  const memberFarm = useMemo(() => {
    if (role !== "member" || !userProfile?.farm_name) return null;
    const cleanProfileFarm = userProfile.farm_name.trim().toLowerCase();
    return (
      farms.find((f) => f.farm_name.trim().toLowerCase() === cleanProfileFarm) ??
      null
    );
  }, [role, userProfile?.farm_name, farms]);

  // Qualquer mudança de filtro volta para a primeira página
  const updateFilter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setLimit(PAGE_SIZE);
    };

  /** Mapa de rgn → peso de nascimento (born_metric=true, menor data) */
  const birthWeightMap = useMemo(() => {
    const map = new Map<string, number>();
    const bornWeights = allWeights.filter((w) => w.born_metric);
    for (const w of bornWeights) {
      if (!map.has(w.rgn)) {
        map.set(w.rgn, w.value);
      }
    }
    return map;
  }, [allWeights]);

  // Apenas animais que possuem uma movimentação registrada do tipo 'nascimento'
  const births = useMemo(() => {
    const animalMap = new Map<string, Animal>();
    for (const a of animals) {
      if (a.rgn) animalMap.set(a.rgn, a);
    }

    const birthMovements = movements.filter(
      (m) => m.type === "nascimento" && !m._deleted && Boolean(m.animal_id),
    );

    const list: Array<{
      animal: Animal;
      movement: Movement;
      date: BirthDateParts;
      createdByName?: string | null;
    }> = [];

    for (const m of birthMovements) {
      const animal = animalMap.get(m.animal_id);
      if (!animal) continue;

      const rawDate = m.event_date || m.date || animal.born_date;
      const parsedDate = parseBirthDate(rawDate);
      if (!parsedDate) continue;

      const createdByName =
        (m.created_by ? profileMap.get(m.created_by) : null) ||
        m.created_by ||
        null;

      list.push({
        animal,
        movement: m,
        date: parsedDate,
        createdByName,
      });
    }

    return list.sort((a, b) => b.date.sortKey.localeCompare(a.date.sortKey));
  }, [movements, animals, profileMap]);

  const years = useMemo(
    () =>
      Array.from(new Set(births.map((birth) => birth.date.year))).sort(
        (a, b) => b - a,
      ),
    [births],
  );

  const filtered = useMemo(() => {
    const query = motherQuery.trim().toLowerCase();

    return births.filter(({ animal, date }) => {
      // 1. Escopo de fazenda para usuário membro
      if (role === "member" && memberFarm) {
        if (animal.farm_id !== memberFarm.id) return false;
      } else if (farmFilter !== ALL) {
        // Filtro manual de fazenda para owner
        if (animal.farm_id !== farmFilter) return false;
      }

      // 2. Filtro de ano
      if (year !== ALL && date.year !== Number(year)) return false;

      // 3. Filtro de mês
      if (month !== ALL && date.month !== Number(month)) return false;

      // 4. Busca por RGN da mãe
      if (query && !animal.mother_rgn?.toLowerCase().includes(query)) {
        return false;
      }

      return true;
    });
  }, [births, year, month, farmFilter, motherQuery, role, memberFarm]);

  const hasFilters =
    year !== ALL ||
    month !== ALL ||
    (role === "owner" && farmFilter !== ALL) ||
    motherQuery.trim() !== "";

  const clearFilters = () => {
    setYear(ALL);
    setMonth(ALL);
    setFarmFilter(ALL);
    setMotherQuery("");
    setLimit(PAGE_SIZE);
  };

  const visible = filtered.slice(0, limit);
  const loading = animalsLoading || farmsLoading || movementsLoading;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <section
        className="space-y-3 grid grid-cols-2 items-center justify-between w-full gap-x-8 rounded-md border border-border bg-card p-3 shadow-sm"
        aria-label="Filtros do histórico de nascimentos"
      >
        {/* Fazenda vinculada (para membro) ou Seletor (para owner) */}
        {role === "member" && memberFarm ? (
          <FormRow label="Fazenda vinculada" htmlFor="member-farm-scope" className="flex flex-col items-start">
            <div
              id="member-farm-scope"
              className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold text-primary"
            >
              <span>{memberFarm.farm_name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                Escopo ativo
              </span>
            </div>
          </FormRow>
        ) : (
          <FormRow label="Fazenda" htmlFor="filter-farm" className="flex flex-col items-start gap-1">
            <Select
              value={farmFilter}
              onValueChange={updateFilter(setFarmFilter)}
            >
              <SelectTrigger id="filter-farm" className={FIELD_CLASS}>
                <SelectValue placeholder="Todas as fazendas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as fazendas</SelectItem>
                {farms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.farm_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        )}

        <FormRow label="Ano" htmlFor="filter-year" className="flex flex-col items-start gap-1">
          <Select value={year} onValueChange={updateFilter(setYear)}>
            <SelectTrigger id="filter-year" className={FIELD_CLASS}>
              <SelectValue placeholder="Todos os anos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os anos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow label="Mês" htmlFor="filter-month" className="flex flex-col items-start gap-1">
          <Select value={month} onValueChange={updateFilter(setMonth)}>
            <SelectTrigger id="filter-month" className={FIELD_CLASS}>
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os meses</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow label="RGN da mãe" htmlFor="filter-mother" className="flex flex-col items-start">
          <Input
            id="filter-mother"
            value={motherQuery}
            onChange={(e) =>
              updateFilter(setMotherQuery)(e.target.value.toUpperCase())
            }
            autoComplete="off"
            spellCheck={false}
            className={`${FIELD_CLASS} placeholder:text-xs`}
            placeholder="Digite o RGN"
          />
        </FormRow>
      </section>

      {/* Resumo */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold uppercase text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "nascimento" : "nascimentos"}
        </h3>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs font-bold uppercase text-primary hover:bg-primary/10"
            onClick={clearFilters}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-8 text-center text-muted-foreground">
          <SearchX className="h-6 w-6" />
          <p className="text-sm">
            {hasFilters
              ? "Nenhum nascimento encontrado para esses filtros."
              : "Nenhum nascimento registrado."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map(({ animal, date, createdByName, movement }) => (
            <BirthCard
              key={movement.id || animal.rgn}
              animal={animal}
              date={date}
              farmName={
                animal.farm_id ? farmNames.get(animal.farm_id) : undefined
              }
              birthWeightKg={birthWeightMap.get(animal.rgn) ?? null}
              createdBy={createdByName}
            />
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
