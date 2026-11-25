"use client";

import { useState, useMemo } from "react";
import { StandardTabList } from "@/components/ui/StandardTabList";
import ShortHeader from "@/components/layout/ShortHeader";
import { useAnimalById } from "@/hooks/db/animals/useAnimalById";
import { useAnimalVaccines } from "@/hooks/db/animal_vaccines/useAnimalVaccines";
import { useVaccines } from "@/hooks/db/vaccines/useVaccines";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useDeleteAnimalVaccine } from "@/hooks/db/animal_vaccines/useDeleteAnimalVaccine";
import { Animal } from "@/types/animal.type";
import { normalizeAnimalRegistration } from "@/utils/animalIdentity";
import {
  Trash2,
  Syringe,
  Calendar,
  AlertCircle,
  LineChart,
  ClipboardList,
  VenusAndMars,
  RulerDimensionLine,
  History,
} from "lucide-react";
import { DetailsMovementList } from "@/components/features/commercial/movements/DetailsMovementList";
import { ChartLineLabel } from "@/components/charts/BoiCharts";
import { useAnimalWeights } from "@/hooks/db/animal_weights";
import { useAnimalCE } from "@/hooks/db/animal_ce";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatDate,
  calculateAgeInMonths as getAgeMonths,
  getAgeRange,
} from "@/utils/dates";
import Link from "next/link";
import { DetailsWeightList } from "@/components/features/animals/lists/DetailsWeightList";
import { DetailsCircunfList } from "@/components/features/animals/lists/DetailsCircunfList";
import { DetailsSkeleton } from "@/components/ui/skeletons/DetailsSkeleton";
import { useReproductionEvents } from "@/hooks/db/reproduction_event/useReproductionEvents";
import { useMovementsByAnimal } from "@/hooks/db/movements/useMovementsByAnimal";
import { useLocalQuery } from "@/hooks/core";
import { Transaction } from "@/types/transaction.type";
import type { MangoQuery } from "rxdb";
import { Accordion } from "@/components/ui/accordion";
import { EditReproductionModal } from "@/components/features/reproduction/modals/reproduction/EditReproductionModal";
import { DeleteReproductionModal } from "@/components/features/reproduction/modals/reproduction/DeleteReproductionModal";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { ReproductionEventCard } from "@/components/features/reproduction/ReproductionEventCard";

interface DetailsAnimalLayoutProps {
  animalKey: string;
}

const LABEL = "text-[10px] text-gray-500 uppercase";
const VALUE = "text-[12px] font-semibold text-primary uppercase text-right truncate";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 border-b border-border py-0.5 last:border-b-0">
    <span className={LABEL}>{label}</span>
    {children}
  </div>
);

const Val = ({ children }: { children?: React.ReactNode }) => (
  <span className={VALUE}>{children || "-"}</span>
);

