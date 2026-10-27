"use client";

import { useSales } from "@/hooks/db/sales/useSales";
import { useClients } from "@/hooks/db/clients/useClients";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Search, Filter, ChevronDown, ArrowDownUp, Pencil, Trash2, X, ChevronDownIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate, compareDates } from "@/utils/dates";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Sale } from "@/types/sale.type";
import { useMovements } from "@/hooks/db/movements/useMovements";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const InfoRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
}) => (
  <div className="flex justify-between gap-2 items-center border-b border-border/50 py-1 last:border-0">
    <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">
      {label}
    </span>
    <span
      className={cn(
        "text-xs font-semibold uppercase",
        highlight ? "text-amber font-extrabold text-sm" : "text-primary",
      )}
    >
      {value || "-"}
    </span>
  </div>
);

const statusConfig: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  pago: {
    color: "text-field-green",
    bg: "bg-[#e4f3e8]",
    border: "border-[#c8e5cf]",
  },
  pendente: {
    color: "text-amber",
    bg: "bg-[#fff2dc]",
    border: "border-[#fed7aa]",
  },
  parcelado: {
    color: "text-[#39718a]",
    bg: "bg-[#e5f2f5]",
    border: "border-[#bae6fd]",
  },
};

export function SalesList() {
  const {
    data: sales = [],
    loading: isLoading,
    availableYears,
    actions: {
      setYearFilter,
      setMonthFilter,
      setClientFilter,
      setPaymentMethodFilter,
      updateSale,
      deleteSale,
    },
  } = useSales();
  const { data: movements, actions: { deleteMovement } } = useMovements();

  const { data: clients = [] } = useClients();
  const { data: animals = [] } = useAnimals();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const clientsMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((c) => (map[c.id] = c.name));
    return map;
  }, [clients]);

  const animalsMap = useMemo(() => {
    const map: Record<
      string,
      { sex?: string; iabcgz?: string; deca?: string }
    > = {};
    animals.forEach((a) => {
      if (a.rgn) {
        map[a.rgn] = { sex: a.sex, iabcgz: a.iabcgz, deca: a.deca };
      }
    });
    return map;
  }, [animals]);

  const visibleSales = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const matchingSales = sales.filter((sale) => {
      if (!normalizedSearch) return true;
      const searchableFields = [
        sale.animal_rgn,
        sale.gta_number,
        sale.invoice_number,
        clientsMap[sale.client_id],
      ];
      return searchableFields.some((value) =>
        String(value ?? "")
          .toLocaleLowerCase("pt-BR")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(normalizedSearch),
      );
    });

    return [...matchingSales].sort((a, b) => {
      if (sortBy.startsWith("date")) {
        const difference = compareDates(a.date, b.date);
        return sortBy === "date_asc" ? difference : -difference;
      }
      if (sortBy.startsWith("value")) {
        const difference = (a.total_value ?? 0) - (b.total_value ?? 0);
        return sortBy === "value_asc" ? difference : -difference;
      }

      const statusA = (a.financial_status ?? "").toLocaleLowerCase("pt-BR");
      const statusB = (b.financial_status ?? "").toLocaleLowerCase("pt-BR");
      const difference = statusA.localeCompare(statusB, "pt-BR");
      return sortBy === "status_desc" ? -difference : difference;
    });
  }, [sales, searchTerm, clientsMap, sortBy]);

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSaleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!saleToEdit) return;
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    try {
      await updateSale(saleToEdit.id, {
        client_id: String(formData.get("client_id") || ""),
        date: String(formData.get("date") || saleToEdit.date),
        total_value: Number(formData.get("total_value") || 0),
        payment_method: String(formData.get("payment_method") || ""),
        financial_status: String(formData.get("payment_method") || "") === "À Vista" ? "pago" : "pendente",
        down_payment: Number(formData.get("down_payment") || 0),
        installments: Number(formData.get("installments") || 0),
        installment_value: Number(formData.get("installment_value") || 0),
        gta_number: String(formData.get("gta_number") || ""),
        invoice_number: String(formData.get("invoice_number") || ""),
        updated_at: Date.now(),
      });
      setSaleToEdit(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Botão de Filtros Expansível */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center justify-between w-full h-10 px-3 border border-border rounded-xl bg-white text-primary text-xs font-bold shadow-xs hover:border-field-green/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-field-green" />
            <span>Filtros</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              filtersOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Card Expansível de Filtros */}
        {filtersOpen && (
          <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-xl bg-white shadow-xs animate-in fade-in-0 duration-200">
            <Select
              onValueChange={(v) =>
                setYearFilter(v === "all" ? null : Number(v))
              }
            >
              <SelectTrigger className="h-10 rounded-lg bg-[#f7faf6] border-border text-xs w-full">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(v) =>
                setMonthFilter(v === "all" ? null : Number(v))
              }
            >
              <SelectTrigger className="h-10 rounded-lg bg-[#f7faf6] border-border text-xs w-full">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={String(idx + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(v) => setClientFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="h-10 rounded-lg bg-[#f7faf6] border-border text-xs w-full">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(v) =>
                setPaymentMethodFilter(v === "all" ? null : v)
              }
            >
              <SelectTrigger className="h-10 rounded-lg bg-[#f7faf6] border-border text-xs w-full">
                <SelectValue placeholder="Tipo Pgto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="À Vista">À Vista</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Busca e ordenação */}
        <div className="grid grid-cols-[minmax(0,1fr)_132px] gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Buscar venda por RGN, cliente, GTA ou nota fiscal"
                placeholder="RGN, cliente, GTA ou nota..."
                className="pl-9 h-10 rounded-xl bg-white border border-border shadow-xs text-xs placeholder:text-muted-foreground focus-visible:ring-field-green"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                aria-label="Ordenar vendas"
                className="h-10 w-full rounded-xl bg-white border-border text-[11px] shadow-xs"
              >
                <ArrowDownUp className="h-3.5 w-3.5 shrink-0 text-field-green" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="date_desc">Mais recentes</SelectItem>
                <SelectItem value="date_asc">Mais antigas</SelectItem>
                <SelectItem value="value_desc">Maior valor</SelectItem>
                <SelectItem value="value_asc">Menor valor</SelectItem>
                <SelectItem value="status_asc">Situação (A–Z)</SelectItem>
                <SelectItem value="status_desc">Situação (Z–A)</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="pt-1">
        <h2 className="text-[11px] font-bold uppercase text-muted-foreground mb-2">
          Lista de vendas ({visibleSales.length})
        </h2>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : visibleSales.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            className="space-y-2"
          >
            {visibleSales.map((sale) => {
              const animalInfo = animalsMap[sale.animal_rgn];
              const status = sale.financial_status?.toLowerCase() || "";
              const config = statusConfig[status] || {
                color: "text-muted-foreground",
                bg: "bg-muted",
                border: "border-border",
              };

              return (
                <AccordionItem
                  key={sale.id}
                  value={sale.id}
                  className="border border-border/80 bg-card rounded-xl overflow-hidden shadow-xs uppercase w-full"
                >
                  <AccordionPrimitive.Header className="flex items-center justify-between px-3.5 py-1 hover:bg-primary/5 transition-all w-full border-b border-transparent data-[state=open]:border-border/40">
                    <AccordionPrimitive.Trigger
                      data-slot="accordion-trigger"
                      className="flex flex-1 items-center gap-2 text-left focus-visible:outline-none min-w-0 p-1 group cursor-pointer [&[data-state=open]>svg]:rotate-180"
                    >
                      <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-primary tracking-tight">
                            INDI {sale.animal_rgn}
                          </span>
                          <div className="h-3.5 w-px bg-primary/20 shrink-0" />
                          <span
                            className={cn(
                              "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                              config.bg,
                              config.color,
                              config.border,
                            )}
                          >
                            {sale.financial_status || "—"}
                          </span>
                        </div>
                        {animalInfo && (
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                            <span>Sexo: <b className="text-primary font-bold">{animalInfo.sex || "-"}</b></span>
                            <span>iABCZg: <b className="text-primary font-bold">{animalInfo.iabcgz || "-"}</b></span>
                            <span>DECA: <b className="text-primary font-bold">{animalInfo.deca || "-"}</b></span>
                                                      <span className="text-primary font-bold">
                            {formatDate(sale.date)}
                          </span>
                          </div>
                        )}
                      </div>
                      <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 ml-auto" />
                    </AccordionPrimitive.Trigger>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-border/40">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        aria-label="Editar venda"
                        onClick={() => setSaleToEdit(sale)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        aria-label="Excluir venda"
                        onClick={() => setSaleToDelete(sale)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </AccordionPrimitive.Header>


                  <AccordionContent className="px-3.5 pb-3.5 pt-1 border-t border-border/50">
                    <div className="flex flex-col">
                      <InfoRow
                        label="Cliente"
                        value={clientsMap[sale.client_id] || "—"}
                      />
                      <InfoRow
                        label="Valor Total"
                        value={formatCurrency(sale.total_value)}
                        highlight
                      />
                      <InfoRow
                        label="Pagamento"
                        value={sale.payment_method || "-"}
                      />
                      {sale.payment_method === "Boleto" && (
                        <>
                          <InfoRow
                            label="Entrada"
                            value={formatCurrency(sale.down_payment)}
                          />
                          <InfoRow
                            label="Parcelas"
                            value={sale.installments || "0"}
                          />
                          <InfoRow
                            label="Valor das Parcelas"
                            value={formatCurrency(sale.installment_value)}
                            highlight
                          />
                        </>
                      )}
                      <InfoRow label="GTA" value={sale.gta_number || "-"} />
                      <InfoRow
                        label="Nota Fiscal"
                        value={sale.invoice_number || "-"}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="bg-white border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#f4f7f4] flex items-center justify-center text-muted-foreground mb-3">
              <Search size={22} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-xs font-semibold">
              Nenhuma venda encontrada com os filtros selecionados.
            </p>
          </div>
        )}
      </div>
      {saleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <form onSubmit={handleSaleUpdate} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl" aria-label="Editar venda">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-primary">Editar venda · INDI {saleToEdit.animal_rgn}</h2>
              <button type="button" onClick={() => setSaleToEdit(null)} aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Cliente
                <Select name="client_id" defaultValue={saleToEdit.client_id}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Data<input name="date" type="date" defaultValue={saleToEdit.date.slice(0, 10)} className="h-10 rounded-lg border px-3 text-sm text-foreground" /></label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Valor total<input name="total_value" type="number" step="0.01" defaultValue={saleToEdit.total_value ?? 0} className="h-10 rounded-lg border px-3 text-sm text-foreground" /></label>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Forma de pagamento
                <Select name="payment_method" defaultValue={saleToEdit.payment_method || ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="À Vista">À Vista</SelectItem><SelectItem value="Boleto">Boleto</SelectItem></SelectContent>
                </Select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Entrada<input name="down_payment" type="number" step="0.01" defaultValue={saleToEdit.down_payment ?? 0} className="h-10 rounded-lg border px-3 text-sm text-foreground" /></label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Parcelas<input name="installments" type="number" defaultValue={saleToEdit.installments ?? 0} className="h-10 rounded-lg border px-3 text-sm text-foreground" /></label>
              </div>
              <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Valor das parcelas<input name="installment_value" type="number" step="0.01" defaultValue={saleToEdit.installment_value ?? 0} className="h-10 rounded-lg border px-3 text-sm text-foreground" /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground">GTA<input name="gta_number" defaultValue={saleToEdit.gta_number || ""} className="h-10 rounded-lg border px-3 text-sm text-foreground" /></label>
                <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Nota fiscal<input name="invoice_number" defaultValue={saleToEdit.invoice_number || ""} className="h-10 rounded-lg border px-3 text-sm text-foreground" /></label>
              </div>
              <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setSaleToEdit(null)}>Cancelar</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button></div>
            </div>
          </form>
        </div>
      )}
      <ConfirmModal
        open={!!saleToDelete}
        title="Excluir venda?"
        description={saleToDelete ? `Deseja excluir a venda do animal INDI ${saleToDelete.animal_rgn}?` : ""}
        onClose={() => setSaleToDelete(null)}
        onConfirm={async () => {
          if (saleToDelete) {
            const linkedMovement = movements.find((movement) =>
              movement.type === "venda" && movement.details_id === saleToDelete.id,
            );
            if (linkedMovement) await deleteMovement(linkedMovement.id);
            else await deleteSale(saleToDelete.id);
          }
          setSaleToDelete(null);
        }}
      />
    </div>
  );
}
