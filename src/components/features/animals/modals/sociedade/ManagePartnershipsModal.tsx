"use client";

import { ManageOptionsModal } from "@/components/modals/ManageOptionsModal";
import { AnimalPartnership } from "@/types/partnership.type";

interface ManagePartnershipsModalProps {
  open: boolean;
  partnerships: AnimalPartnership[];
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ManagePartnershipsModal({
  open,
  partnerships,
  onClose,
  onAdd,
  onDelete,
}: ManagePartnershipsModalProps) {
  return (
    <ManageOptionsModal
      open={open}
      onClose={onClose}
      title="Gerenciar Sócios"
      description="Adicione ou remova sócios disponíveis para seleção."
      inputPlaceholder="Nome do sócio"
      emptyMessage="Nenhum sócio cadastrado."
      duplicateMessage="Este sócio já está cadastrado."
      items={partnerships.map((p) => ({ id: p.id, label: p.partner_name }))}
      onAdd={onAdd}
      onDelete={onDelete}
    />
  );
}
