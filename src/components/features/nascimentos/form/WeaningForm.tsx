"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { useAnimalWeights } from "@/hooks/db/animal_weights/useAnimalWeights";
import { useCreateAnimalWeight } from "@/hooks/db/animal_weights/useCreateAnimalWeight";
import { useCreateWeaningRecord } from "@/hooks/db/weaning_records/useCreateWeaningRecord";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { RgnOption } from "@/components/features/animals/RgnAutocomplete";
import { RgnSearchField } from "@/components/features/animals/manage/RgnSearchField";
import { SelectedEntityCard } from "@/components/shared/SelectedEntityCard";
import { Animal } from "@/types/animal.type";
import { getAnimalKeyFromReference } from "@/utils/animalIdentity";
import { CalfVisualClass } from "@/types/weaning_record.type";
import {
  compareDates,
  diffInDays,
  isFutureDate,
  todayISO,
} from "@/utils/dates";
import {
  calculateAdjustedWeight210,
  calculateMaternalEfficiencyPercent,
} from "@/utils/weaning";

const FIELD_CLASS = "h-10 w-full border-0 bg-muted/40 text-sm";
const VISUAL_CLASSES: CalfVisualClass[] = ["A", "B", "C", "D"];
const parseWeight = (value: string): number | null => {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const findMother = (calf: Animal, animals: Animal[]): Animal | undefined => {
  const rgn = calf.mother_rgn?.trim().toUpperCase();
  const series = calf.mother_serie_rgd?.trim().toUpperCase();
  if (!rgn) return undefined;
  const matches = animals.filter(
    (animal) =>
      animal.rgn.trim().toUpperCase() === rgn &&
      (!series || animal.serie_rgd.trim().toUpperCase() === series),
  );
  return matches.length === 1 ? matches[0] : undefined;
};

const formatWeight = (value: number | null): string =>
  value === null
    ? "Preencha os pesos e a data para calcular"
    : `${new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)} kg`;

export function WeaningForm() {
  const {
    data: animals = [],
    loading: animalsLoading,
    error: animalsError,
  } = useAnimals();
  const { data: farms = [] } = useFarms();
  const { data: weights = [] } = useAnimalWeights();
  const {
    actions: { createAnimalWeight },
  } = useCreateAnimalWeight();
  const {
    actions: { createWeaningRecord },
  } = useCreateWeaningRecord();
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();

  const [selectedAnimalKey, setSelectedAnimalKey] = useState("");
  const [weaningDate, setWeaningDate] = useState(todayISO());
  const [calfWeightInput, setCalfWeightInput] = useState("");
  const [motherWeightInput, setMotherWeightInput] = useState("");
  const [visualClass, setVisualClass] = useState<CalfVisualClass | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const rgnOptions = useMemo(
    () =>
      animals
        .map(
          (animal): RgnOption => ({
            label: `${animal.serie_rgd || "INDI"} ${animal.rgn}`,
            value: getAnimalKeyFromReference(animal),
          }),
        )
        .filter((option) => option.value),
    [animals],
  );
  const selectedAnimal = animals.find(
    (animal) => getAnimalKeyFromReference(animal) === selectedAnimalKey,
  );
  const mother = selectedAnimal
    ? findMother(selectedAnimal, animals)
    : undefined;
  const farmName = farms.find(
    (farm) => farm.id === selectedAnimal?.farm_id,
  )?.farm_name;
  const matchingWeights = useMemo(() => {
    if (!selectedAnimal) return [];
    return weights.filter(
      (weight) =>
        weight.metric_type === "weight" &&
        !weight._deleted &&
        (weight.animal_key
          ? weight.animal_key === selectedAnimal.animal_key
          : weight.rgn.trim().toUpperCase() ===
            selectedAnimal.rgn.trim().toUpperCase()),
    );
  }, [selectedAnimal, weights]);
  const birthWeight =
    matchingWeights.find((weight) => weight.born_metric && weight.value > 0)
      ?.value ?? null;
  const calfWeight = parseWeight(calfWeightInput);
  const motherWeight = parseWeight(motherWeightInput);
  const ageDays =
    selectedAnimal?.born_date &&
    compareDates(weaningDate, selectedAnimal.born_date) > 0
      ? diffInDays(weaningDate, selectedAnimal.born_date)
      : 0;
  const adjustedWeight =
    birthWeight !== null && calfWeight !== null && ageDays > 0
      ? calculateAdjustedWeight210(birthWeight, calfWeight, ageDays)
      : null;
  const efficiency =
    adjustedWeight !== null && motherWeight !== null
      ? calculateMaternalEfficiencyPercent(adjustedWeight, motherWeight)
      : null;

  const resetForm = () => {
    setSelectedAnimalKey("");
    setWeaningDate(todayISO());
    setCalfWeightInput("");
    setMotherWeightInput("");
    setVisualClass("");
    setErrorMessage(null);
    setShowSuccess(false);
  };

  const selectAnimal = (animalKey: string) => {
    const animal = animals.find(
      (candidate) => getAnimalKeyFromReference(candidate) === animalKey,
    );
    if (!animal) return;
    setSelectedAnimalKey(getAnimalKeyFromReference(animal));
    setWeaningDate(todayISO());
    setCalfWeightInput("");
    setMotherWeightInput("");
    setVisualClass("");
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!selectedAnimal) {
      setErrorMessage("Busque e selecione o bezerro.");
      return;
    }
    const animalKey = getAnimalKeyFromReference(selectedAnimal);
    if (!animalKey) {
      setErrorMessage("Nao foi possivel identificar a chave deste animal.");
      return;
    }
    if (
      selectedAnimal.animal_state?.toUpperCase() === "MORTO" ||
      selectedAnimal.status?.toLowerCase() === "morto"
    ) {
      setErrorMessage("Animais mortos nao podem receber registro de desmama.");
      return;
    }
    if (!selectedAnimal.born_date) {
      setErrorMessage("Este animal esta sem data de nascimento cadastrada.");
      return;
    }
    if (!selectedAnimal.mother_rgn) {
      setErrorMessage("Este animal esta sem RGN da mae cadastrado.");
      return;
    }
    if (!birthWeight) {
      setErrorMessage(
        "O bezerro não tem peso ao nascer cadastrado. Registre essa pesagem antes da desmama.",
      );
      return;
    }
    if (
      isFutureDate(weaningDate) ||
      compareDates(weaningDate, selectedAnimal.born_date) <= 0
    ) {
      setErrorMessage(
        "Informe uma data de desmama posterior ao nascimento e que não seja futura.",
      );
      return;
    }
    if (
      !calfWeight ||
      !motherWeight ||
      !visualClass ||
      !efficiency ||
      !adjustedWeight
    ) {
      setErrorMessage(
        "Informe o peso do bezerro, a classe visual e o peso da mãe.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnimalWeight({
        animal_key: animalKey,
        rgn: selectedAnimal.rgn,
        value: calfWeight,
        born_metric: false,
        date: weaningDate,
      });
      await createAnimalWeight({
        animal_key: mother?.animal_key,
        rgn: selectedAnimal.mother_rgn,
        value: motherWeight,
        born_metric: false,
        date: weaningDate,
      });
      await createWeaningRecord({
        animal_key: animalKey,
        animal_rgn: selectedAnimal.rgn,
        mother_animal_key: mother?.animal_key,
        mother_rgn: selectedAnimal.mother_rgn,
        farm_id: selectedAnimal.farm_id,
        born_date: selectedAnimal.born_date,
        weaning_date: weaningDate,
        age_days: ageDays,
        birth_weight_kg: birthWeight,
        calf_weight_kg: calfWeight,
        mother_weight_kg: motherWeight,
        adjusted_weight_210_kg: adjustedWeight,
        efficiency_percent: efficiency,
        visual_class: visualClass,
      });
      await updateAnimal(animalKey, {
        classification: visualClass,
        updated_at: Date.now(),
      });
      toast.success("Desmama registrada com sucesso!");
      setShowSuccess(true);
    } catch (error) {
      console.error("Erro ao registrar desmama:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os dados da desmama.";
      setErrorMessage(message);
      toast.error("Erro ao registrar desmama.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <CheckCircle2 className="h-14 w-14 text-field-green" />
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-bold text-primary">
            Desmama registrada!
          </h3>
          <p className="text-sm text-muted-foreground">
            Pesos, peso ajustado e eficiência da matriz foram salvos.
          </p>
        </div>
        <Button onClick={resetForm} className="w-full max-w-xs">
          Nova desmama
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold uppercase text-primary">Desmama</h2>
        <p className="text-sm text-muted-foreground">
          Selecione o bezerro e registre os dados da desmama.
        </p>
      </div>
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}
      {animalsError && (
        <p className="text-xs text-destructive">
          Nao foi possivel carregar os animais. Tente novamente.
        </p>
      )}

      {!selectedAnimal ? (
        <RgnSearchField
          label="Buscar bezerro (RGN):"
          options={rgnOptions}
          value={selectedAnimalKey}
          onSelect={selectAnimal}
          placeholder={
            animalsLoading
              ? "Carregando animais..."
              : "Digite o RGN do bezerro..."
          }
          requireSearchTerm
          emptyMessage={
            animalsLoading
              ? "Carregando animais..."
              : "Animal nao encontrado. Verifique o RGN informado."
          }
        />
      ) : (
        <>
          <SelectedEntityCard
            caption="Bezerro selecionado"
            title={`${selectedAnimal.serie_rgd || "INDI"} ${selectedAnimal.rgn}`}
            onClear={() => setSelectedAnimalKey("")}
            clearLabel="Trocar bezerro"
          />
          {!birthWeight && (
            <p className="rounded-lg bg-amber/10 p-3 text-xs text-amber">
              Este animal não tem peso ao nascer registrado. Cadastre a pesagem
              ao nascer para habilitar o cálculo aos 210 dias.
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            autoComplete="off"
          >
            <FormRow label="Fazenda do nascimento">
              <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm text-muted-foreground">
                {farmName || "Sem fazenda vinculada"}
              </div>
            </FormRow>
            <FormRow label="Data da desmama" htmlFor="weaning-date" required>
              <DatePicker
                id="weaning-date"
                value={weaningDate}
                onChange={setWeaningDate}
              />
            </FormRow>
            <FormRow label="RGN (Bezerro)">
              <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm text-muted-foreground">
                {selectedAnimal.rgn}
              </div>
            </FormRow>
            <FormRow label="Raça">
              <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm text-muted-foreground">
                {selectedAnimal.breed || "—"}
              </div>
            </FormRow>
            <FormRow label="Sexo do animal">
              <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm text-muted-foreground">
                {selectedAnimal.sex === "M"
                  ? "Macho"
                  : selectedAnimal.sex === "F"
                    ? "Fêmea"
                    : "—"}
              </div>
            </FormRow>
            <FormRow
              label="Peso bezerro (kg)"
              htmlFor="weaning-calf-weight"
              required
            >
              <Input
                id="weaning-calf-weight"
                inputMode="decimal"
                value={calfWeightInput}
                onChange={(event) => setCalfWeightInput(event.target.value)}
                placeholder="00,0"
                className={FIELD_CLASS}
                required
              />
            </FormRow>
            <FormRow label="Peso ajustado 210 dias (kg)">
              <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm font-semibold text-primary">
                {formatWeight(adjustedWeight)}
              </div>
            </FormRow>
            <FormRow
              label="Classificação visual bezerro"
              htmlFor="weaning-visual-class"
              required
            >
              <Select
                value={visualClass}
                onValueChange={(value) =>
                  setVisualClass(value as CalfVisualClass)
                }
              >
                <SelectTrigger
                  id="weaning-visual-class"
                  className={FIELD_CLASS}
                >
                  <SelectValue placeholder="Selecione A, B, C ou D" />
                </SelectTrigger>
                <SelectContent>
                  {VISUAL_CLASSES.map((classification) => (
                    <SelectItem key={classification} value={classification}>
                      {classification}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label="RGN mãe">
              <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm text-muted-foreground">
                {selectedAnimal.mother_rgn}
              </div>
            </FormRow>
            <FormRow
              label="Peso da mãe (kg)"
              htmlFor="weaning-mother-weight"
              required
            >
              <Input
                id="weaning-mother-weight"
                inputMode="decimal"
                value={motherWeightInput}
                onChange={(event) => setMotherWeightInput(event.target.value)}
                placeholder="00,0"
                className={FIELD_CLASS}
                required
              />
            </FormRow>
            <FormRow label="Eficiência matriz (%)">
              <div className="flex h-10 items-center rounded-md bg-muted/40 px-3 text-sm font-semibold text-primary">
                {efficiency === null
                  ? "Calculada pelos pesos"
                  : `${efficiency}%`}
              </div>
            </FormRow>
            <Button
              type="submit"
              disabled={isSubmitting || !birthWeight}
              className="w-full gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Salvando..." : "Salvar desmama"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
