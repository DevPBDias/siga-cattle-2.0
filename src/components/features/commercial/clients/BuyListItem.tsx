import { Sale } from "@/types/sale.type";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ListChecks,
  Hash,
  Dna,
} from "lucide-react";
import { formatDate } from "@/utils/dates";
import { useAnimalById } from "@/hooks/db/animals/useAnimalById";

interface BuyListItemProps {
  sale: Sale;
  isOpen?: boolean;
}

export function BuyListItem({ sale }: BuyListItemProps) {
  const isPaid = sale.financial_status?.toLowerCase() === "pago";
  const { data: animal } = useAnimalById(sale.animal_rgn);

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <AccordionItem
      value={sale.id}
      className="border border-border/50 mb-3 bg-muted/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 transition-all data-[state=open]:bg-white">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? "bg-green-100/80 text-green-600" : "bg-amber-100/80 text-amber-600"}`}
            >
              <Hash size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col text-left gap-0.5">
              <span className="text-sm font-black text-primary uppercase tracking-tight">
                INDI {sale.animal_rgn}
                {animal?.sex ? ` - ${animal.sex}` : ""}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider opacity-70">
                {formatDate(sale.date)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-black text-primary">
              {formatCurrency(sale.total_value)}
            </span>
            <div
              className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${isPaid ? "text-green-600" : "text-amber-600"}`}
            >
              {isPaid ? (
                <CheckCircle2 size={12} strokeWidth={3} />
              ) : (
                <AlertCircle size={12} strokeWidth={3} />
              )}
              {sale.financial_status || "Pendente"}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6 pt-4 bg-white/50 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-y-6 gap-x-6">
          <DetailItem
            icon={<CreditCard size={14} />}
            label="Pagamento"
            value={sale.payment_method}
          />

          <DetailItem
            icon={<ArrowUpRight size={14} />}
            label="Entrada"
            value={formatCurrency(sale.down_payment)}
          />

          <DetailItem
            icon={<AlertCircle size={14} />}
            label="Parcelas"
            value={`${sale.installments || 0}x`}
          />

          <DetailItem
            icon={<ListChecks size={14} />}
            label="Valor Parcela"
            value={formatCurrency(sale.installment_value)}
          />

          <DetailItem
            icon={<Dna size={14} />}
            label="DECA"
            value={animal?.deca}
          />

          <DetailItem
            icon={<Dna size={14} />}
            label="IABCZG"
            value={animal?.iabcgz}
          />

          {sale.gta_number && (
            <DetailItem
              icon={<Hash size={14} />}
              label="GTA"
              value={sale.gta_number}
            />
          )}

          {sale.invoice_number && (
            <DetailItem
              icon={<Hash size={14} />}
              label="Nota Fiscal"
              value={sale.invoice_number}
            />
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-muted/60 rounded-xl text-muted-foreground shadow-inner">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1.5 opacity-60 tracking-widest">
          {label}
        </span>
        <span className="text-[13px] font-bold leading-tight text-primary">
          {value || "—"}
        </span>
      </div>
    </div>
  );
}
