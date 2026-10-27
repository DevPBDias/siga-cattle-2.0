"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormRow, FormSection } from "@/components/ui/FormRow";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useCreateDeath } from "@/hooks/db/deaths/useCreateDeath";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { PhotoPicker } from "./PhotoPicker";
import { CALF_MAX_MONTHS, DEATH_REASONS, NATIMORTO } from "@/utils/death.utils";
import { todayISO, isFutureDate, calculateAgeInMonths } from "@/utils/dates";
import { Death } from "@/types/death.type";

interface DeathFormProps {
  onSuccess?: () => void;
  movementMode?: boolean;
}

const FIELD_CLASS = "h-10 w-full border-0 bg-muted/40 text-sm";

const getDefaultFormData = () => ({
  rgn: "",
  date: todayISO(),
  reason: "",
  mother: "",
});

export function DeathForm({ onSuccess, movementMode = false }: DeathFormProps) {
  const [formData, setFormData] = useState(getDefaultFormData);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: animals = [] } = useAnimals();
  const {
    actions: { createDeath },
  } = useCreateDeath();
  const {
    actions: { createMovement },
  } = useMovements();

  const rgn = formData.rgn.trim();
  const animal = rgn
    ? animals.find((a) => a.rgn?.toLowerCase() === rgn.toLowerCase())
    : undefined;

  const ageMonths = animal?.born_date
    ? calculateAgeInMonths(animal.born_date)
    : null;
  const isCalf = ageMonths !== null && ageMonths < CALF_MAX_MONTHS;

  // Bezerro (ou natimorto) exige o RGN da mãe
  const showMother = isCalf || formData.reason === NATIMORTO;

  const rgnHint = animal
    ? `${animal.sex === "M" ? "Macho" : "Fêmea"}${ageMonths !== null ? ` · ${ageMonths} m` : ""
    }`
    : rgn
      ? "Não encontrado"
      : undefined;

  const setField = <K extends keyof ReturnType<typeof getDefaultFormData>>(
    field: K,
    value: string,
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleRgnChange = (value: string) => {
    const upper = value.toUpperCase();
    const found = animals.find(
      (a) => a.rgn?.toLowerCase() === upper.trim().toLowerCase(),
    );

    setFormData((prev) => ({
      ...prev,
      rgn: upper,
      // Se o animal já tem mãe cadastrada, sugere automaticamente
      mother: !prev.mother && found?.mother_rgn ? found.mother_rgn : prev.mother,
    }));
  };

  const resetForm = () => {
    setFormData(getDefaultFormData());
    setPhotos([]);
    setErrorMessage(null);
    setShowSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!rgn) {
      setErrorMessage("O RGN do animal é obrigatório.");
      return;
    }

    if (!formData.reason) {
      setErrorMessage("Selecione a causa da morte.");
      return;
    }

    if (showMother && !formData.mother.trim()) {
      setErrorMessage("O RGN da mãe é obrigatório para bezerros e natimortos.");
      return;
    }

    if (isFutureDate(formData.date)) {
      setErrorMessage("A data da morte não pode ser no futuro.");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const death: Partial<Death> = {
        animal_rgn: rgn,
        date: formData.date,
        reason: formData.reason,
        mother_name: showMother ? formData.mother.trim() : undefined,
        photos,
        photo_paths: [],
        created_at: now,
        updated_at: now,
        _deleted: false,
      };

      if (movementMode) {
        await createMovement({
          type: "morte",
          animal_id: rgn,
          date: formData.date,
          event_date: formData.date,
          details: {
            reason: formData.reason,
            mother_name: showMother ? formData.mother.trim() : undefined,
            photos,
          },
        });
      } else {
        await createDeath(death);
      }

      toast.success("Morte registrada com sucesso!");
      setShowSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao registrar morte:", error);
      setErrorMessage(error?.message || "Ocorreu um erro ao salvar os dados.");
      toast.error("Erro ao registrar morte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 animate-in fade-in duration-300">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
          <CheckCircle2 className="h-10 w-10 text-green-500" strokeWidth={2.5} />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-bold text-foreground">
            Morte Registrada!
          </h3>
          <p className="text-sm text-muted-foreground">
            O registro foi salvo e já aparece no histórico.
          </p>
        </div>
        <Button
          onClick={resetForm}
          className="h-14 w-full max-w-xs rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          Novo Registro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold uppercase text-primary">
          Nova Morte
        </h2>
        <p className="text-sm text-muted-foreground">
          Registre a morte de um animal.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-bold text-destructive">Erro</p>
            <p className="text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        <div className="space-y-3">
          <FormRow
            label="RGN do animal"
            htmlFor="death-rgn"
            hint={rgnHint}
            required
          >
            <Input
              id="death-rgn"
              value={formData.rgn}
              onChange={({ target }) => handleRgnChange(target.value)}
              autoComplete="off"
              spellCheck={false}
              className={`${FIELD_CLASS} placeholder:text-xs`}
              placeholder="Digite o RGN"
              required
            />
          </FormRow>

          <FormRow label="Data da morte" required>
            <DatePicker
              value={formData.date}
              onChange={(value) => setField("date", value)}
              required
            />
          </FormRow>

          <FormRow label="Causa da morte" htmlFor="death-reason" required>
            <Select
              value={formData.reason}
              onValueChange={(value) => setField("reason", value)}
            >
              <SelectTrigger id="death-reason" className={FIELD_CLASS}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {DEATH_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>

          {showMother && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <FormRow label="RGN da mãe" htmlFor="death-mother" required>
                <Input
                  id="death-mother"
                  value={formData.mother}
                  onChange={({ target }) =>
                    setField("mother", target.value.toUpperCase())
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className={`${FIELD_CLASS} placeholder:text-xs`}
                  placeholder="Identificação da mãe"
                  required
                />
              </FormRow>
            </div>
          )}
        </div>

        <FormSection title="Fotos do animal">
          <PhotoPicker
            photos={photos}
            onChange={setPhotos}
            labels={["Orelha esquerda", "Animal morto"]}
            disabled={isSubmitting}
          />
        </FormSection>

        <Button
          variant="default"
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full gap-2 bg-primary text-xs font-black uppercase tracking-wider shadow-md hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              Registrar Morte
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
