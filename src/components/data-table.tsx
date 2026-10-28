"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
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
} from "lucide-react";

import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useAnimalWeights } from "@/hooks/db/animal_weights/useAnimalWeights";
import { useLocalQuery } from "@/hooks/core";
import { Animal } from "@/types/animal.type";
import { AnimalVaccine } from "@/types/vaccine.type";
import { formatDate, formatAge, todayISO } from "@/utils/dates";

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
  data?: any[];
}

export function DataTable({ data: initialData }: DataTableProps) {
  // Hooks RxDB reativos
  const { data: dbAnimals, loading: animalsLoading } = useAnimals();
  const { data: dbWeights, loading: weightsLoading } = useAnimalWeights(undefined);

  // Consulta de vacinas
  const vaccineQuery = useMemo(
    () => ({
      selector: { _deleted: { $eq: false } },
      sort: [{ date: "desc" } as any],
    }),
    []
  );
  const { data: dbVaccines } = useLocalQuery<AnimalVaccine>("animal_vaccines", vaccineQuery);

  // Estados locais
  const [selectedTab, setSelectedTab] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [sexFilter, setSexFilter] = useState<"ALL" | "M" | "F">("ALL");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [inspectingAnimal, setInspectingAnimal] = useState<Animal | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mapa de último peso por RGN
  const latestWeightMap = useMemo(() => {
    const map = new Map<string, { value: number; date?: string }>();
    if (!dbWeights) return map;
    for (const w of dbWeights) {
      if (!w.rgn) continue;
      const existing = map.get(w.rgn);
      if (!existing || (w.date && (!existing.date || w.date > existing.date))) {
        map.set(w.rgn, { value: w.value, date: w.date });
      }
    }
    return map;
  }, [dbWeights]);

  // Mapa de última vacina por RGN
  const latestVaccineMap = useMemo(() => {
    const map = new Map<string, { date?: string; vaccine_id?: string }>();
    if (!dbVaccines) return map;
    for (const v of dbVaccines) {
      if (!v.rgn) continue;
      const existing = map.get(v.rgn);
      if (!existing || (v.date && (!existing.date || v.date > existing.date))) {
        map.set(v.rgn, { date: v.date, vaccine_id: v.vaccine_id });
      }
    }
    return map;
  }, [dbVaccines]);

  // Animais filtrados por busca, tab e sexo
  const filteredAnimals = useMemo(() => {
    const list = dbAnimals || [];
    const query = searchQuery.trim().toLowerCase();
    const today = todayISO();

    return list.filter((animal) => {
      // Filtro de Sexo
      if (sexFilter === "M" && animal.sex?.toUpperCase() !== "M") return false;
      if (sexFilter === "F" && animal.sex?.toUpperCase() !== "F") return false;

      // Filtro de Tabs
      if (selectedTab === "nascimentos") {
        if (!animal.born_date) return false;
        // Animais nascidos no último ano ou com menos de 12 meses
        const ageDesc = formatAge(animal.born_date);
        const isYoung = ageDesc.includes("mês") || ageDesc.includes("meses") || ageDesc.includes("dia");
        if (!isYoung) return false;
      } else if (selectedTab === "pesagens") {
        // Apenas animais com pesagem registrada
        if (!latestWeightMap.has(animal.rgn)) return false;
      } else if (selectedTab === "alertas") {
        // Animais com alerta (ex: prenha, inativo, sem pesagem)
        const isPrenha = animal.animal_state?.toUpperCase() === "PRENHA";
        const isInativo = animal.animal_state?.toUpperCase() === "INATIVO";
        const noWeight = !latestWeightMap.has(animal.rgn);
        if (!isPrenha && !isInativo && !noWeight) return false;
      }

      // Filtro de Busca textual
      if (!query) return true;
      const rgn = (animal.rgn || "").toLowerCase();
      const name = (animal.name || "").toLowerCase();
      const serie = (animal.serie_rgd || "INDI").toLowerCase();
      const fullDisplay = `${serie} ${rgn}`.toLowerCase();

      return (
        rgn.includes(query) ||
        name.includes(query) ||
        serie.includes(query) ||
        fullDisplay.includes(query)
      );
    });
  }, [dbAnimals, searchQuery, sexFilter, selectedTab, latestWeightMap]);

  // Paginação dos dados
  const totalItems = filteredAnimals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAnimals.slice(start, start + pageSize);
  }, [filteredAnimals, currentPage, pageSize]);

  // Seleção de linhas
  const allCurrentSelected = paginatedData.length > 0 && paginatedData.every((a) => !!selectedRows[a.rgn]);
  const someCurrentSelected = paginatedData.some((a) => !!selectedRows[a.rgn]) && !allCurrentSelected;

  const toggleSelectAll = (checked: boolean) => {
    const next = { ...selectedRows };
    for (const a of paginatedData) {
      if (checked) {
        next[a.rgn] = true;
      } else {
        delete next[a.rgn];
      }
    }
    setSelectedRows(next);
  };

  const toggleSelectRow = (rgn: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (checked) {
        next[rgn] = true;
      } else {
        delete next[rgn];
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selectedRows).filter((k) => selectedRows[k]).length;

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
                {dbAnimals?.length ?? 0}
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
              <TableHead>Identificação / RGN</TableHead>
              <TableHead>Raça & Categoria</TableHead>
              <TableHead>Sexo / Idade</TableHead>
              <TableHead>Último Manejo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {animalsLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando rebanho do banco local...
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
                const isSelected = !!selectedRows[animal.rgn];
                const displayName = `${animal.serie_rgd || "INDI"} ${animal.rgn}`;
                const isNeloreMocho = animal.breed?.trim().toLowerCase() === "nelore mocha";
                const latestWeight = latestWeightMap.get(animal.rgn);
                const latestVaccine = latestVaccineMap.get(animal.rgn);
                const ageText = animal.born_date ? formatAge(animal.born_date) : "—";
                const state = (animal.animal_state || "ATIVO").toUpperCase();

                return (
                  <TableRow
                    key={animal.rgn}
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
                        onCheckedChange={(checked) => toggleSelectRow(animal.rgn, !!checked)}
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
                        {animal.breed || "Nelore"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {animal.type || animal.classification || "Geral"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${
                            animal.sex?.toUpperCase() === "M"
                              ? "border-sky-500/40 text-sky-700 bg-sky-50 dark:bg-sky-950/30"
                              : "border-pink-500/40 text-pink-700 bg-pink-50 dark:bg-pink-950/30"
                          }`}
                        >
                          {animal.sex?.toUpperCase() === "M" ? "Macho" : "Fêmea"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {ageText}
                      </div>
                    </TableCell>
                    <TableCell>
                      {latestWeight ? (
                        <div>
                          <span className="font-semibold text-foreground text-sm">
                            {latestWeight.value} kg
                          </span>
                          {latestWeight.date && (
                            <div className="text-xs text-muted-foreground">
                              {formatDate(latestWeight.date)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Sem pesagem
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
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {state === "ATIVO" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {state}
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
                    {inspectingAnimal.animal_state || "ATIVO"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Criado em: {inspectingAnimal.created_at ? formatDate(new Date(inspectingAnimal.created_at).toISOString().split("T")[0]) : "—"}
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold text-primary flex items-center gap-2">
                  <span>{inspectingAnimal.serie_rgd || "INDI"} {inspectingAnimal.rgn}</span>
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
                  <div className="font-semibold text-foreground mt-0.5">{inspectingAnimal.breed || "Nelore"}</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
                  <div className="text-xs text-muted-foreground">Sexo</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {inspectingAnimal.sex?.toUpperCase() === "M" ? "Macho" : "Fêmea"}
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
                    <span className="font-medium text-foreground">{inspectingAnimal.condition || "Solteira"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Tipo / Função:</span>
                    <span className="font-medium text-foreground">{inspectingAnimal.type || "Comum"}</span>
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
