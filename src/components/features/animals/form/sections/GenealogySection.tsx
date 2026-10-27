"use client";

import { Input } from "@/components/ui/input";
import { FormRow, FormSection } from "@/components/ui/FormRow";

interface GenealogySectionProps {
  formData: any;
  setFormData: (data: any) => void;
  hideTitle?: boolean;
}

const FIELD_CLASS = "h-11 w-full border-0 bg-muted/40 text-sm";

export function GenealogySection({
  formData,
  setFormData,
  hideTitle = false,
}: GenealogySectionProps) {
  const content = (
    <>
      <FormRow label="Pai (Nome)" htmlFor="father-name">
        <Input
          id="father-name"
          value={formData.father_name}
          onChange={(e) =>
            setFormData({ ...formData, father_name: e.target.value })
          }
          placeholder="Nome do touro"
          className={FIELD_CLASS}
        />
      </FormRow>

      <FormRow label="Mãe (RGN)" htmlFor="mother-rgn">
        <Input
          id="mother-rgn"
          value={formData.mother_rgn}
          onChange={(e) =>
            setFormData({
              ...formData,
              mother_rgn: e.target.value.toUpperCase(),
            })
          }
          placeholder="RGN mãe"
          className={FIELD_CLASS}
        />
      </FormRow>

      <FormRow label="Mãe (Série)" htmlFor="mother-serie">
        <Input
          id="mother-serie"
          value={formData.mother_serie_rgd}
          onChange={(e) =>
            setFormData({
              ...formData,
              mother_serie_rgd: e.target.value.toUpperCase(),
            })
          }
          placeholder="Ex: INDI"
          className={FIELD_CLASS}
        />
      </FormRow>

      <FormRow label="Avô Paterno" htmlFor="paternal-grandfather">
        <Input
          id="paternal-grandfather"
          value={formData.paternal_grandfather_name}
          onChange={(e) =>
            setFormData({
              ...formData,
              paternal_grandfather_name: e.target.value,
            })
          }
          placeholder="Opcional"
          className={FIELD_CLASS}
        />
      </FormRow>

      <FormRow label="Avô Materno" htmlFor="maternal-grandfather">
        <Input
          id="maternal-grandfather"
          value={formData.maternal_grandfather_name}
          onChange={(e) =>
            setFormData({
              ...formData,
              maternal_grandfather_name: e.target.value,
            })
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

  return <FormSection title="Genealogia">{content}</FormSection>;
}
