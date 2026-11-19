"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Scale,
  Syringe,
  Baby,
  Beef,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useAnimalWeights } from "@/hooks/db/animal_weights/useAnimalWeights";
import { useAllAnimalVaccines } from "@/hooks/db/animal_vaccines/useAllAnimalVaccines";
import { Animal } from "@/types/animal.type";
import {
  calculateAgeInMonths,
  compareDates,
  formatDate,
  formatAge,
  todayISO,
} from "@/utils/dates";
import { useMovements } from "@/hooks/db/movements/useMovements";
import type { Movement } from "@/types/movement.type";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableProps {
  farmId?: string;
}

function findScopedAnimal(
  animalKey: string | undefined,
  rgn: string | undefined,
  animalsByKey: Map<string, Animal>,
  animalsByRgn: Map<string, Animal[]>,
) {
  if (animalKey) return animalsByKey.get(animalKey);
  const matches = rgn ? animalsByRgn.get(rgn) : undefined;
  return matches?.length === 1 ? matches[0] : undefined;
}

function getAnimalSelectionKey(animal: Animal) {
  return animal.animal_key || animal.rgn;
}

export function DataTable({ farmId }: DataTableProps) {
  // Hooks RxDB reativos
  const {
    data: dbAnimals,
    loading: animalsLoading,
    error: animalsError,
  } = useAnimals();
  const {
    data: dbWeights,
    loading: weightsLoading,
    error: weightsError,
  } = useAnimalWeights();
  const {
    data: dbMovements,
    loading: movementsLoading,
    error: movementsError,
  } = useMovements();

  const {
    data: dbVaccines,
    loading: vaccinesLoading,
    error: vaccinesError,
  } = useAllAnimalVaccines();

  // Estados locais
  const [selectedTab, setSelectedTab] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [sexFilter, setSexFilter] = useState<"ALL" | "M" | "F">("ALL");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [inspectingAnimal, setInspectingAnimal] = useState<Animal | null>(null);

  // Ordenação por RGN (padrão: decrescente / maior para o menor)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows({});
  }, [farmId]);

  const scopedAnimals = useMemo(
    () =>
      (dbAnimals ?? []).filter(
        (animal) => farmId === undefined || animal.farm_id === farmId,
      ),
    [dbAnimals, farmId],
  );
  const animalsByKey = useMemo(() => {
    const map = new Map<string, Animal>();
    for (const animal of scopedAnimals) {
      if (animal.animal_key) map.set(animal.animal_key, animal);
    }
    return map;
  }, [scopedAnimals]);
  const animalsByRgn = useMemo(() => {
    const map = new Map<string, Animal[]>();
    for (const animal of scopedAnimals) {
      const animals = map.get(animal.rgn) ?? [];
      animals.push(animal);
      map.set(animal.rgn, animals);
    }
    return map;
  }, [scopedAnimals]);

  // Mapas de último peso e evento por animal
  const latestWeightMap = useMemo(() => {
    const map = new Map<string, { value: number; date?: string }>();
    if (!dbWeights) return map;
    for (const weight of dbWeights) {
      const animal = findScopedAnimal(weight.animal_key, weight.rgn, animalsByKey, animalsByRgn);
      if (!animal) continue;
      const key = animal.animal_key ?? `rgn:${animal.rgn}`;
      const existing = map.get(key);
      if (!existing || (weight.date && (!existing.date || weight.date > existing.date))) {
        map.set(key, { value: weight.value, date: weight.date });
      }
    }
    return map;
  }, [animalsByKey, animalsByRgn, dbWeights]);

  const latestEventMap = useMemo(() => {
    const map = new Map<string, { label: string; date: string }>();
    const addEvent = (animalKey: string | undefined, rgn: string, label: string, date?: string) => {
      if (!date) return;
      const animal = findScopedAnimal(animalKey, rgn, animalsByKey, animalsByRgn);
      if (!animal) return;
      const key = animal.animal_key ?? `rgn:${animal.rgn}`;
      const existing = map.get(key);
      if (!existing || compareDates(existing.date, date) < 0) {
        map.set(key, { label, date });
      }
    };

    for (const weight of dbWeights ?? []) {
      addEvent(weight.animal_key, weight.rgn, "Pesagem", weight.date);
    }
    for (const vaccine of dbVaccines ?? []) {
      addEvent(vaccine.animal_key, vaccine.rgn, "Vacinação", vaccine.date);
    }
    const movementLabels: Record<Movement["type"], string> = {
      nascimento: "Nascimento",
      morte: "Morte",
      venda: "Venda",
      troca: "Troca",
    };
    for (const movement of dbMovements ?? []) {
      addEvent(
        movement.animal_key,
        movement.animal_id,
        movementLabels[movement.type],
        movement.event_date || movement.date,
      );
    }
    return map;
  }, [animalsByKey, animalsByRgn, dbMovements, dbVaccines, dbWeights]);

  // Animais filtrados por busca, tab e sexo
  const filteredAnimals = useMemo(() => {
    const list: Animal[] = scopedAnimals;
    const query = searchQuery.trim().toLowerCase();
    const today = todayISO();

    const filtered = list.filter((animal: Animal) => {
      // Filtro de Sexo
      if (sexFilter === "M" && animal.sex?.toUpperCase() !== "M") return false;
      if (sexFilter === "F" && animal.sex?.toUpperCase() !== "F") return false;

      // Filtro de Tabs
      if (selectedTab === "nascimentos") {
        if (!animal.born_date || animal.born_date > today) return false;
        if (calculateAgeInMonths(animal.born_date, today) > 12) return false;
      } else if (selectedTab === "pesagens") {
        // Apenas animais com pesagem registrada
        if (!latestWeightMap.has(animal.animal_key ?? `rgn:${animal.rgn}`)) return false;
      } else if (selectedTab === "alertas") {
        const state = animal.animal_state?.toUpperCase();
        if (state !== "ALERTA" && state !== "EM_TRATAMENTO") return false;
      }

      // Filtro de Busca textual
      if (!query) return true;
      const rgn = (animal.rgn || "").toLowerCase();
      const name = (animal.name || "").toLowerCase();
      const serie = (animal.serie_rgd || "").toLowerCase();
      const fullDisplay = `${serie} ${rgn}`.toLowerCase();

      return (
        rgn.includes(query) ||
        name.includes(query) ||
        serie.includes(query) ||
        fullDisplay.includes(query)
      );
    });

    // Ordenação pelo RGN do maior para o menor (decrescente por padrão)
    return filtered.sort((a: Animal, b: Animal) => {
      const rgnA = (a.rgn || "").trim();
      const rgnB = (b.rgn || "").trim();

      if (!rgnA && !rgnB) return 0;
      if (!rgnA) return 1;
      if (!rgnB) return -1;

      const numA = Number(rgnA);
      const numB = Number(rgnB);

      let comparison = 0;
      if (!isNaN(numA) && !isNaN(numB)) {
        // Numérico puro: maior para o menor
        comparison = numB - numA;
      } else {
        // Alfanumérico natural (ex: A100 vs A20): maior para o menor
        comparison = rgnB.localeCompare(rgnA, undefined, { numeric: true, sensitivity: "base" });
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });
  }, [scopedAnimals, searchQuery, sexFilter, selectedTab, latestWeightMap, sortOrder]);

  // Paginação dos dados
  const totalItems = filteredAnimals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAnimals.slice(start, start + pageSize);
  }, [filteredAnimals, currentPage, pageSize]);

  // Seleção de linhas
  const allCurrentSelected = paginatedData.length > 0 && paginatedData.every((a) => !!selectedRows[getAnimalSelectionKey(a)]);
  const someCurrentSelected = paginatedData.some((a) => !!selectedRows[getAnimalSelectionKey(a)]) && !allCurrentSelected;

  const toggleSelectAll = (checked: boolean) => {
    const next = { ...selectedRows };
    for (const a of paginatedData) {
      const key = getAnimalSelectionKey(a);
      if (checked) {
        next[key] = true;
      } else {
        delete next[key];
      }
    }
    setSelectedRows(next);
  };

  const toggleSelectRow = (key: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (checked) {
        next[key] = true;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selectedRows).filter((k) => selectedRows[k]).length;
  const isLoading = animalsLoading || weightsLoading || vaccinesLoading || movementsLoading;
  const dataError = animalsError || weightsError || vaccinesError || movementsError;

  return (
    <div className="w-full space-y-4 px-4 lg:px-6">
      {/* Abas e Barra de Ações Superior */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={selectedTab}
          onValueChange={(val) => {
            setSelectedTab(val);
            setCurrentPage(1);
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="todos" className="gap-2">
              <Beef className="h-4 w-4 text-field-green" />
              <span>Todos os Animais</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {scopedAnimals.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="nascimentos" className="gap-2">
              <Baby className="h-4 w-4 text-amber" />
              <span>Nascimentos</span>
            </TabsTrigger>
            <TabsTrigger value="pesagens" className="gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <span>Pesagens</span>
            </TabsTrigger>
            <TabsTrigger value="alertas" className="gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Alertas</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Atalhos Rápidos */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 bg-field-green/10 border border-field-green/30 text-field-green px-3 py-1 rounded-md text-xs font-semibold">
              <span>{selectedCount} selecionado(s)</span>
              <button
                onClick={() => setSelectedRows({})}
                className="hover:opacity-80"
                title="Desmarcar todos"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1.5 h-8">
            <Link href="/consulta">
              <Eye className="h-4 w-4" />
              <span>Ver Consulta Completa</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-xl border border-border/60 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por brinco, RGN, série ou nome..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro de Sexo */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => {
                setSexFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                sexFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                setSexFilter("M");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                sexFilter === "M"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Machos
            </button>
            <button
              onClick={() => {
                setSexFilter("F");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                sexFilter === "F"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Fêmeas
            </button>
          </div>
        </div>
      </div>

      {dataError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Não foi possível carregar os registros relacionados: {String(dataError)}
        </p>
      )}

      {/* Tabela de Dados */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allCurrentSelected ? true : someCurrentSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                  aria-label="Selecionar todos da página"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                title={`Clique para alternar ordenação por RGN (${sortOrder === "desc" ? "atualmente: maior para o menor" : "atualmente: menor para o maior"})`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Identificação / RGN</span>
                  {sortOrder === "desc" ? (
                    <ArrowDown className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              </TableHead>
              <TableHead>Raça & Categoria</TableHead>
              <TableHead>Sexo / Idade</TableHead>
              <TableHead>Último Manejo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando rebanho do banco local...
                </TableCell>
              </TableRow>
            ) : dataError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-destructive">
                  Os registros não puderam ser carregados.
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "Nenhum animal encontrado para a busca." : "Nenhum registro para exibir nesta aba."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((animal) => {
                const selectionKey = getAnimalSelectionKey(animal);
                const isSelected = !!selectedRows[selectionKey];
                const displayName = `${animal.serie_rgd || "—"} ${animal.rgn}`;
                const isNeloreMocho = animal.breed?.trim().toLowerCase() === "nelore mocha";
                const animalDataKey = animal.animal_key ?? `rgn:${animal.rgn}`;
                const latestEvent = latestEventMap.get(animalDataKey);
                const ageText = animal.born_date ? formatAge(animal.born_date) : "—";
                const state = (animal.animal_state || "").toUpperCase();

                return (
                  <TableRow
                    key={animal.animal_key || animal.rgn}
                    data-state={isSelected ? "selected" : undefined}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Evitar clique se foi no checkbox ou botão
                      if ((e.target as HTMLElement).closest("button, input[type=checkbox]")) return;
                      setInspectingAnimal(animal);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleSelectRow(selectionKey, !!checked)}
                        aria-label={`Selecionar ${displayName}`}
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      <div className="flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {isNeloreMocho && (
                          <span
                            className="text-amber font-extrabold text-sm"
                            title="Nelore Mocha"
                          >
                            *
                          </span>
                        )}
                      </div>
                      {animal.name && (
                        <div className="text-xs text-muted-foreground font-normal">
                          {animal.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">
                        {animal.breed || "Raça não informada"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {animal.type || animal.classification || "Categoria não informada"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${
                            animal.sex?.toUpperCase() === "M"
                              ? "border-primary/30 text-primary bg-primary/5"
                              : animal.sex?.toUpperCase() === "F"
                                ? "border-amber/30 text-amber bg-amber/5"
                                : "border-border text-muted-foreground bg-muted"
                          }`}
                        >
                          {animal.sex?.toUpperCase() === "M"
                            ? "Macho"
                            : animal.sex?.toUpperCase() === "F"
                              ? "Fêmea"
                              : "Sexo não informado"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ageText}
                      </div>
                    </TableCell>
                    <TableCell>
                      {latestEvent ? (
                        <div>
                          <span className="font-semibold text-foreground text-sm">
                            {latestEvent.label}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(latestEvent.date)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Sem manejo registrado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-medium ${
                          state === "ATIVO"
                            ? "bg-field-green/10 text-field-green border-field-green/30"
                            : state === "PRENHA"
                            ? "bg-amber/10 text-amber border-amber/30"
                            : state === "ALERTA" || state === "EM_TRATAMENTO"
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {state === "ATIVO" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {state || "Status não informado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Ver Ficha Rápida"
                          onClick={() => setInspectingAnimal(animal)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/consulta?rgn=${animal.rgn}`}>
                                Ficha Completa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/pesagem-ce?rgn=${animal.rgn}`}>
                                Registrar Pesagem
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/vacinas?rgn=${animal.rgn}`}>
                                Registrar Vacina
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Rodapé da Tabela: Paginação e Contadores */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
          <div>
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            a{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{totalItems}</span> animais
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-card border border-border/60 rounded px-2 py-1 text-xs text-foreground cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-medium text-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet / Drawer Lateral de Ficha Rápida do Animal */}
      <Sheet open={!!inspectingAnimal} onOpenChange={(open) => !open && setInspectingAnimal(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {inspectingAnimal && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-field-green border-field-green/30 bg-field-green/5">
                    {inspectingAnimal.animal_state || "Status não informado"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Criado em: {inspectingAnimal.created_at ? formatDate(inspectingAnimal.created_at) : "—"}
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold text-primary flex items-center gap-2">
                  <span>{inspectingAnimal.serie_rgd || "—"} {inspectingAnimal.rgn}</span>
                  {inspectingAnimal.breed?.trim().toLowerCase() === "nelore mocha" && (
                    <span className="text-amber font-extrabold text-base">*</span>
                  )}
                </SheetTitle>
                <SheetDescription>
                  {inspectingAnimal.name || "Sem nome fantasia cadastrado"}
                </SheetDescription>
              </SheetHeader>

              {/* Informações Resumidas */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                  <div className="text-xs text-muted-foreground">Raça</div>
                  <div className="font-semibold text-foreground mt-0.5">{inspectingAnimal.breed || "Não informada"}</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                  <div className="text-xs text-muted-foreground">Sexo</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {inspectingAnimal.sex?.toUpperCase() === "M"
                      ? "Macho"
                      : inspectingAnimal.sex?.toUpperCase() === "F"
                        ? "Fêmea"
                        : "Não informado"}
                  </div>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                  <div className="text-xs text-muted-foreground">Data Nascimento</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {inspectingAnimal.born_date ? formatDate(inspectingAnimal.born_date) : "—"}
                  </div>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                  <div className="text-xs text-muted-foreground">Idade Atual</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {inspectingAnimal.born_date ? formatAge(inspectingAnimal.born_date) : "—"}
                  </div>
                </div>
              </div>

              {/* Dados Genealógicos */}
              <div className="space-y-3 bg-card p-4 rounded-xl border border-border/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Genealogia
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Pai:</span>
                    <span className="font-medium text-foreground">{inspectingAnimal.father_name || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Mãe (RGN):</span>
                    <span className="font-medium text-foreground">
                      {inspectingAnimal.mother_serie_rgd ? `${inspectingAnimal.mother_serie_rgd} ` : ""}{inspectingAnimal.mother_rgn || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Condição:</span>
                    <span className="font-medium text-foreground">{inspectingAnimal.condition || "Não informada"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Tipo / Função:</span>
                    <span className="font-medium text-foreground">{inspectingAnimal.type || "Não informado"}</span>
                  </div>
                </div>
              </div>

              {/* Ações na Ficha Rápida */}
              <div className="space-y-2 pt-2">
                <Button asChild className="w-full gap-2">
                  <Link href={`/consulta?rgn=${inspectingAnimal.rgn}`}>
                    <ExternalLink className="h-4 w-4" />
                    Abrir Ficha Cadastral Completa
                  </Link>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/pesagem-ce?rgn=${inspectingAnimal.rgn}`}>
                      <Scale className="h-4 w-4" />
                      Pesar Animal
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <Link href={`/vacinas?rgn=${inspectingAnimal.rgn}`}>
                      <Syringe className="h-4 w-4" />
                      Vacinar
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
