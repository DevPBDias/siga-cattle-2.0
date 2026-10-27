"use client";

import { useState, useMemo, useEffect } from "react";
import { StandardTabList } from "@/components/ui/StandardTabList";
import ShortHeader from "@/components/layout/ShortHeader";
import { useAnimalById } from "@/hooks/db/animals/useAnimalById";
import { useAnimalVaccines } from "@/hooks/db/animal_vaccines/useAnimalVaccines";
import { useVaccines } from "@/hooks/db/vaccines/useVaccines";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useDeleteAnimalVaccine } from "@/hooks/db/animal_vaccines/useDeleteAnimalVaccine";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { Animal } from "@/types/animal.type";
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
  Pencil,
  Save,
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
import { cn } from "@/lib/utils";
import { useReproductionEvents } from "@/hooks/db/reproduction_event/useReproductionEvents";
import { Accordion } from "@/components/ui/accordion";
import { EditReproductionModal } from "@/components/features/reproduction/modals/reproduction/EditReproductionModal";
import { DeleteReproductionModal } from "@/components/features/reproduction/modals/reproduction/DeleteReproductionModal";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { ReproductionEventCard } from "@/components/features/reproduction/ReproductionEventCard";

interface DetailsAnimalLayoutProps {
  rgn: string;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onSaveSuccess?: () => void;
}

const LABEL = "text-[10px] text-gray-500 uppercase";
const VALUE = "text-[12px] font-semibold text-primary uppercase text-right truncate";
const INPUT =
  "w-full max-w-[170px] rounded-md border border-input bg-[#f7faf6] px-2 py-1 text-right text-xs text-primary outline-none focus:border-field-green font-semibold";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 border-b border-border py-0.5 last:border-b-0">
    <span className={LABEL}>{label}</span>
    {children}
  </div>
);

