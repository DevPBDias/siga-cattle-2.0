"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { FormRow, FormSection } from "@/components/ui/FormRow";

interface BasicInfoSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  isEditMode: boolean;
  initialSex?: string;
}

const FIELD_CLASS = "h-11 w-full border-0 bg-muted/40 text-sm";

export function BasicInfoSection({
  formData,
  setFormData,
  isEditMode,
  initialSex,
}: BasicInfoSectionProps) {
  return (
    <FormSection title="Dados Básicos">
      {/* RGN */}
      <FormRow
        label="RGN"
        htmlFor="animal-rgn"
        required
        hint={
          isEditMode && formData.rgn?.startsWith("T-")
            ? "ID temporário (alterável)"
            : undefined
        }
      >
        <Input
          id="animal-rgn"
          value={formData.rgn}
          onChange={(e) =>
            setFormData({
              ...formData,
              rgn: e.target.value.toUpperCase(),
            })
          }
          disabled={isEditMode && !formData.rgn?.startsWith("N")}
          placeholder="Ex: 1234"
          className={FIELD_CLASS}
          required
        />
      </FormRow>

      {/* Série/RGD */}
      <FormRow label="Série / RGD" htmlFor="animal-serie" required>
        <Input
          id="animal-serie"
          value={formData.serie_rgd}
          onChange={(e) =>
            setFormData({
              ...formData,
              serie_rgd: e.target.value.toUpperCase(),
            })
          }
          placeholder="Ex: INDI"
          className={FIELD_CLASS}
          required
        />
      </FormRow>

      {/* Raça */}
      <FormRow label="Raça" htmlFor="animal-breed" required>
        <Select
          value={formData.breed || "Nelore"}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              breed: value,
            })
          }
        >
          <SelectTrigger id="animal-breed" className={FIELD_CLASS}>
            <SelectValue placeholder="Selecione a raça" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Nelore">Nelore</SelectItem>
            <SelectItem value="Nelore Mocha">Nelore Mocha</SelectItem>
          </SelectContent>
        </Select>
      </FormRow>

      {/* Nome do Animal */}
      <FormRow label="Nome" htmlFor="animal-name">
        <Input
          id="animal-name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          placeholder="Nome opcional"
          className={FIELD_CLASS}
        />
      </FormRow>

      {/* Sexo */}
      <FormRow label="Sexo" htmlFor="animal-sex" required>
        <Select
          value={formData.sex}
          onValueChange={(value) =>
            setFormData({ ...formData, sex: value })
          }
          disabled={!!initialSex}
        >
          <SelectTrigger id="animal-sex" className={FIELD_CLASS}>
            <SelectValue placeholder="Selecione o sexo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">Macho</SelectItem>
            <SelectItem value="F">Fêmea</SelectItem>
          </SelectContent>
        </Select>
      </FormRow>

      {/* Nascimento */}
      <FormRow label="Nascimento" htmlFor="animal-born-date" required>
        <DatePicker
          id="animal-born-date"
          value={formData.born_date}
          onChange={(value) => setFormData({ ...formData, born_date: value })}
          required
        />
      </FormRow>

      {/* Genotipagem */}
      <FormRow label="Genotipagem" htmlFor="animal-genotyping">
        <Select
          value={formData.genotyping || "Não"}
          onValueChange={(value) =>
            setFormData({ ...formData, genotyping: value })
          }
        >
          <SelectTrigger id="animal-genotyping" className={FIELD_CLASS}>
            <SelectValue placeholder="Sim/Não" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sim">Sim</SelectItem>
            <SelectItem value="Não">Não</SelectItem>
          </SelectContent>
        </Select>
      </FormRow>
    </FormSection>
  );
}
