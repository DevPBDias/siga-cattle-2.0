"use client";

import { AlertTriangle } from "lucide-react";
import { FormRow, FormSection } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/input";
import { ProfileFarmValues } from "@/types/user_profile.type";

const FARM_FIELDS: { key: keyof ProfileFarmValues; label: string }[] = [
  { key: "farm_name", label: "Nome fazenda" },
  { key: "farm_state_registration", label: "Inscrição estadual" },
  { key: "farm_address", label: "Endereço fazenda" },
  { key: "farm_city", label: "Município" },
  { key: "farm_car_number", label: "Número do CAR" },
  { key: "farm_sigcar", label: "SIGCAR" },
  { key: "farm_nirb", label: "NIRB" },
  { key: "farm_ccir", label: "CCIR" },
];

interface ProfileFarmFormProps {
  values: ProfileFarmValues;
  editing: boolean;
  error: string | null;
  onChange: (field: keyof ProfileFarmValues, value: string) => void;
}

export function ProfileFarmForm({
  values,
  editing,
  error,
  onChange,
}: ProfileFarmFormProps) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      {error && (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <FormSection title="Dados da fazenda">
        {FARM_FIELDS.map(({ key, label }) => (
          <FormRow key={key} label={label} htmlFor={`profile-farm-${key}`}>
            <Input
              id={`profile-farm-${key}`}
              aria-label={label}
              value={values[key]}
              disabled={!editing}
              placeholder="Não informado"
              onChange={(event) => onChange(key, event.target.value)}
            />
          </FormRow>
        ))}
      </FormSection>
    </section>
  );
}
