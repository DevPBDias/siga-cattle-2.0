"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Loader2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useCreateAnimal } from "@/hooks/db/animals/useCreateAnimal";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useCreateAnimalWeight } from "@/hooks/db/animal_weights/useCreateAnimalWeight";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import { getSupabase } from "@/lib/supabase/client";
import { Animal } from "@/types/animal.type";
import { toast } from "sonner";
import { FormRow } from "@/components/ui/FormRow";
import { todayISO, isFutureDate } from "@/utils/dates";

interface BirthFormProps {
  onSuccess?: () => void;
}

const getDefaultFormData = () => ({
  rgn: "",
  data: todayISO(),
  peso: "",
  mae: "",
  farmId: "",
  cor: "Branco",
  sexo: "",
});

const SEX_OPTIONS = ["Macho", "Fêmea"] as const;
const COLOR_OPTIONS = ["Branco", "Vermelho", "Chuveirado"] as const;

const FIELD_CLASS = "h-10 w-full border-0 bg-muted/40 text-sm";

export function BirthForm({ onSuccess }: BirthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState(getDefaultFormData);

  const { role } = useUserAccess();
  const { data: userProfile } = useUserProfile();

  const {
    actions: { createAnimal },
  } = useCreateAnimal();
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();
  const {
    actions: { createAnimalWeight: createWeight },
  } = useCreateAnimalWeight();
  const {
    actions: { createMovement },
  } = useMovements();

  const { data: animals = [] } = useAnimals();
  const { data: farms = [], loading: farmsLoading } = useFarms();

  // Se o usuário for membro, vincula à fazenda do perfil
  const memberFarm = useMemo(() => {
    if (role !== "member" || !userProfile?.farm_name) return null;
    const cleanProfileFarm = userProfile.farm_name.trim().toLowerCase();
    return (
      farms.find((f) => f.farm_name.trim().toLowerCase() === cleanProfileFarm) ??
      null
    );
  }, [role, userProfile?.farm_name, farms]);

  // Se o usuário for membro e tiver fazenda vinculada, pré-seleciona
  useEffect(() => {
    if (memberFarm && (!formData.farmId || formData.farmId !== memberFarm.id)) {
      setFormData((prev) => ({ ...prev, farmId: memberFarm.id }));
    }
  }, [memberFarm, formData.farmId]);

  const setField = <K extends keyof ReturnType<typeof getDefaultFormData>>(
    field: K,
    value: ReturnType<typeof getDefaultFormData>[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setFormData({
      ...getDefaultFormData(),
      farmId: memberFarm ? memberFarm.id : "",
    });
    setErrorMessage(null);
    setShowSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (formData.rgn.length > 10) {
      setErrorMessage("O RGN deve ter no máximo 10 caracteres.");
      return;
    }

    if (isFutureDate(formData.data)) {
      setErrorMessage("A data de nascimento não pode ser no futuro.");
      return;
    }

    if (!formData.mae) {
      setErrorMessage("O RGN da mãe é obrigatório.");
      return;
    }

    if (!formData.sexo) {
      setErrorMessage("O sexo é obrigatório.");
      return;
    }

    const effectiveFarmId = memberFarm ? memberFarm.id : formData.farmId;
    if (!effectiveFarmId) {
      setErrorMessage("A fazenda onde o bezerro nasceu é obrigatória.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Localizar a mãe para herdar fazenda e atualizar status
      const mother = animals.find((a) => a.rgn === formData.mae);

      // Gerar RGN temporário se estiver em branco: N<RGN da mãe>
      let finalRgn = formData.rgn;
      if (!finalRgn) finalRgn = `N${formData.mae}`;

      const timestamp = Date.now();
      const newAnimal: Partial<Animal> = {
        serie_rgd: "INDI",
        rgn: finalRgn,
        sex: formData.sexo === "Macho" ? "M" : "F",
        born_date: formData.data,
        born_color: formData.cor,
        mother_rgn: formData.mae,
        mother_serie_rgd: "INDI",
        status: "Ativo",
        animal_state: "ATIVO",
        farm_id: effectiveFarmId,
        breed: "Nelore",
        created_at: timestamp,
        updated_at: timestamp,
        _deleted: false,
      };

      // 1. Criar o animal na tabela de animais
      await createAnimal(newAnimal);

      // 2. Criar a movimentação do tipo 'nascimento' com created_by do usuário
      await createMovement({
        type: "nascimento",
        animal_id: finalRgn,
        date: formData.data,
        event_date: formData.data,
        details: {},
      });

      // 3. Adicionar registro de métrica de peso se informado
      const weightValue = formData.peso
        ? Number(formData.peso.replace(",", "."))
        : null;

      if (weightValue !== null && !isNaN(weightValue) && weightValue > 0) {
        await createWeight({
          rgn: finalRgn,
          value: weightValue,
          born_metric: true,
          date: formData.data,
        } as any);
      }

      // 4. Atualizar mãe se ela existir no rebanho
      if (mother) {
        await updateAnimal(mother.rgn, {
          condition: "Parida",
          parturition_from: {
            baby_sex: (formData.sexo === "Macho" ? "M" : "F") as any,
            baby_rgn: finalRgn,
          },
          updated_at: timestamp,
        });
      }

      // 5. Tentar execução transacional no Supabase via RPC register_birth
      try {
        const supabase = getSupabase();
        const { error: rpcError } = await supabase.rpc("register_birth", {
          p_rgn: finalRgn,
          p_serie_rgd: "INDI",
          p_sex: formData.sexo === "Macho" ? "M" : "F",
          p_born_date: formData.data,
          p_born_color: formData.cor,
          p_mother_rgn: formData.mae,
          p_mother_serie_rgd: "INDI",
          p_farm_id: effectiveFarmId,
          p_breed: "Nelore",
          p_weight: weightValue,
          p_created_by: userProfile?.id ?? null,
        });

        if (rpcError) {
          console.warn("[BirthForm] Supabase RPC register_birth log:", rpcError);
        }
      } catch (rpcErr) {
        console.warn("[BirthForm] RPC offline ou indisponível:", rpcErr);
      }

      toast.success("Nascimento registrado com sucesso!");
      setShowSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar nascimento:", error);
      setErrorMessage(error?.message || "Ocorreu um erro ao salvar os dados.");
      toast.error("Erro ao registrar nascimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2
            className="w-10 h-10 text-field-green"
            strokeWidth={2.5}
          />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-foreground text-2xl font-bold">
            Nascimento Registrado!
          </h3>
          <p className="text-muted-foreground text-sm">
            O novo animal e sua movimentação foram criados com sucesso no
            rebanho.
          </p>
        </div>
        <Button
          onClick={resetForm}
          className="h-12 w-full max-w-xs rounded-xl font-bold shadow-md bg-primary text-white hover:bg-field-green"
        >
          Novo Nascimento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-primary uppercase">
          Novo Nascimento
        </h2>
        <p className="text-muted-foreground text-sm">
          Registre o nascimento de um novo animal e sua movimentação.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-destructive">Erro</p>
            <p className="text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
        <FormRow label="Sexo do animal" htmlFor="birth-sex" required>
          <Select
            value={formData.sexo}
            onValueChange={(value) => setField("sexo", value)}
          >
            <SelectTrigger id="birth-sex" className={FIELD_CLASS}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {SEX_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        {formData.sexo && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <FormRow label="RGN (Bezerro)" htmlFor="baby-rgn-input">
              <Input
                id="baby-rgn-input"
                name="babyRgn"
                value={formData.rgn}
                maxLength={10}
                onChange={({ target }) =>
                  setField("rgn", target.value.toUpperCase())
                }
                autoComplete="off"
                spellCheck={false}
                className={`${FIELD_CLASS} placeholder:text-xs`}
                placeholder="Em branco = automático"
              />
            </FormRow>

            <FormRow label="Data" required>
              <DatePicker
                value={formData.data}
                onChange={(value) => setField("data", value)}
                required
              />
            </FormRow>

            <FormRow label="Peso (kg)" htmlFor="birth-weight-input">
              <Input
                id="birth-weight-input"
                name="birthWeight"
                type="text"
                inputMode="decimal"
                value={formData.peso}
                onChange={({ target }) => setField("peso", target.value)}
                autoComplete="off"
                spellCheck={false}
                className={`${FIELD_CLASS} placeholder:text-xs`}
                placeholder="00.0"
              />
            </FormRow>

            <FormRow label="RGN da mãe" htmlFor="mother-rgn-input" required>
              <Input
                id="mother-rgn-input"
                name="motherRgn"
                value={formData.mae}
                maxLength={10}
                onChange={({ target }) =>
                  setField("mae", target.value.toUpperCase())
                }
                autoComplete="off"
                spellCheck={false}
                className={`${FIELD_CLASS} placeholder:text-xs`}
                placeholder="Identificação da mãe"
                required
              />
            </FormRow>

            <FormRow label="Fazenda do nascimento" htmlFor="birth-farm" required>
              {role === "member" && memberFarm ? (
                <div
                  id="birth-farm"
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold text-primary"
                >
                  <span>{memberFarm.farm_name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    Vinculada
                  </span>
                </div>
              ) : (
                <Select
                  value={formData.farmId}
                  onValueChange={(value) => setField("farmId", value)}
                >
                  <SelectTrigger id="birth-farm" className={FIELD_CLASS}>
                    <SelectValue
                      placeholder={
                        farmsLoading ? "Carregando..." : "Selecione a fazenda"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.farm_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!farmsLoading && farms.length === 0 && !memberFarm && (
                <p className="mt-1 text-[10px] text-destructive">
                  Cadastre uma fazenda antes de registrar o nascimento.
                </p>
              )}
            </FormRow>

            <FormRow label="Pelagem / Cor" htmlFor="birth-color">
              <Select
                value={formData.cor}
                onValueChange={(value) => setField("cor", value)}
              >
                <SelectTrigger id="birth-color" className={FIELD_CLASS}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            <Button
              variant="default"
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex h-11 w-full gap-2 bg-primary text-xs font-black uppercase tracking-wider shadow-md hover:bg-field-green"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  Cadastrar Nascimento
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
