"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";
import {
  ShoppingCart,
  Users,
  ClipboardList,
  LineChart,
  BarChart3,
  Plus,
  ArrowRightLeft,
  ArrowLeft,
  X,
} from "lucide-react";
import { SalesList } from "./SalesList";
import { SalesDetails } from "./SalesDetails";
import { SalesSummary } from "./SalesSummary";
import { ClientList } from "../clients/ClientList";
import { ClientDetails } from "../clients/ClientDetails";
import { ClientForm } from "../clients/ClientForm";
import { MovementForm } from "../movements/MovementForm";
import { useClientById } from "@/hooks/db/clients/useClientById";
import { useClients } from "@/hooks/db/clients/useClients";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { SuccessModal } from "@/components/modals/SuccessModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type MainTab = "vendas" | "clientes";
type SalesSubTab = "detalhes" | "graficos" | "resumo";

export function CommercialDashboard() {
  const [mainTab, setMainTab] = useState<MainTab>("vendas");
  const [salesSubTab, setSalesSubTab] = useState<SalesSubTab>("detalhes");
  const [movementModalType, setMovementModalType] = useState<"venda" | "troca" | null>(null);

  // Client management state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);

  const { data: client, loading: isClientLoading } = useClientById(
    selectedClientId || "",
  );
  const {
    actions: { updateClient, deleteClient },
    loading: isMutationLoading,
  } = useClients();

  const handleClientUpdate = async (data: any) => {
    if (!selectedClientId) return;
    try {
      await updateClient(selectedClientId, data);
      setIsEditing(false);
      setShowEditSuccess(true);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
    }
  };

  const handleClientDelete = async () => {
    if (!selectedClientId) return;
    try {
      await deleteClient(selectedClientId);
      setSelectedClientId(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    }
  };

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setSelectedClientId(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Abas Principais: Vendas | Clientes */}
      <Tabs
        value={mainTab}
        onValueChange={(v) => setMainTab(v as MainTab)}
        className="w-full"
      >
        <StandardTabList
          variant="simple"
          tabs={[
            { value: "vendas", label: "Vendas", icon: ShoppingCart },
            { value: "clientes", label: "Clientes", icon: Users },
          ]}
          activeTab={mainTab}
          onTabChange={(v) => setMainTab(v as MainTab)}
        />

        <TabsContent value="vendas">
          {/* Abas Secundárias: Detalhes | Gráficos | Resumo */}
          <Tabs
            value={salesSubTab}
            onValueChange={(v) => setSalesSubTab(v as SalesSubTab)}
            className="w-full"
          >
            <StandardTabList
              variant="simple"
              tabs={[
                { value: "detalhes", label: "Detalhes", icon: ClipboardList },
                { value: "graficos", label: "Gráficos", icon: LineChart },
                { value: "resumo", label: "Resumo", icon: BarChart3 },
              ]}
              activeTab={salesSubTab}
              onTabChange={(v) => setSalesSubTab(v as SalesSubTab)}
            />

            <TabsContent value="detalhes" className="mt-1">
              <SalesList />
            </TabsContent>

            <TabsContent value="graficos" className="mt-1">
              <SalesDetails />
            </TabsContent>

            <TabsContent value="resumo" className="mt-1">
              <SalesSummary />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="clientes" className="mt-2">
          {selectedClientId ? (
            <div className="space-y-4">
              <div className="flex items-center mb-2">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  className="flex items-center gap-2 text-primary font-bold bg-primary/5 hover:bg-primary/10 rounded-xl"
                >
                  <ArrowLeft size={18} />
                  Voltar
                </Button>
              </div>

              {isClientLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-2xl" />
                  <Skeleton className="h-40 w-full rounded-2xl" />
                </div>
              ) : client ? (
                <>
                  {isEditing ? (
                    <div className="bg-white rounded-2xl p-5 border border-border shadow-xs animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center mb-5">
                        <h2 className="text-base font-extrabold text-primary uppercase tracking-tight">
                          Editar Cliente
                        </h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditing(false)}
                          className="rounded-xl h-9 w-9"
                        >
                          <X size={18} />
                        </Button>
                      </div>
                      <ClientForm
                        initialData={client}
                        onSubmit={handleClientUpdate}
                        isLoading={isMutationLoading}
                      />
                    </div>
                  ) : (
                    <ClientDetails
                      client={client}
                      onEdit={() => setIsEditing(true)}
                      onDelete={() => setShowDeleteConfirm(true)}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground text-sm">
                    Cliente não encontrado.
                  </p>
                  <Button
                    onClick={() => setSelectedClientId(null)}
                    className="mt-4"
                  >
                    Voltar para lista
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ClientList onSelectClient={setSelectedClientId} />
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Registro de Venda / Troca */}
      {movementModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-border">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
              <h2 className="text-base font-extrabold uppercase text-primary">
                {movementModalType === "venda" ? "Registrar Venda" : "Registrar Troca"}
              </h2>
              <button
                type="button"
                onClick={() => setMovementModalType(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>
            <MovementForm
              initialType={movementModalType}
              onSuccess={() => setMovementModalType(null)}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleClientDelete}
        title="Excluir cliente?"
        description={`Tem certeza que deseja excluir ${client?.name}? Esta ação não pode ser desfeita localmente.`}
        isLoading={isMutationLoading}
      />

      <SuccessModal
        open={showEditSuccess}
        onClose={() => setShowEditSuccess(false)}
        title="Cliente editado!"
        message="As informações do cliente foram atualizadas com sucesso."
      />
    </div>
  );
}