const ValueActive = ({ children }: { children?: React.ReactNode }) => (
  <span className={VALUE}>{children || "Ativo"}</span>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg px-3 py-1.5 w-full">
    <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const DetailsAnimalLayout = ({ animalKey }: DetailsAnimalLayoutProps) => {
  const { data: animal, loading: animalLoading } = useAnimalById(animalKey);
  const { data: animalVaccines, loading: vaccinesLoading } =
    useAnimalVaccines(undefined, animalKey);
  const { data: vaccines, loading: allVaccinesLoading } = useVaccines();
  const {
    actions: { deleteAnimalVaccine },
    loading: isDeleting,
  } = useDeleteAnimalVaccine();
  const isLoading = animalLoading || vaccinesLoading || allVaccinesLoading;
  const { data: farms } = useFarms();
  const getMonths = getAgeMonths(animal?.born_date);
  const { data: weights } = useAnimalWeights(undefined, animalKey);
  const { data: ceMetrics } = useAnimalCE(undefined, animalKey);
  const { data: reproductionEvents } = useReproductionEvents(undefined, animalKey);
  const { data: animalMovements = [] } = useMovementsByAnimal(
    animal?.animal_key || animalKey,
  );
  const salesQuery = useMemo<MangoQuery<Transaction>>(
    () => ({ selector: { _deleted: { $eq: false } } }),
    [],
  );
  const { data: sales = [] } = useLocalQuery<Transaction>(
    "transactions",
    salesQuery,
  );
  const childrenQuery = useMemo<MangoQuery<Animal>>(
    () => ({
      selector: {
        mother_rgn: { $eq: animal?.rgn || "__none__" },
        _deleted: { $eq: false },
      },
    }),
    [animal?.rgn],
  );
  const { data: potentialChildren = [] } = useLocalQuery<Animal>(
    "animals",
    childrenQuery,
  );

  const latestOffspringLabel = useMemo(() => {
    if (!animal || animal.sex !== "F" || !potentialChildren.length) return "";
    const motherSerie = normalizeAnimalRegistration(animal.serie_rgd || "");
    const matching = potentialChildren.filter((child) => {
      if (!child.mother_serie_rgd) return true;
      return normalizeAnimalRegistration(child.mother_serie_rgd) === motherSerie;
    });
    if (!matching.length) return "";
    const latest = [...matching].sort((a, b) => {
      const dateDiff = (b.born_date || "").localeCompare(a.born_date || "");
      if (dateDiff !== 0) return dateDiff;
      return (b.created_at || 0) - (a.created_at || 0);
    })[0];
    const baseLabel = `${latest.serie_rgd || "INDI"} ${latest.rgn}`.trim();
    return latest.sex ? `${baseLabel} - ${latest.sex}` : baseLabel;
  }, [animal, potentialChildren]);

  const latestReproductionEvent = useMemo(() => {
    if (!reproductionEvents?.length) return null;
    return [...reproductionEvents].sort((a, b) => {
      const dateDiff = (b.d0_date || "").localeCompare(a.d0_date || "");
      if (dateDiff !== 0) return dateDiff;
      return (b.created_at || 0) - (a.created_at || 0);
    })[0];
  }, [reproductionEvents]);

  const movementSummary = useMemo(() => {
    const labels: string[] = [];
    const addLabel = (label: string) => {
      if (!labels.includes(label)) labels.push(label);
    };

    for (const movement of animalMovements) {
      if (movement.type === "morte") {
        addLabel("Morto");
      } else if (movement.type === "venda") {
        const sale = sales.find(
          (s) =>
            (movement.details_id && s.id === movement.details_id) ||
            (animal?.animal_key && s.animal_key === animal.animal_key) ||
            (animal?.rgn && s.animal_rgn === animal.rgn),
        );
        addLabel(
          sale?.sale_type === "abate"
            ? "Vendido para abate"
            : "Vendido para reprodução",
        );
      } else if (movement.type === "compra") {
        addLabel("Comprado");
      } else if (movement.type === "troca") {
        addLabel("Trocado");
      }
    }

    return labels.join(", ");
  }, [animalMovements, sales, animal?.animal_key, animal?.rgn]);

  const [activeTab, setActiveTab] = useState("dados");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ReproductionEvent | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ReproductionEvent | null>(
    null,
  );

  const [vaccineToDelete, setVaccineToDelete] = useState<string | null>(null);

  const handleEditReproduction = (event: ReproductionEvent) => {
    setEventToEdit(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteReproduction = (eventId: string) => {
    const event = reproductionEvents.find((e) => e.event_id === eventId);
    if (event) {
      setEventToDelete(event);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteVaccine = async (vaccineId: string) => {
    try {
      await deleteAnimalVaccine(vaccineId);
      setVaccineToDelete(null);
    } catch (error) {
      console.error("Erro ao deletar vacina:", error);
    }
  };

  const weightData = (weights || []).map((w) => ({
    date: w.date,
    value: w.value,
  }));

  const ceData = (ceMetrics || []).map((ce) => ({
    date: ce.date,
    value: ce.value,
  }));

  const farmName = useMemo(() => {
    if (!animal?.farm_id) return "SEM DADO";
    const farm = farms?.find((f) => f.id === animal.farm_id);
    return farm ? farm.farm_name : "SEM DADO";
  }, [animal?.farm_id, farms]);

  const mother_name = `${animal?.mother_serie_rgd || ""} ${
    animal?.mother_rgn || ""
  }`.trim();

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  if (!animal) {
    return (
      <main>
        <ShortHeader title="Não encontrado" />
        <div className="p-4 text-center">
          <p>Animal não encontrado</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="flex-1 overflow-y-auto w-full">
        <div className="space-y-3 w-full">
          <div>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <StandardTabList
                tabs={[
                  { value: "dados", label: "Dados", icon: ClipboardList },
                  { value: "vaccines", label: "Vacinas", icon: Syringe },
                  {
                    value: "pesagem-ce-list",
                    label: "Medidas",
                    icon: RulerDimensionLine,
                  },
                  { value: "reproduction", label: "Reprodução", icon: VenusAndMars },
                  { value: "history", label: "Histórico", icon: History },
                  { value: "graphics", label: "Gráficos", icon: LineChart },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className="mb-1"
              />
              <TabsContent value="dados" className="mt-0 animate-in fade-in-0 duration-200 w-full">
                <div className="grid grid-cols-1 gap-y-1 w-full">
                  <Card title="Dados Básicos">
                    <Row label="Fazenda/Pasto">
                      <Val>{farmName}</Val>
                    </Row>
                    <Row label="Raça">
                      <Val>{animal.breed || "Nelore"}</Val>
                    </Row>
                    <Row label="Nascimento">
                      <Val>{formatDate(animal.born_date)}</Val>
                    </Row>
                    <Row label="Idade">
                      <Val>
                        {Math.floor(getMonths / 12)}{" "}
                        {Math.floor(getMonths / 12) === 1 ? "ano" : "anos"} e {getMonths % 12}{" "}
                        {getMonths % 12 === 1 ? "mês" : "meses"}
                      </Val>
                    </Row>
                    <Row label="Categoria">
                      <Val>{getAgeRange(getMonths)}</Val>
                    </Row>
                    <Row label="Sexo">
                      <Val>{animal.sex}</Val>
                    </Row>
                    {(animal.sex === "F" || Boolean(latestReproductionEvent)) && (
                      <>
                        <Row label="Tipo">
                          <Val>{latestReproductionEvent?.reproduction_role}</Val>
                        </Row>
                        <Row label="Status reprodutivo">
                          <Val>{latestReproductionEvent?.productive_status}</Val>
                        </Row>
                        <Row label="Diagnóstico final">
                          <Val>{latestReproductionEvent?.final_diagnostic}</Val>
                        </Row>
                        {animal.sex === "F" && (
                          <Row label="Filho atual">
                            <Val>{latestOffspringLabel}</Val>
                          </Row>
                        )}
                      </>
                    )}
                    <Row label="Genotipagem">
                      <Val>{animal.genotyping}</Val>
                    </Row>
                  </Card>

                  <Card title="Índices Genéticos">
                    <div className="grid grid-cols-2 gap-x-4">
                      <Row label="F%">
                        <Val>{animal.f}</Val>
                      </Row>
                      <Row label="P%">
                        <Val>{animal.p}</Val>
                      </Row>
                      <Row label="IABCZG">
                        <Val>{animal.iabcgz}</Val>
                      </Row>
                      <Row label="Deca">
                        <Val>{animal.deca}</Val>
                      </Row>
                    </div>
                  </Card>

                  <Card title="Genealogia">
                    <Row label="Pai">
                      <Val>{animal.father_name}</Val>
                    </Row>
                    <Row label="Mãe">
                      <Val>{mother_name}</Val>
                    </Row>
                    <Row label="Avô Materno">
                      <Val>{animal.maternal_grandfather_name}</Val>
                    </Row>
                    <Row label="Avô Paterno">
                      <Val>{animal.paternal_grandfather_name}</Val>
                    </Row>
                  </Card>

                  <Card title="Outras informações">
                    <Row label="Classe visual">
                      <Val>{animal.classification}</Val>
                    </Row>
                    <Row label="Status ABCZ">
                      <Val>{animal.status?.split(" / ").join(", ")}</Val>
                    </Row>
                    <Row label="Situação do animal">
                      <Val>{animal.document_situation?.split(" / ").join(", ")}</Val>
                    </Row>
                    <Row label="Sociedade">
                      <Val>{animal.partnership}</Val>
                    </Row>
                    <Row label="Movimentações">
                      <ValueActive>{movementSummary}</ValueActive>
                    </Row>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent
                value="vaccines"
                className="mt-0 animate-in fade-in-0 duration-200"
              >
                <div className="space-y-3">
                  {(() => {
                    const vaccineMap = new Map(
                      vaccines.map((v) => [v.id, v.vaccine_name]),
                    );

                    const vaccinesWithNames = animalVaccines
                      .map((av) => ({
                        ...av,
                        name: vaccineMap.get(av.vaccine_id),
                      }))
                      .filter((av) => av.name);

                    return vaccinesWithNames.length > 0 ? (
                      <div className="space-y-2">
                        {vaccinesWithNames.map((vaccine) => (
                          <div
                            key={vaccine.id}
                            className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <Syringe className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate uppercase">
                                  {vaccine.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Calendar className="w-3 h-3 text-primary" />
                                  <span className="text-xs text-primary">
                                    {vaccine.date
                                      ? formatDate(vaccine.date)
                                      : "Data não informada"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {vaccineToDelete === vaccine.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleDeleteVaccine(vaccine.id)
                                  }
                                  disabled={isDeleting}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                                >
                                  {isDeleting ? "..." : "Confirmar"}
                                </button>
                                <button
                                  onClick={() => setVaccineToDelete(null)}
                                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-primary text-xs font-medium rounded-md transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setVaccineToDelete(vaccine.id)}
                                className="shrink-0 p-2 rounded-md text-primary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                title="Excluir vacina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-card border border-border rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center">
                            <AlertCircle size={24} className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex flex-col gap-4 w-full">
                            <p className="text-sm font-medium text-foreground">
                              Nenhuma vacina registrada
                            </p>
                            <Link href={'/vacinas'}
                              className="bg-primary hover:bg-primary/80 transition-colors w-full px-4 py-4 rounded-md text-xs text-white font-bold uppercase cursor-pointer">
                              Adicionar vacinas
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </TabsContent>
              <TabsContent
                value="pesagem-ce-list"
                className="mt-0 animate-in fade-in-0 duration-200"
              >
                <div className="border-t border-border pt-3"></div>
                <Tabs defaultValue="weight" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-linear-to-r from-muted/50 to-muted/30 rounded-lg p-1 -mb-3 h-auto gap-1 shadow-sm">
                    <TabsTrigger
                      value="weight"
                      className="flex flex-col text-gray-500 items-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium transition-all duration-200"
                    >
                      <span className="uppercase">Pesagem</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="ce"
                      className="flex flex-col text-gray-500 items-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium transition-all duration-200"
                    >
                      <span className="uppercase">Per. Escrotal</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="weight"
                    className="mt-0 animate-in fade-in-0 duration-200"
                  >
                    <div className="space-y-3 w-full">
                      <DetailsWeightList
                        weightData={weightData}
                        gainDaily={[]}
                      />

                      {weightData.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 w-full">
                          <p className="text-gray-500 text-sm">
                            Nenhum peso registrado
                          </p>
                          <Link
                            className="w-full bg-primary text-center py-2.5 uppercase text-white text-sm font-semibold rounded-lg"
                            href="/pesagem-ce"
                          >
                            + Pesagem
                          </Link>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="ce"
                    className="mt-0 space-y-6 animate-in fade-in-0 duration-200"
                  >
                    <div className="space-y-3 w-full">
                      <DetailsCircunfList CEMedidos={ceMetrics} />

                      {ceMetrics.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 w-full">
                          <p className="text-gray-500 text-sm">
                            Nenhum peso registrado
                          </p>
                          <Link
                            className="w-full bg-primary text-center py-2.5 uppercase text-white text-sm font-semibold rounded-lg"
                            href="/pesagem-ce"
                          >
                            + Per. Escrotal
                          </Link>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              <TabsContent
                value="graphics"
                className="mt-0 animate-in fade-in-0 duration-200"
              >
                <div className="border-t border-border pt-3"></div>
                <Tabs defaultValue="graphic-weight" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-linear-to-r from-muted/50 to-muted/30 rounded-lg p-1 mb-3 h-auto gap-1 shadow-sm">
                    <TabsTrigger
                      value="graphic-weight"
                      className="flex flex-col text-gray-500 items-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
                    >
                      <span className="uppercase">Pesagem</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="graphic-ce"
                      className="flex flex-col text-gray-500 items-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
                    >
                      <span className="uppercase">Per. Escrotal</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="border-t border-border pt-3"></div>

                  <TabsContent
                    value="graphic-weight"
                    className="mt-0 space-y-6 animate-in fade-in-0 duration-200"
                  >
                    <ChartLineLabel
                      title="Pesos"
                      description="Evolução mensal"
                      data={weightData}
                      colorVar="--chart-1"
                    />
                  </TabsContent>

                  <TabsContent
                    value="graphic-ce"
                    className="mt-0 space-y-6 animate-in fade-in-0 duration-200"
                  >
                    <ChartLineLabel
                      title="Circunferência Escrotal"
                      description="Evolução mensal"
                      data={ceData}
                      colorVar="--chart-2"
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
              <TabsContent
                value="reproduction"
                className="mt-0 animate-in fade-in-0 duration-200"
              >
                {animal && reproductionEvents.length > 0 ? (
                  <div className="space-y-6">
                    {reproductionEvents.map((event) => (
                      <Accordion
                        key={event.event_id}
                        type="single"
                        collapsible
                        className="w-full"
                      >
                        <ReproductionEventCard
                          event={event}
                          matriz={animal}
                          onEdit={handleEditReproduction}
                          onDelete={handleDeleteReproduction}
                        />
                      </Accordion>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <p className="text-primary text-sm">
                      Nenhum evento de reprodução registrado
                    </p>
                    <Link
                      className="bg-primary text-primary-foreground text-center py-2.5 px-6 uppercase text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                      href="/reproducao"
                    >
                      + Novo Evento
                    </Link>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="history"
                className="mt-0 animate-in fade-in-0 duration-200"
              >
                <DetailsMovementList animalKey={animalKey} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {eventToEdit && (
        <EditReproductionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEventToEdit(null);
          }}
          event={eventToEdit}
        />
      )}

      {eventToDelete && (
        <DeleteReproductionModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setEventToDelete(null);
          }}
          event={eventToDelete}
        />
      )}
    </main>
  );
};

export default DetailsAnimalLayout;
