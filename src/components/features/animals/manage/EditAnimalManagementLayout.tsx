"use client";

import { useState, useMemo, useEffect } from "react";
import { Animal } from "@/types/animal.type";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useCreateFarm } from "@/hooks/db/farms/useCreateFarm";
import { useDeleteFarm } from "@/hooks/db/farms/useDeleteFarm";
import {
  useSituations,
  useCreateSituation,
  useDeleteSituation,
} from "@/hooks/db/situations";
import {
  usePartnerships,
  useCreatePartnership,
  useDeletePartnership,
} from "@/hooks/db/partnerships";
import { ANIMAL_BREEDS } from "@/constants/animalVariations";
import { STATUS_ABCZ_OPTIONS } from "@/types/status.type";
import {
  formatDate,
  calculateAgeInMonths as getAgeMonths,
  getAgeRange,
  isFutureDate,
  toISODate,
} from "@/utils/dates";
import {
  formatPartnershipNames,
  parsePartnershipNames,
} from "@/utils/partnership";
import { ManageFarmsModal } from "@/components/features/farm/modals/farm/ManageFarmsModal";
import { ManagePartnershipsModal } from "@/components/features/animals/modals/sociedade/ManagePartnershipsModal";
import { ManageSituationsModal } from "@/components/features/animals/modals/situation/ManageSituationsModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Plus, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface EditAnimalManagementLayoutProps {
  animal: Animal;
  onSuccess?: () => void;
}

const LABEL = "text-[9.5px] text-gray-500 uppercase font-semibold leading-tight";
const INPUT =
  "w-full max-w-[155px] h-7 rounded-md border border-input bg-[#f7faf6] px-2 py-0.5 text-right text-[11px] text-primary outline-none focus:border-field-green font-semibold transition-colors";
const SELECT =
  "w-full max-w-[155px] h-7 rounded-md border border-input bg-[#f7faf6] px-2 py-0.5 text-right text-[11px] text-primary outline-none focus:border-field-green font-semibold transition-colors";
const ADD_BUTTON_CLASS =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer";

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-2 border-b border-border py-0.5 last:border-b-0 min-h-[30px]">
    <span className={LABEL}>{label}</span>
    {children}
  </div>
);

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 w-full shadow-xs">
    <h3 className="text-[9.5px] font-bold text-primary uppercase tracking-wider mb-0.5">
      {title}
    </h3>
    {children}
  </div>
);

const CLASSIFICATION_OPTIONS = ["-", "A", "B", "C", "D"];

