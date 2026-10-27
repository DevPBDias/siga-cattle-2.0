"use client";

import { AlertTriangle } from "lucide-react";
import { FormRow, FormSection } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileUserValues } from "@/types/user_profile.type";

const USER_FIELDS: { key: keyof ProfileUserValues; label: string }[] = [
  { key: "full_name", label: "Nome usuário" },
  { key: "cpf", label: "CPF" },
  { key: "phone", label: "Telefone com DDD" },
  { key: "email", label: "E-mail" },
  { key: "residential_address", label: "Endereço residencial" },
];

interface ProfileUserFormProps {
  values: ProfileUserValues;
  editing: boolean;
  loading: boolean;
  error: string | null;
  onChange: (field: keyof ProfileUserValues, value: string) => void;
}

export function ProfileUserForm({
  values,
  editing,
  loading,
  error,
  onChange,
}: ProfileUserFormProps) {
  if (loading) {
    return (
      <section className="space-y-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-full rounded-md" />
        ))}
      </section>
    );
  }

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
      <FormSection title="Informações do usuário">
        {USER_FIELDS.map(({ key, label }) => (
          <FormRow key={key} label={label} htmlFor={`profile-user-${key}`}>
            <Input
              id={`profile-user-${key}`}
              aria-label={label}
              value={values[key]}
              disabled={!editing}
              onChange={(event) => onChange(key, event.target.value)}
            />
          </FormRow>
        ))}
      </FormSection>
    </section>
  );
}
