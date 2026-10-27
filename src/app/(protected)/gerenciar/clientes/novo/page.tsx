"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { ClientForm } from "@/components/features/commercial/clients/ClientForm";
import { SuccessModal } from "@/components/modals/SuccessModal";
import { useNovoCliente } from "@/hooks/forms/useNovoCliente";

export default function NovoClientePage() {
  const { data, loading, actions } = useNovoCliente();

  return (
    <main className="min-h-screen bg-background pb-12">
      <ShortHeader title="Novo Cliente" />
      <div className="p-5">
        <section className="bg-card rounded-2xl p-6 border border-border/60">
          <h2 className="text-base font-bold text-primary mb-6 uppercase tracking-tight">
            Cadastro de Cliente
          </h2>
          <ClientForm onSubmit={actions.handleSubmit} isLoading={loading} />
        </section>
      </div>

      <SuccessModal
        open={data.showSuccess}
        onClose={actions.handleCloseSuccess}
        title="Cliente cadastrado!"
        message="O novo cliente foi salvo com sucesso e já está disponível."
      />
    </main>
  );
}