export function EditAnimalManagementLayout({
  animal,
  onSuccess,
}: EditAnimalManagementLayoutProps) {
  const {
    actions: { updateAnimal },
    loading: isSaving,
  } = useUpdateAnimal();

  // Farms hooks
  const { data: farms = [], loading: farmsLoading } = useFarms();
  const {
    actions: { createFarm },
  } = useCreateFarm();
  const {
    actions: { deleteFarm },
  } = useDeleteFarm();

  // Partnerships hooks
  const { data: partnerships = [] } = usePartnerships();
  const {
    actions: { createPartnership },
  } = useCreatePartnership();
  const {
    actions: { deletePartnership },
  } = useDeletePartnership();

  // Situations hooks
  const { data: situations = [], loading: situationsLoading } = useSituations();
  const {
    actions: { createSituation },
  } = useCreateSituation();
  const {
    actions: { deleteSituation },
  } = useDeleteSituation();

  // Modais de Gerenciamento
  const [manageFarmsOpen, setManageFarmsOpen] = useState(false);
  const [managePartnershipsOpen, setManagePartnershipsOpen] = useState(false);
  const [manageSituationsOpen, setManageSituationsOpen] = useState(false);

  // Estados dos campos do formulário
  const [formData, setFormData] = useState({
    farm_id: "",
    breed: "Nelore",
    born_date: "",
    sex: "F",
    genotyping: "NÃO",
    f: "",
    p: "",
    iabcgz: "",
    deca: "",
    father_name: "",
    mother_serie_rgd: "INDI",
    mother_rgn: "",
    maternal_grandfather_name: "",
    paternal_grandfather_name: "",
    classification: "-",
  });

  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPartnerships, setSelectedPartnerships] = useState<string[]>(
    [],
  );
  const [selectedSituations, setSelectedSituations] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Inicializar com os dados do animal
  useEffect(() => {
    if (animal) {
      setFormData({
        farm_id: animal.farm_id || "",
        breed: animal.breed || "Nelore",
        born_date: toISODate(animal.born_date) || "",
        sex: animal.sex || "F",
        genotyping: animal.genotyping || "NÃO",
        f: animal.f || "",
        p: animal.p || "",
        iabcgz: animal.iabcgz || "",
        deca: animal.deca || "",
        father_name: animal.father_name || "",
        mother_serie_rgd: animal.mother_serie_rgd || "INDI",
        mother_rgn: animal.mother_rgn || "",
        maternal_grandfather_name: animal.maternal_grandfather_name || "",
        paternal_grandfather_name: animal.paternal_grandfather_name || "",
        classification: animal.classification || "-",
      });

      // Status ABCZ
      if (animal.status) {
        const parts = animal.status
          .split(" / ")
          .map((s) => s.trim())
          .filter((s) => s && s !== "-");
        setSelectedStatus(parts);
      } else {
        setSelectedStatus([]);
      }

      // Sociedade
      setSelectedPartnerships(
        parsePartnershipNames(
          animal.partnership,
          partnerships.map((p) => p.partner_name),
        ),
      );

      // Situação
      if (animal.document_situation) {
        const parts = animal.document_situation
          .split(" / ")
          .map((s) => s.trim())
          .filter((s) => s && s !== "-");
        setSelectedSituations(parts);
      } else {
        setSelectedSituations([]);
      }
    }
  }, [animal, partnerships]);

  const getMonths = getAgeMonths(formData.born_date);

  const handleFieldChange =
    (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const toggleStatus = (st: string) => {
    setSelectedStatus((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st],
    );
  };

  const togglePartnership = (name: string) => {
    setSelectedPartnerships((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const toggleSituation = (sit: string) => {
    setSelectedSituations((prev) =>
      prev.includes(sit) ? prev.filter((s) => s !== sit) : [...prev, sit],
    );
  };

  const handleSave = async () => {
    if (!animal) return;
    setSaveError(null);

    if (formData.born_date && isFutureDate(formData.born_date)) {
      setSaveError("A data de nascimento não pode ser no futuro.");
      return;
    }

    try {
      const partnershipString = formatPartnershipNames(selectedPartnerships);

      const statusString =
        selectedStatus.length > 0 ? selectedStatus.join(" / ") : "-";
      const situationString =
        selectedSituations.length > 0 ? selectedSituations.join(" / ") : "-";

      const payload: Partial<Animal> = {
        farm_id: formData.farm_id || undefined,
        breed: formData.breed,
        born_date: formData.born_date || undefined,
        sex: formData.sex,
        genotyping: formData.genotyping,
        f: formData.f,
        p: formData.p,
        iabcgz: formData.iabcgz,
        deca: formData.deca,
        father_name: formData.father_name,
        mother_serie_rgd: formData.mother_serie_rgd,
        mother_rgn: formData.mother_rgn,
        maternal_grandfather_name: formData.maternal_grandfather_name,
        paternal_grandfather_name: formData.paternal_grandfather_name,
        classification: formData.classification,
        status: statusString,
        partnership: partnershipString || "-",
        document_situation: situationString,
      };

      await updateAnimal(animal.animal_key || animal.rgn, payload);
      toast.success("Alterações salvas com sucesso!");
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao salvar dados do animal:", err);
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar alterações.";
      setSaveError(msg);
      toast.error(msg);
    }
  };

  return (
    <div
      className="space-y-2 w-full animate-in fade-in-50 duration-300"
      style={
        {
          "--control-height": "1.75rem",
          "--control-font-size": "0.75rem",
          "--action-min-height": "1.75rem",
        } as React.CSSProperties
      }
    >
      {/* Dados Básicos */}
      <Card title="Dados Básicos">
        <Row label="Fazenda / Pasto">
          <div className="flex items-center justify-end gap-1.5 flex-1 max-w-[190px]">
            <select
              value={formData.farm_id}
              onChange={handleFieldChange("farm_id")}
              className={SELECT}
              aria-label="Fazenda/Pasto"
            >
              <option value="">Selecione...</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farm_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setManageFarmsOpen(true)}
              title="Gerenciar Fazendas"
              aria-label="Gerenciar Fazendas"
              className={ADD_BUTTON_CLASS}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </Row>

        <Row label="Raça">
          <select
            value={formData.breed}
            onChange={handleFieldChange("breed")}
            className={SELECT}
            aria-label="Raça"
          >
            {ANIMAL_BREEDS.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Nascimento">
          <input
            type="date"
            value={formData.born_date}
            onChange={handleFieldChange("born_date")}
            className={INPUT}
            aria-label="Data de Nascimento"
          />
        </Row>

        <Row label="Idade">
          <span className="text-[12px] font-semibold text-primary uppercase text-right">
            {formData.born_date
              ? `${Math.floor(getMonths / 12)} ${
                  Math.floor(getMonths / 12) === 1 ? "ano" : "anos"
                } e ${getMonths % 12} ${getMonths % 12 === 1 ? "mês" : "meses"}`
              : "-"}
          </span>
        </Row>

        <Row label="Categoria">
          <span className="text-[12px] font-semibold text-primary uppercase text-right">
            {formData.born_date ? getAgeRange(getMonths) : "-"}
          </span>
        </Row>

        <Row label="Sexo">
          <select
            value={formData.sex}
            onChange={handleFieldChange("sex")}
            className={SELECT}
            aria-label="Sexo"
          >
            <option value="F">Fêmea</option>
            <option value="M">Macho</option>
          </select>
        </Row>

        <Row label="Genotipagem">
          <select
            value={formData.genotyping}
            onChange={handleFieldChange("genotyping")}
            className={SELECT}
            aria-label="Genotipagem"
          >
            <option value="NÃO">NÃO</option>
            <option value="SIM">SIM</option>
          </select>
        </Row>
      </Card>

      {/* Índices Genéticos */}
      <Card title="Índices Genéticos">
        <div className="grid grid-cols-2 gap-x-4">
          <Row label="F%">
            <input
              value={formData.f}
              onChange={handleFieldChange("f")}
              placeholder="F%"
              className={INPUT}
              aria-label="F%"
            />
          </Row>
          <Row label="P%">
            <input
              value={formData.p}
              onChange={handleFieldChange("p")}
              placeholder="P%"
              className={INPUT}
              aria-label="P%"
            />
          </Row>
          <Row label="IABCZG">
            <input
              value={formData.iabcgz}
              onChange={handleFieldChange("iabcgz")}
              placeholder="IABCZG"
              className={INPUT}
              aria-label="IABCZG"
            />
          </Row>
          <Row label="Deca">
            <input
              value={formData.deca}
              onChange={handleFieldChange("deca")}
              placeholder="Deca"
              className={INPUT}
              aria-label="Deca"
            />
          </Row>
        </div>
      </Card>

      {/* Genealogia */}
      <Card title="Genealogia">
        <Row label="Pai">
          <input
            value={formData.father_name}
            onChange={handleFieldChange("father_name")}
            placeholder="Nome do Pai"
            className={INPUT}
            aria-label="Pai"
          />
        </Row>
        <Row label="Mãe">
          <div className="flex items-center gap-1 max-w-[170px]">
            <input
              value={formData.mother_serie_rgd}
              onChange={handleFieldChange("mother_serie_rgd")}
              placeholder="Série"
              className={`${INPUT} w-16 text-center`}
              aria-label="Série da Mãe"
            />
            <input
              value={formData.mother_rgn}
              onChange={handleFieldChange("mother_rgn")}
              placeholder="RGN"
              className={`${INPUT} w-20 text-center`}
              aria-label="RGN da Mãe"
            />
          </div>
        </Row>
        <Row label="Avô Materno">
          <input
            value={formData.maternal_grandfather_name}
            onChange={handleFieldChange("maternal_grandfather_name")}
            placeholder="Avô Materno"
            className={INPUT}
            aria-label="Avô Materno"
          />
        </Row>
        <Row label="Avô Paterno">
          <input
            value={formData.paternal_grandfather_name}
            onChange={handleFieldChange("paternal_grandfather_name")}
            placeholder="Avô Paterno"
            className={INPUT}
            aria-label="Avô Paterno"
          />
        </Row>
      </Card>

      {/* Outras Informações */}
      <Card title="Outras Informações">
        <Row label="Classe visual">
          <select
            value={formData.classification}
            onChange={handleFieldChange("classification")}
            className={SELECT}
            aria-label="Classe visual"
          >
            {CLASSIFICATION_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === "-" ? "Nenhum (-)" : c}
              </option>
            ))}
          </select>
        </Row>

        {/* Status ABCZ Popup */}
        <Row label="Status ABCZ">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="max-w-[170px] truncate rounded-md border border-input bg-[#f7faf6] px-2 py-1 text-right text-xs text-primary font-semibold hover:border-field-green cursor-pointer"
                title={
                  selectedStatus.length
                    ? selectedStatus.join(", ")
                    : "Selecionar status"
                }
              >
                {selectedStatus.length
                  ? selectedStatus.join(", ")
                  : "Selecione..."}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-card" align="end">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase px-1 pb-1 border-b border-border">
                  Status ABCZ
                </p>
                {STATUS_ABCZ_OPTIONS.map((st) => {
                  const isChecked = selectedStatus.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleStatus(st)}
                      className="flex items-center justify-between w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-left cursor-pointer"
                    >
                      <span
                        className={
                          isChecked
                            ? "font-bold text-primary"
                            : "text-foreground"
                        }
                      >
                        {st}
                      </span>
                      {isChecked && (
                        <Check
                          className="h-3.5 w-3.5 text-primary"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </Row>

        {/* Sociedade Popup */}
        <Row label="Sociedade">
          <div className="flex items-center justify-end gap-1.5 flex-1 max-w-[190px]">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-7 max-w-[155px] truncate rounded-md border border-input bg-[#f7faf6] px-2 py-0.5 text-right text-[11px] text-primary font-semibold hover:border-field-green cursor-pointer"
                  title={
                    selectedPartnerships.length
                      ? selectedPartnerships.join(", ")
                      : "Selecionar sociedade"
                  }
                >
                  {selectedPartnerships.length
                    ? selectedPartnerships.join(", ")
                    : "Nenhuma (-)"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 bg-card" align="end">
                <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
                  <p className="text-[11px] font-bold text-gray-500 uppercase px-1 pb-1 border-b border-border">
                    Sócios Cadastrados
                  </p>
                  {partnerships.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">
                      Nenhum sócio cadastrado.
                    </p>
                  ) : (
                    partnerships.map((p) => {
                      const isChecked = selectedPartnerships.includes(
                        p.partner_name,
                      );
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePartnership(p.partner_name)}
                          className="flex items-center justify-between w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-left cursor-pointer"
                        >
                          <span
                            className={
                              isChecked
                                ? "font-bold text-primary"
                                : "text-foreground"
                            }
                          >
                            {p.partner_name}
                          </span>
                          {isChecked && (
                            <Check
                              className="h-3.5 w-3.5 text-primary"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={() => setManagePartnershipsOpen(true)}
              title="Gerenciar Sócios"
              aria-label="Gerenciar Sócios"
              className={ADD_BUTTON_CLASS}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </Row>

        {/* Situação do Animal Popup */}
        <Row label="Situação do animal">
          <div className="flex items-center justify-end gap-1.5 flex-1 max-w-[190px]">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-7 max-w-[155px] truncate rounded-md border border-input bg-[#f7faf6] px-2 py-0.5 text-right text-[11px] text-primary font-semibold hover:border-field-green cursor-pointer"
                  title={
                    selectedSituations.length
                      ? selectedSituations.join(", ")
                      : "Selecionar situação"
                  }
                >
                  {selectedSituations.length
                    ? selectedSituations.join(", ")
                    : "Nenhuma (-)"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-card" align="end">
                <div className="space-y-1 max-h-56 overflow-y-auto no-scrollbar">
                  <p className="text-[11px] font-bold text-gray-500 uppercase px-1 pb-1 border-b border-border">
                    Situações Cadastradas
                  </p>
                  {situations.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">
                      Nenhuma situação cadastrada.
                    </p>
                  ) : (
                    situations.map((sit) => {
                      const isChecked = selectedSituations.includes(
                        sit.situation_name,
                      );
                      return (
                        <button
                          key={sit.id}
                          type="button"
                          onClick={() => toggleSituation(sit.situation_name)}
                          className="flex items-center justify-between w-full px-2 py-1.5 text-xs rounded hover:bg-muted text-left cursor-pointer"
                        >
                          <span
                            className={
                              isChecked
                                ? "font-bold text-primary"
                                : "text-foreground"
                            }
                          >
                            {sit.situation_name}
                          </span>
                          {isChecked && (
                            <Check
                              className="h-3.5 w-3.5 text-primary"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={() => setManageSituationsOpen(true)}
              title="Gerenciar Situações"
              aria-label="Gerenciar Situações"
              className={ADD_BUTTON_CLASS}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </Row>
      </Card>

      {/* Botão de Salvar Alterações */}
      <div className="pt-2 pb-6 space-y-2">
        {saveError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive justify-center bg-destructive/10 p-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-bold text-white transition-colors hover:bg-field-green disabled:opacity-60 cursor-pointer shadow-sm active:scale-[0.99]"
        >
          {isSaving ? (
            "Salvando alterações..."
          ) : (
            <>
              <Save className="h-4 w-4" /> Salvar alterações
            </>
          )}
        </button>
      </div>

      {/* Modais de Gerenciamento */}
      <ManageFarmsModal
        open={manageFarmsOpen}
        farms={farms}
        onClose={() => setManageFarmsOpen(false)}
        onAdd={async (name: string) => {
          await createFarm({ farm_name: name });
          toast.success("Fazenda cadastrada com sucesso!");
        }}
        onDelete={async (id: string) => {
          await deleteFarm(id);
          if (formData.farm_id === id) {
            setFormData((prev) => ({ ...prev, farm_id: "" }));
          }
          toast.success("Fazenda excluída com sucesso.");
        }}
      />

      <ManagePartnershipsModal
        open={managePartnershipsOpen}
        partnerships={partnerships}
        onClose={() => setManagePartnershipsOpen(false)}
        onAdd={async (name: string) => {
          await createPartnership({ partner_name: name });
          toast.success("Sócio cadastrado com sucesso!");
        }}
        onDelete={async (id: string) => {
          const deleted = partnerships.find((p) => p.id === id);
          await deletePartnership(id);
          if (deleted) {
            setSelectedPartnerships((prev) =>
              prev.filter((name) => name !== deleted.partner_name),
            );
          }
          toast.success("Sócio excluído com sucesso.");
        }}
      />

      <ManageSituationsModal
        open={manageSituationsOpen}
        situations={situations}
        onClose={() => setManageSituationsOpen(false)}
        onAdd={async (name: string) => {
          await createSituation({ situation_name: name });
          toast.success("Situação cadastrada com sucesso!");
        }}
        onDelete={async (id: string) => {
          const deleted = situations.find((s) => s.id === id);
          await deleteSituation(id);
          if (deleted) {
            setSelectedSituations((prev) =>
              prev.filter((s) => s !== deleted.situation_name),
            );
          }
          toast.success("Situação excluída com sucesso.");
        }}
      />
    </div>
  );
}
