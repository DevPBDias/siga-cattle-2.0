"use client";

import { Client } from "@/types/client.type";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Landmark,
  FileText,
  Edit3,
  Trash2,
} from "lucide-react";
import { BuyList } from "./BuyList";

interface ClientDetailsProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientDetails({
  client,
  onEdit,
  onDelete,
}: ClientDetailsProps) {
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Client Info Card */}
      <div className="bg-white rounded-xl px-2 py-4 shadow-sm border border-border/50 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col items-start pl-2">
            <h2 className="text-xl font-bold text-primary text-center line-clamp-1 uppercase">
              {client.name}
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              {client.farm || "Nenhuma fazenda cadastrada"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="rounded-xl bg-primary/5 text-primary hover:bg-primary/10 h-10 w-10"
            >
              <Edit3 size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="rounded-xl bg-destructive/5 text-destructive hover:bg-destructive/10 h-10 w-10"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-border">
          <DetailItem
            icon={<FileText size={16} />}
            label="CPF / CNPJ"
            value={client.cpf_cnpj}
          />
          <DetailItem
            icon={<Phone size={16} />}
            label="Telefone"
            value={client.phone}
          />
          <DetailItem
            icon={<Mail size={16} />}
            label="E-mail"
            value={client.email}
          />
          <DetailItem
            icon={<MapPin size={16} />}
            label="Cidade"
            value={client.city}
          />
          <DetailItem
            icon={<Landmark size={16} />}
            label="Inscrição Estadual"
            value={client.inscricao_estadual}
          />
        </div>
      </div>

      {/* Buy List Section */}
      <BuyList clientId={client.id} />
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-muted/50 rounded-lg text-muted-foreground">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">
          {label}
        </span>
        <span className="text-sm font-bold text-primary">
          {value || "Não informado"}
        </span>
      </div>
    </div>
  );
}
