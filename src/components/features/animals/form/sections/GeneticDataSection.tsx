"use client";

import { Input } from "@/components/ui/input";
import { FormRow, FormSection } from "@/components/ui/FormRow";

interface GeneticDataSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  hideTitle?: boolean;
}

const FIELD_CLASS = "h-11 w-full border-0 bg-muted/40 text-sm";

export function GeneticDataSection({
  formData,
  setFormData,
  hideTitle = false,
}: GeneticDataSectionProps) {
  const content = (
    <>
      <FormRow label="iABCZg" htmlFor="animal-iabcgz">
        <Input
          id="animal-iabcgz"
          value={formData.iabcgz}
          onChange={(e) =>
            setFormData({ ...formData, iabcgz: e.target.value })
          }
          placeholder="Opcional"
          className={FIELD_CLASS}
        />
      </FormRow>

      <FormRow label="DECA" htmlFor="animal-deca">
        <Input
          id="animal-deca"
          value={formData.deca}
          onChange={(e) =>
            setFormData({ ...formData, deca: e.target.value })
          }
          placeholder="Opcional"
          className={FIELD_CLASS}
        />
      </FormRow>
    </>
  );

  if (hideTitle) {
    return <div className="space-y-3">{content}</div>;
  }

  return <FormSection title="Dados Genéticos">{content}</FormSection>;
}
