"use client";

import { ManageOptionsModal } from "@/components/modals/ManageOptionsModal";
import { AnimalSituation } from "@/types/situation.type";

interface ManageSituationsModalProps {
  open: boolean;
  situations: AnimalSituation[];
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ManageSituationsModal({
  open,
  situations,
  onClose,
  onAdd,
  onDelete,
}: ManageSituationsModalProps) {
  return (
    <ManageOptionsModal
      open={open}
      onClose={onClose}
      title="Gerenciar Situações"
      description="Adicione ou remova situações disponíveis para o animal."
      inputPlaceholder="Nome da situação"
      emptyMessage="Nenhuma situação cadastrada."
      duplicateMessage="Esta situação já está cadastrada."
      items={situations.map((s) => ({ id: s.id, label: s.situation_name }))}
      onAdd={onAdd}
      onDelete={onDelete}
    />
  );
}
