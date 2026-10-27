import { useSales } from "@/hooks/db/sales/useSales";
import { useEffect, useMemo } from "react";
import { Accordion } from "@/components/ui/accordion";
import { BuyListItem } from "./BuyListItem";
import { ShoppingBag, Loader2 } from "lucide-react";

interface BuyListProps {
  clientId: string;
}

export function BuyList({ clientId }: BuyListProps) {
  const {
    allSales,
    loading: isLoading,
    actions: { setClientFilter },
  } = useSales();

  useEffect(() => {
    setClientFilter(clientId);
  }, [clientId, setClientFilter]);

  const clientSales = useMemo(() => {
    return allSales.filter((s) => s.client_id === clientId);
  }, [allSales, clientId]);

  const totalAmount = useMemo(() => {
    return clientSales.reduce((sum, sale) => sum + (sale.total_value || 0), 0);
  }, [clientSales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/40" />
        <p className="text-[10px] font-bold uppercase tracking-widest">
          Carregando Compras...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black uppercase text-foreground/60 flex items-center gap-2">
          <ShoppingBag size={14} />
          Lista de Compras
        </h3>
        {clientSales.length > 0 && (
          <span className="text-[11px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-sm uppercase">
            Montante: {formatCurrency(totalAmount)}
          </span>
        )}
      </div>

      {clientSales.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          className="w-full"
        >
          {clientSales.map((sale) => (
            <BuyListItem key={sale.id} sale={sale} />
          ))}
        </Accordion>
      ) : (
        <div className="bg-muted/10 rounded-2xl p-8 border border-dashed border-muted flex flex-col items-center justify-center text-center">
          <ShoppingBag
            size={24}
            className="text-muted-foreground mb-2 opacity-50"
          />
          <p className="text-[11px] font-bold text-muted-foreground uppercase">
            Nenhuma compra registrada
          </p>
        </div>
      )}
    </div>
  );
}
