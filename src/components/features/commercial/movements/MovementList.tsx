import Link from "next/link";
import { useState, useMemo } from "react";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { MovementListItem } from "./MovementListItem";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";
import { Search, Plus } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Movement } from "@/types/movement.type";
import { useLocalQuery } from "@/hooks/core";
import { Sale } from "@/types/sale.type";
import { Death } from "@/types/death.type";
import { Exchange } from "@/types/exchange.type";
import type { MangoQuery } from "rxdb";

export function MovementList() {
  const {
    data: movements = [],
    loading,
  } = useMovements();
  const recordsQuery = useMemo<MangoQuery<any>>(
    () => ({ selector: { _deleted: { $eq: false } } }),
    [],
  );
  const { data: sales = [], loading: salesLoading } = useLocalQuery<Sale>(
    "sales",
    recordsQuery as MangoQuery<Sale>,
  );
  const { data: deaths = [], loading: deathsLoading } = useLocalQuery<Death>(
    "deaths",
    recordsQuery as MangoQuery<Death>,
  );
  const { data: exchanges = [], loading: exchangesLoading } = useLocalQuery<Exchange>(
    "exchanges",
    recordsQuery as MangoQuery<Exchange>,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredMovements = useMemo(() => {
    const represented = (type: Movement["type"], detailsId: string, animal: string, date: string) =>
      movements.some((movement) => movement.type === type && (
        (detailsId && movement.details_id === detailsId) ||
        (!movement.details_id && movement.animal_id === animal && movement.date.slice(0, 10) === date.slice(0, 10))
      ));
    const missingRecords: Movement[] = [
      ...sales.filter((record) => !represented("venda", record.id, record.animal_rgn, record.date)).map((record) => ({
        id: `legacy-venda-${record.id}`, type: "venda" as const, animal_id: record.animal_rgn, date: record.date,
        details_id: record.id, created_at: record.created_at, updated_at: record.updated_at, _deleted: false,
      })),
      ...deaths.filter((record) => !represented("morte", record.id, record.animal_rgn, record.date)).map((record) => ({
        id: `legacy-morte-${record.id}`, type: "morte" as const, animal_id: record.animal_rgn, date: record.date,
        details_id: record.id, created_at: record.created_at, updated_at: record.updated_at, _deleted: false,
      })),
      ...exchanges.filter((record) => !represented("troca", record.id, record.animal_rgn, record.date)).map((record) => ({
        id: `legacy-troca-${record.id}`, type: "troca" as const, animal_id: record.animal_rgn, date: record.date,
        details_id: record.id, created_at: record.created_at, updated_at: record.updated_at, _deleted: false,
      })),
    ];
    return [...movements, ...missingRecords]
      .filter((movement) => {
        // Filter by Tab (Type)
        if (activeTab !== "all" && movement.type !== activeTab) {
          return false;
        }

        // Filter by Search (RGN)
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = movement.animal_id
          .toLowerCase()
          .includes(searchLower);

        if (!matchesSearch) return false;

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, sales, deaths, exchanges, activeTab, searchTerm]);

  if (loading || salesLoading || deathsLoading || exchangesLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-24 bg-muted/40 animate-pulse rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Filters */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por RGN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted border-0 rounded-md h-10 placeholder:text-sm"
          />
        </div>
        <Link
          href="/movimentacoes/criar"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Criar
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <StandardTabList
          variant="simple"
          tabs={[
            { value: "all", label: "Todas" },
            { value: "morte", label: "Morte" },
            { value: "venda", label: "Venda" },
            { value: "troca", label: "Troca" },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-1"
        />
      </Tabs>

      {/* List */}
      <Accordion type="single" collapsible className="space-y-1 w-full">
        {filteredMovements.length > 0 ? (
          filteredMovements.map((movement) => (
            <MovementListItem
              key={movement.id}
              movement={movement}
            />
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhuma movimentação encontrada.
          </div>
        )}
      </Accordion>
    </div>
  );
}
