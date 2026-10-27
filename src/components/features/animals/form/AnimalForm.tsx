"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Loader2, GitFork, Dna } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Animal } from "@/types/animal.type";
import { todayISO } from "@/utils/dates";
import { BasicInfoSection } from "./sections/BasicInfoSection";
import { GenealogySection } from "./sections/GenealogySection";
import { GeneticDataSection } from "./sections/GeneticDataSection";

interface AnimalFormProps {
  onSubmit: (data: Partial<Animal>) => Promise<void>;
  isSubmitting: boolean;
  initialSex?: "M" | "F";
  initialData?: Partial<Animal>;
  title: string;
}

export function AnimalForm({
  onSubmit,
  isSubmitting,
  initialSex,
  initialData,
  title,
}: AnimalFormProps) {
  const [formData, setFormData] = useState({
    rgn: initialData?.rgn || "",
    serie_rgd: initialData?.serie_rgd || "INDI",
    breed: initialData?.breed || "Nelore",
    name: initialData?.name || "",
    sex: initialSex || initialData?.sex || "",
    born_date: initialData?.born_date || todayISO(),
    father_name: initialData?.father_name || "",
    mother_rgn: initialData?.mother_rgn || "",
    mother_serie_rgd: initialData?.mother_serie_rgd || "INDI",
    maternal_grandfather_name: initialData?.maternal_grandfather_name || "",
    paternal_grandfather_name: initialData?.paternal_grandfather_name || "",
    farm_id: initialData?.farm_id || "",
    status: initialData?.status || "",
    genotyping: initialData?.genotyping || "Não",
    iabcgz: initialData?.iabcgz || "",
    deca: initialData?.deca || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        rgn: initialData.rgn || "",
        serie_rgd: initialData.serie_rgd || "INDI",
        breed: initialData.breed || "Nelore",
        name: initialData.name || "",
        sex: initialSex || initialData.sex || "",
        born_date: initialData.born_date || todayISO(),
        father_name: initialData.father_name || "",
        mother_rgn: initialData.mother_rgn || "",
        mother_serie_rgd: initialData.mother_serie_rgd || "INDI",
        maternal_grandfather_name: initialData.maternal_grandfather_name || "",
        paternal_grandfather_name: initialData.paternal_grandfather_name || "",
        farm_id: initialData.farm_id || "",
        status: initialData.status || "",
        genotyping: initialData.genotyping || "Não",
        iabcgz: initialData.iabcgz || "",
        deca: initialData.deca || "",
      });
    }
  }, [initialData, initialSex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData: Partial<Animal> = {
      ...formData,
      breed: formData.breed || "Nelore",
      sex: formData.sex as any,
      status: formData.status as any,
      genotyping: formData.genotyping,
    };
    await onSubmit(cleanData);
  };

  const isEditMode = !!initialData;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="space-y-6">
        <BasicInfoSection
          formData={formData}
          setFormData={setFormData}
          isEditMode={isEditMode}
          initialSex={initialSex}
        />

        <Accordion
          type="multiple"
          defaultValue={[]}
          className="space-y-4"
        >
          <AccordionItem
            value="genealogia"
            className="rounded-2xl border border-border/60 bg-card px-4 shadow-sm"
          >
            <AccordionTrigger className="hover:no-underline py-3.5">
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-primary/70" />
                <span className="font-bold text-sm text-primary uppercase">
                  Genealogia
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Opcional)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 border-t border-border/40 text-sm space-y-3">
              <GenealogySection
                formData={formData}
                setFormData={setFormData}
                hideTitle
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="dados-geneticos"
            className="rounded-2xl border border-border/60 bg-card px-4 shadow-sm"
          >
            <AccordionTrigger className="hover:no-underline py-3.5">
              <div className="flex items-center gap-2">
                <Dna className="h-4 w-4 text-primary/70" />
                <span className="font-bold text-sm text-primary uppercase">
                  Dados Genéticos
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Opcional)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 border-t border-border/40 text-sm space-y-3">
              <GeneticDataSection
                formData={formData}
                setFormData={setFormData}
                hideTitle
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="py-5 w-full text-base uppercase font-bold rounded-sm mt-4 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 flex gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Salvando...
          </>
        ) : (
          <>{title}</>
        )}
      </Button>
    </form>
  );
}