const Val = ({ children }: { children?: React.ReactNode }) => (
  <span className={VALUE}>{children || "-"}</span>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg px-3 py-1.5 w-full">
    <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const DetailsAnimalLayout = ({
  rgn,
  isEditing: externalIsEditing,
  onToggleEdit,
  onSaveSuccess,
}: DetailsAnimalLayoutProps) => {
  const { role } = useUserAccess();
  const { data: animal, loading: animalLoading } = useAnimalById(rgn);
  const { data: animalVaccines, loading: vaccinesLoading } =
    useAnimalVaccines(rgn);
  const { data: vaccines, loading: allVaccinesLoading } = useVaccines();
  const {
    actions: { deleteAnimalVaccine },
    loading: isDeleting,
  } = useDeleteAnimalVaccine();
  const isLoading = animalLoading || vaccinesLoading || allVaccinesLoading;
  const { data: farms } = useFarms();
  const getMonths = getAgeMonths(animal?.born_date);
  const { data: weights, loading: weightsLoading } = useAnimalWeights(
    rgn ?? undefined,
  );
  const { data: ceMetrics, loading: ceLoading } = useAnimalCE(rgn ?? undefined);
  const { data: reproductionEvents, loading: reproductionLoading } =
    useReproductionEvents(rgn);

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

  const {
    actions: { updateAnimal },
    loading: isSavingAnimal,
  } = useUpdateAnimal();
  const [internalEditing, setInternalEditing] = useState(false);
  const editing =
    externalIsEditing !== undefined ? externalIsEditing : internalEditing;
  const setEditing = (val: boolean) => {
    setInternalEditing(val);
    if (onToggleEdit) onToggleEdit();
  };
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Animal>>({});

  useEffect(() => {
    if (animal) {
      setEditData({
        farm_id: animal.farm_id || "",
        breed: animal.breed || "Nelore",
        born_date: animal.born_date || "",
        sex: animal.sex || "F",
        type: animal.type,
        genotyping: animal.genotyping || "",
        f: animal.f || "",
        p: animal.p || "",
        iabcgz: animal.iabcgz || "",
        deca: animal.deca || "",
        father_name: animal.father_name || "",
        mother_rgn: animal.mother_rgn || "",
        mother_serie_rgd: animal.mother_serie_rgd || "INDI",
        maternal_grandfather_name: animal.maternal_grandfather_name || "",
        paternal_grandfather_name: animal.paternal_grandfather_name || "",
      });
    }
  }, [animal, editing]);

  type TextKey =
  | "genotyping" | "f" | "p" | "iabcgz" | "deca"
  | "father_name" | "maternal_grandfather_name" | "paternal_grandfather_name";

const onField =
  (key: keyof Animal) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditData((prev) => ({ ...prev, [key]: e.target.value }));

const textRow = (label: string, key: TextKey) => (
  <Row label={label}>
    {editing ? (
      <input
        aria-label={label}
        value={(editData[key] as string) || ""}
        onChange={onField(key)}
        className={INPUT}
      />
    ) : (
      <Val>{animal?.[key]}</Val>
    )}
  </Row>
);

const selectRow = (
  label: string,
  key: keyof Animal,
  options: { value: string; label: string }[],
  shown?: React.ReactNode,
) => (
  <Row label={label}>
    {editing ? (
      <select
        aria-label={label}
        value={(editData[key] as string) || ""}
        onChange={onField(key)}
        className={INPUT}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ) : (
      <Val>{shown}</Val>
    )}
  </Row>
);

  const handleSaveAnimal = async () => {
    if (!animal) return;
    setSaveError(null);
    try {
      await updateAnimal(animal.rgn, editData);
      setEditing(false);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("Erro ao atualizar dados do animal:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar os dados do animal.",
      );
    }
  };

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
    const farm = farms.find((f) => f.id === animal.farm_id);
    return farm ? farm.farm_name : "SEM DADO";
  }, [animal?.farm_id, farms]);

  const mother_name = `${animal?.mother_serie_rgd || ""} ${animal?.mother_rgn || ""
    }`;

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
                    {selectRow(
                      "Fazenda",
                      "farm_id",
                      [
                        { value: "", label: "Selecione..." },
                        ...(farms || []).map((f) => ({ value: f.id, label: f.farm_name })),
                      ],
                      farmName,
                    )}
                    {selectRow(
                      "Raça",
                      "breed",
                      [
                        { value: "Nelore", label: "Nelore" },
                        { value: "Nelore Mocha", label: "Nelore Mocha" },
                      ],
                      animal.breed || "Nelore",
                    )}
                    <Row label="Nascimento">
                      {editing ? (
                        <input
                          type="date"
                          aria-label="Nascimento"
                          value={editData.born_date || ""}
                          onChange={onField("born_date")}
                          className={INPUT}
                        />
                      ) : (
                        <Val>{formatDate(animal.born_date)}</Val>
                      )}
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
                    {selectRow(
                      "Sexo",
                      "sex",
                      [
                        { value: "F", label: "F" },
                        { value: "M", label: "M" },
                      ],
                      animal.sex,
                    )}
                    {(editing || (editData.sex || animal.sex) === "F") &&
                      selectRow(
                        "Tipo",
                        "type",
                        [
                          { value: "", label: "Não informado" },
                          { value: "Doadora", label: "Doadora" },
                          { value: "Reprodutora", label: "Reprodutora" },
                          { value: "Receptora FIV", label: "Receptora FIV" },
                        ],
                        animal.type,
                      )}
                    {textRow("Genotipagem", "genotyping")}
                  </Card>

                  <Card title="Índices Genéticos">
                    <div className="grid grid-cols-2 gap-x-4">
                      {textRow("F%", "f")}
                      {textRow("P%", "p")}
                      {textRow("IABCZG", "iabcgz")}
                      {textRow("Deca", "deca")}
                    </div>
                  </Card>

                  <Card title="Genealogia">
                    {textRow("Pai", "father_name")}
                    <Row label="Mãe">
                      {editing ? (
                        <div className="flex items-center gap-1 max-w-[170px]">
                          <input
                            aria-label="Série da Mãe"
                            value={editData.mother_serie_rgd || ""}
                            onChange={onField("mother_serie_rgd")}
                            placeholder="Série"
                            className={`${INPUT} w-16`}
                          />
                          <input
                            aria-label="RGN da Mãe"
                            value={editData.mother_rgn || ""}
                            onChange={onField("mother_rgn")}
                            placeholder="RGN"
                            className={`${INPUT} w-20`}
                          />
                        </div>
                      ) : (
                        <Val>{mother_name.trim()}</Val>
                      )}
                    </Row>
                    {textRow("Avô Materno", "maternal_grandfather_name")}
                    {textRow("Avô Paterno", "paternal_grandfather_name")}
                  </Card>

                  <Card title="Outras informações">
                    <Row label="Classe">
                      <Val>{animal.classification}</Val>
                    </Row>
                    <Row label="Status">
                      <Val>{animal.status?.split(" / ").join(", ")}</Val>
                    </Row>
                    <Row label="Situação">
                      <Val>{animal.document_situation?.split(" / ").join(", ")}</Val>
                    </Row>
                    <Row label="Sociedade">
                      <Val>{animal.partnership}</Val>
                    </Row>
                  </Card>

                  {role === "owner" && (
                    <div className="mt-2 space-y-2">
                      {saveError && (
                        <p role="alert" className="text-xs text-destructive text-center">
                          {saveError}
                        </p>
                      )}
                      <button
                        type="button"
                        className="flex min-h-[32px] w-full items-center justify-center gap-2 rounded-md bg-primary text-xs font-bold text-white transition-colors hover:bg-field-green disabled:opacity-60 cursor-pointer shadow-xs"
                        onClick={() => (editing ? void handleSaveAnimal() : setEditing(true))}
                        disabled={isSavingAnimal}
                      >
                        {isSavingAnimal ? (
                          "Salvando..."
                        ) : editing ? (
                          <><Save className="h-4 w-4" /> Salvar alterações</>
                        ) : (
                          <><Pencil className="h-4 w-4" /> Editar informações</>
                        )}
                      </button>
                      {editing && (
                        <button
                          type="button"
                          className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-xs font-bold text-primary hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => setEditing(false)}
                          disabled={isSavingAnimal}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}
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
                {reproductionEvents.length > 0 ? (
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
                          matriz={animal as any}
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
                <DetailsMovementList rgn={rgn} />
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
