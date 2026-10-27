"use client";

import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { SuccessModal } from "@/components/modals/SuccessModal";
import ShortHeader from "@/components/layout/ShortHeader";
import { ClientList } from "@/components/features/commercial/clients/ClientList";
import { ClientDetails } from "@/components/features/commercial/clients/ClientDetails";
import { ClientForm } from "@/components/features/commercial/clients/ClientForm";
import { useClientWorkspace } from "@/hooks/forms/useClientWorkspace";

export function ClientWorkspace() {
  const { data, loading, actions } = useClientWorkspace();

  return (
    <main className="min-h-screen bg-background pb-12">
      <ShortHeader title={data.headerTitle} />
      <div className="p-4">
        {actions.selectedClientId ? (
          <div className="space-y-4">
            <Button
              onClick={actions.handleBack}
              variant="ghost"
              className="flex items-center gap-2 text-primary font-bold bg-primary/5 hover:bg-primary/10 rounded-xl"
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>

            {loading.isClientLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-40 w-full rounded-3xl" />
              </div>
            ) : data.client ? (
              actions.isEditing ? (
                <div className="bg-card rounded-2xl p-6 border border-border/60 animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-primary uppercase tracking-tight">
                      Editar Cliente
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => actions.setIsEditing(false)}
                      className="rounded-xl"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  <ClientForm
                    initialData={data.client}
                    onSubmit={actions.handleUpdate}
                    isLoading={loading.isMutationLoading}
                  />
                </div>
              ) : (
                <ClientDetails
                  client={data.client}
                  onEdit={() => actions.setIsEditing(true)}
                  onDelete={() => actions.setShowDeleteConfirm(true)}
                />
              )
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Cliente não encontrado.</p>
                <Button onClick={() => actions.setSelectedClientId(null)} className="mt-4">
                  Voltar para lista
                </Button>
              </div>
            )}
          </div>
        ) : (
          <ClientList onSelectClient={actions.setSelectedClientId} />
        )}
      </div>

      <ConfirmModal
        open={actions.showDeleteConfirm}
        onClose={() => actions.setShowDeleteConfirm(false)}
        onConfirm={actions.handleDelete}
        title="Excluir cliente?"
        description={`Tem certeza que deseja excluir ${data.client?.name}? Esta ação não pode ser desfeita localmente.`}
        isLoading={loading.isMutationLoading}
      />

      <SuccessModal
        open={actions.showEditSuccess}
        onClose={() => actions.setShowEditSuccess(false)}
        title="Cliente editado!"
        message="As informações do cliente foram atualizadas com sucesso."
      />
    </main>
  );
}
