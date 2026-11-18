"use client";

import { Animal } from "@/types/animal.type";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimalForm } from "../../form/AnimalForm";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";

interface EditAnimalModalProps {
  open: boolean;
  onClose: () => void;
  animal: Animal;
}

export function EditAnimalModal({
  open,
  onClose,
  animal,
}: EditAnimalModalProps) {
  const {
    actions: { updateAnimal },
    loading: isLoading,
  } = useUpdateAnimal();

  const handleSave = async (data: Partial<Animal>) => {
    try {
      await updateAnimal(animal.animal_key || animal.rgn, data);
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar animal:", error);
      // O erro já é tratado pelo hook ou pode ser exibido localmente se desejar
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 flex flex-col h-[85vh] overflow-hidden border-0 rounded-4xl">
        <DialogHeader className="px-8 py-6 border-b border-border shrink-0 bg-white dark:bg-zinc-900 rounded-t-4xl">
          <DialogTitle className="text-primary uppercase font-black text-xl flex items-center gap-2">
            Editar Cadastro
          </DialogTitle>
          <p className="text-muted-foreground text-xs uppercase font-medium">
            Alterando dados de:{" "}
            <span className="font-bold text-primary">
              {animal.serie_rgd} {animal.rgn}
            </span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-white dark:bg-zinc-900">
          <ScrollArea className="h-full px-8 py-6">
            <AnimalForm
              onSubmit={handleSave}
              isSubmitting={isLoading}
              initialData={animal}
              title="Salvar Alterações"
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
