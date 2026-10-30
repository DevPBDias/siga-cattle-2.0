import { Movement, SalePayload } from "@/types/movement.type";
import { Skull, Banknote, ArrowRightLeft } from "lucide-react";
import { formatDate } from "@/utils/dates";
import { useClientById } from "@/hooks/db/clients/useClientById";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useDeathById } from "@/hooks/db/deaths/useDeathById";
import { useSaleById } from "@/hooks/db/sales/useSaleById";
import { useExchangeById } from "@/hooks/db/exchanges/useExchangeById";
import { useUserProfiles } from "@/hooks/db/user_profiles/useUserProfiles";
import { useMemo } from "react";

interface MovementListItemProps {
  movement: Movement;
}

const typeConfig = {
  morte: {
    icon: Skull,
    label: "Morte",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  venda: {
    icon: Banknote,
    label: "Venda",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  troca: {
    icon: ArrowRightLeft,
    label: "Troca",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
};

const ClientName = ({ clientId }: { clientId: string }) => {
  const { data: client, loading: isLoading } = useClientById(clientId);

  if (isLoading) return <span className="animate-pulse">...</span>;
  return <span>{client?.name || clientId}</span>;
};

const InfoRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) => (
  <div className="flex justify-between items-center border-b border-border/50 py-0.5 last:border-0">
    <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">
      {label}
    </span>
    <span
      className={cn(
        "text-[13px] font-semibold uppercase",
        highlight ? "text-primary" : "text-foreground",
      )}
    >
      {value || "-"}
    </span>
  </div>
);

const MorteDetails = ({ details_id }: { details_id: string }) => {
  const { data: death, loading: isLoading } = useDeathById(details_id);

  if (isLoading)
    return (
      <div className="animate-pulse h-4 bg-muted rounded w-3/4 my-2 px-2" />
    );
  if (!death) return null;

  return <InfoRow label="Motivo" value={death.reason || "-"} />;
};

const VendaDetails = ({ details_id }: { details_id: string }) => {
  const { data: fetchedSale, loading: isLoading } = useSaleById(details_id);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse my-2 px-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (!fetchedSale) return null;

  return (
    <div className="flex flex-col gap-0.5">
      <InfoRow
        label={fetchedSale.sale_type === "abate" ? "Frigorífico" : "Cliente"}
        value={(<ClientName clientId={fetchedSale.client_id!} />) as any}
      />
      <InfoRow
        label="Valor Total"
        value={
          fetchedSale.total_value?.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          }) || "-"
        }
        highlight
      />
      <InfoRow label="Pagamento" value={fetchedSale.payment_method || "-"} />
      {fetchedSale.payment_method === "Boleto" && (
        <>
          <InfoRow
            label="Entrada"
            value={
              fetchedSale.down_payment?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }) || "R$ 0,00"
            }
          />
          <InfoRow label="Parcelas" value={fetchedSale.installments || "0"} />
          <InfoRow
            label="Valor das Parcelas"
            value={
              fetchedSale.installment_value?.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              }) || "R$ 0,00"
            }
            highlight
          />
        </>
      )}
      <InfoRow label="GTA" value={fetchedSale.gta_number || "-"} />
      <InfoRow label="Nota Fiscal" value={fetchedSale.invoice_number || "-"} />
    </div>
  );
};

const TrocaDetails = ({ details_id }: { details_id: string }) => {
  const { data: fetchedExchange, loading: isLoading } =
    useExchangeById(details_id);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse my-2 px-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!fetchedExchange) return null;

  return (
    <div className="space-y-1">
      <InfoRow
        label="Cliente"
        value={(<ClientName clientId={fetchedExchange.client_id} />) as any}
      />
      <InfoRow
        label="Animal Substituto"
        value={fetchedExchange.substitute_animal_rgn || "-"}
      />
    </div>
  );
};

/** Resolve o nome de exibição do responsável pelo registro.
 *  Prioridade: nome completo > parte local do e-mail > "Usuário da fazenda"
 *  Nunca exibe o UUID bruto para o usuário final.
 */
function resolveResponsibleName(
  createdBy: string | undefined,
  profileMap: Map<string, { full_name?: string; email?: string }>,
): string {
  if (!createdBy) return "Não informado";

  const profile = profileMap.get(createdBy);
  if (!profile) {
    // Perfil ainda não sincronizado; mostra placeholder amigável em vez do UUID
    return "Usuário da fazenda";
  }

  if (profile.full_name?.trim()) return profile.full_name.trim();
  if (profile.email?.trim()) {
    // Exibe apenas a parte local do e-mail (antes do @) capitalizada
    const local = profile.email.trim().split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return "Usuário da fazenda";
}

export function MovementListItem({
  movement,
}: MovementListItemProps) {
  const config = (typeConfig as any)[movement.type] || typeConfig.morte;
  const Icon = config.icon;
  const { data: profiles = [] } = useUserProfiles();

  // Mapeia id → { full_name, email } uma única vez para evitar buscas em loop
  const profileMap = useMemo(
    () =>
      new Map(
        profiles.map((p) => [p.id, { full_name: p.full_name, email: p.email }]),
      ),
    [profiles],
  );

  const responsibleName = resolveResponsibleName(movement.created_by, profileMap);

  const renderContent = () => {
    switch (movement.type) {
      case "morte":
        return <MorteDetails details_id={movement.details_id} />;
      case "venda":
        return <VendaDetails details_id={movement.details_id} />;
      case "troca":
        return <TrocaDetails details_id={movement.details_id} />;
      default:
        return null;
    }
  };

  return (
    <AccordionItem
      value={movement.id}
      className="border border-border bg-white rounded-xl overflow-hidden shadow-xs"
    >
      <AccordionTrigger className="flex flex-1 items-center justify-between px-3 py-2 hover:no-underline transition-all hover:bg-primary/5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "p-1.5 rounded-lg flex items-center justify-center shrink-0",
              config.bg,
              config.color,
            )}
          >
            {(() => {
              const IconComponent = Icon as any;
              return <IconComponent className="w-4 h-4" />;
            })()}
          </div>

          <div className="flex flex-col items-start truncate">
            <span className="font-bold text-sm text-foreground tracking-tight">
              {movement.animal_id}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">
              {formatDate(movement.date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pr-2 ml-auto">
          <span
            className={cn(
              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm",
              config.bg,
              config.color,
              config.border,
            )}
          >
            {config.label}
          </span>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <div className="pt-2 border-t border-border/50">{renderContent()}</div>
        <div className="mt-2 border-t border-border/50 pt-2">
          <InfoRow
            label="Usuário responsável"
            value={responsibleName}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
