"use client";

import { AlertCircle } from "lucide-react";
import { AnimalForm } from "@/components/features/animals/form/AnimalForm";
import { AnimalCadastroSuccessModal } from "@/components/features/animals/modals/AnimalCadastroSuccessModal";
import ShortHeader from "@/components/layout/ShortHeader";
import { useAnimalCadastro } from "@/hooks/forms/useAnimalCadastro";

export default function CadastroAnimalPage() {
  const { data, loading, error, actions } = useAnimalCadastro();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Cadastro de Animal" />

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-2xl">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-destructive">Atenção</p>
                <p className="text-destructive/90">{error}</p>
              </div>
            </div>
          )}

          <AnimalForm
            onSubmit={actions.handleFormSubmit}
            isSubmitting={loading}
            title="Cadastrar Animal"
          />
        </div>
      </main>

      <AnimalCadastroSuccessModal
        open={actions.showModal}
        rgn={data.createdRgn}
        onClose={actions.handleCloseModal}
      />
    </div>
  );
}
