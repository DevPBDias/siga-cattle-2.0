"use client";

import { ManageOptionsModal } from "@/components/modals/ManageOptionsModal";
import { Farm } from "@/types/farm.type";

interface ManageFarmsModalProps {
  open: boolean;
  farms: Farm[];
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ManageFarmsModal({
  open,
  farms,
  onClose,
  onAdd,
  onDelete,
}: ManageFarmsModalProps) {
  return (
    <ManageOptionsModal
      open={open}
      onClose={onClose}
      title="Gerenciar Fazendas"
      description="Adicione ou remova fazendas e pastos disponíveis."
      inputPlaceholder="Nome da fazenda"
      emptyMessage="Nenhuma fazenda cadastrada."
      duplicateMessage="Esta fazenda já está cadastrada."
      items={farms.map((farm) => ({ id: farm.id, label: farm.farm_name }))}
      onAdd={onAdd}
      onDelete={onDelete}
    />
  );
}
