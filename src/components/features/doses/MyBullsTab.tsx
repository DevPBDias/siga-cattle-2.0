"use client";

import { useMemo, useRef, useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Camera,
  ChevronDownIcon,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/input";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { useSemenDoses } from "@/hooks/db/doses/useSemenDoses";
import { Animal } from "@/types/animal.type";
import { formatAge } from "@/utils/dates";
import { toast } from "sonner";
import { uploadDoseImage, compressImage } from "@/lib/supabase/storage";
import { v4 as uuidv4 } from "uuid";

const getBullName = (animal: Animal) =>
  `${animal.serie_rgd ?? ""} ${animal.rgn}`.trim();

const isMale = (animal: Animal) =>
  ["m", "macho"].includes(animal.sex?.toLocaleLowerCase() ?? "");

interface BullCardProps {
  animal: Animal;
  onEdit: (animal: Animal) => void;
  onRemove: (animal: Animal) => void;
  isUpdating: boolean;
  imageSrc?: string | null;
}

function BullCard({
  animal,
  onEdit,
  onRemove,
  isUpdating,
  imageSrc,
}: BullCardProps) {
  return (
    <AccordionItem
      value={animal.rgn}
      className="border border-border/80 bg-card rounded-xl overflow-hidden shadow-xs uppercase w-full"
    >
      <AccordionPrimitive.Header className="flex items-center justify-between px-3.5 py-2.5 hover:bg-primary/5 transition-all w-full border-b border-transparent data-[state=open]:border-border/40">
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className="flex flex-1 items-center gap-2 text-left focus-visible:outline-none min-w-0 pr-1 group cursor-pointer [&[data-state=open]>svg]:rotate-180"
        >
          <div className="flex flex-col min-w-0">
            <h3 className="font-bold text-primary text-base truncate">
              {getBullName(animal)}
            </h3>
            {animal.name && (
              <p className="text-xs text-muted-foreground font-medium lowercase first-letter:uppercase truncate">
                {animal.name}
              </p>
            )}
          </div>
          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 ml-auto" />
        </AccordionPrimitive.Trigger>

        <div className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary hover:bg-primary/10 rounded-md border border-primary transition-colors"
            aria-label={`Editar ${getBullName(animal)}`}
            title="Editar touro"
            disabled={isUpdating}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(animal);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md border border-destructive transition-colors"
            aria-label={`Remover ${getBullName(animal)} de Meus touros`}
            title="Remover touro"
            disabled={isUpdating}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(animal);
            }}
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </AccordionPrimitive.Header>

      <AccordionContent className="w-full px-3.5 pt-3 pb-3">
        <div className="flex flex-row justify-start items-start w-full rounded-lg gap-3">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={getBullName(animal)}
              width={160}
              height={112}
              className="object-cover w-36 h-28 sm:w-40 sm:h-28 rounded-lg flex-shrink-0"
              unoptimized
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-36 h-28 sm:w-40 sm:h-28 flex items-center justify-center bg-muted rounded-lg flex-shrink-0 border border-border/40">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex flex-col justify-start items-start gap-1.5 min-w-0 flex-1">
            <div className="flex flex-col justify-start items-start gap-0.5 text-xs text-primary font-bold w-full min-w-0">
              <span className="font-bold text-[10px] text-muted-foreground">
                Idade:
              </span>
              <span className="truncate w-full font-semibold">
                {formatAge(animal.born_date)}
              </span>
            </div>

            <div className="flex flex-col justify-start items-start gap-0.5 text-xs text-primary font-bold w-full min-w-0">
              <span className="font-bold text-[10px] text-muted-foreground">
                Pai:
              </span>
              <span className="truncate w-full font-semibold">
                {animal.father_name || "Sem pai"}
              </span>
            </div>

            <div className="flex flex-col justify-start items-start gap-0.5 text-xs text-primary font-bold w-full min-w-0">
              <span className="font-bold text-[10px] text-muted-foreground">
                Avô materno:
              </span>
              <span className="truncate w-full font-semibold">
                {animal.maternal_grandfather_name || "Sem avô"}
              </span>
            </div>

            <div className="flex flex-row items-end gap-1 justify-start text-xs text-primary font-bold w-full min-w-0">
              <span className="font-bold text-[10px] text-muted-foreground">
                IABCZ:
              </span>
              <span className="truncate font-semibold">
                {animal.iabcgz || "Sem índice"}
              </span>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface BullEditData {
  born_date: string;
  father_name: string;
  maternal_grandfather_name: string;
  iabcgz: string;
  animal_image?: string;
}

function EditBullDialog({
  animal,
  isSaving,
  error,
  onClose,
  onSave,
}: {
  animal: Animal;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (rgn: string, values: BullEditData) => Promise<void>;
}) {
  const [values, setValues] = useState<BullEditData>({
    born_date: animal.born_date ?? "",
    father_name: animal.father_name ?? "",
    maternal_grandfather_name: animal.maternal_grandfather_name ?? "",
    iabcgz: animal.iabcgz ?? "",
    animal_image: animal.animal_image ?? "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ID estável para o upload enquanto o modal está aberto
  const uploadId = useMemo(() => animal.rgn || uuidv4(), [animal.rgn]);

  const setField = <K extends keyof BullEditData>(
    field: K,
    value: BullEditData[K],
  ) => setValues((current) => ({ ...current, [field]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const compressed = await compressImage(file, 800, 0.8);
      const result = await uploadDoseImage(compressed, uploadId);
      if (result.success && result.url) {
        setField("animal_image", result.url);
      } else {
        setUploadError(result.error || "Erro ao fazer upload da imagem");
      }
    } catch {
      setUploadError("Erro ao processar a imagem");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(animal.rgn, values);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95%] max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-left font-bold uppercase text-primary">
            Editar touro
          </DialogTitle>
          <DialogDescription className="text-left text-sm">
            {getBullName(animal)} · Atualize os dados do card.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto do touro */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-primary/30">
              {values.animal_image ? (
                <>
                  <Image
                    src={values.animal_image}
                    alt={getBullName(animal)}
                    fill
                    className="object-cover"
                    unoptimized
                    crossOrigin="anonymous"
                  />
                  <button
                    type="button"
                    onClick={() => setField("animal_image", "")}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remover foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-1" />
                  <span className="text-[10px]">Foto</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              aria-label="Selecionar foto do touro"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 text-xs gap-2"
            >
              {isUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
              {values.animal_image ? "Trocar foto" : "Adicionar foto"}
            </Button>

            {uploadError && (
              <p role="alert" className="text-xs text-destructive text-center">
                {uploadError}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <FormRow label="Data de nascimento">
              <DatePicker
                id="bull-born-date"
                value={values.born_date}
                onChange={(value) => setField("born_date", value)}
                placeholder="Selecionar data"
              />
            </FormRow>
            <FormRow label="Pai" htmlFor="bull-father-name">
              <Input
                id="bull-father-name"
                value={values.father_name}
                onChange={(event) => setField("father_name", event.target.value)}
                autoComplete="off"
                className="h-11 border-0 bg-muted/40 text-sm"
              />
            </FormRow>
            <FormRow label="Avô materno" htmlFor="bull-maternal-grandfather">
              <Input
                id="bull-maternal-grandfather"
                value={values.maternal_grandfather_name}
                onChange={(event) =>
                  setField("maternal_grandfather_name", event.target.value)
                }
                autoComplete="off"
                className="h-11 border-0 bg-muted/40 text-sm"
              />
            </FormRow>
            <FormRow label="IABCZ" htmlFor="bull-iabcz">
              <Input
                id="bull-iabcz"
                value={values.iabcgz}
                onChange={(event) => setField("iabcgz", event.target.value)}
                autoComplete="off"
                className="h-11 border-0 bg-muted/40 text-sm"
              />
            </FormRow>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-xs font-bold uppercase tracking-wider"
              onClick={onClose}
              disabled={isSaving || isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 w-full bg-primary text-xs font-black uppercase tracking-wider shadow-md hover:bg-primary/90"
              disabled={isSaving || isUploading}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MyBullsTab() {
  const { data: animals = [], loading } = useAnimals();
  const { data: doses = [] } = useSemenDoses();
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();
  const [search, setSearch] = useState("");
  const [updatingRgn, setUpdatingRgn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingBull, setEditingBull] = useState<Animal | null>(null);
  const [bullToRemove, setBullToRemove] = useState<Animal | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Definir como Meus touros os animais marcados como touros/naturais no modelo atual
  const bulls = useMemo(
    () =>
      animals.filter(
        (animal) => animal.is_natural_bull && isMale(animal) && !animal._deleted,
      ),
    [animals],
  );

  const candidates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return [];

    return animals
      .filter((animal) => isMale(animal) && !animal.is_natural_bull && !animal._deleted)
      .filter((animal) =>
        `${getBullName(animal)} ${animal.name ?? ""}`
          .toLocaleLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [animals, search]);

  const bullImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const dose of doses) {
      if (dose.animal_image) {
        if (dose.registration) {
          map.set(dose.registration.toLowerCase(), dose.animal_image);
        }
        if (dose.animal_name) {
          map.set(dose.animal_name.toLowerCase(), dose.animal_image);
        }
      }
    }
    return map;
  }, [doses]);

  const getBullImage = (animal: Animal) => {
    // Prioridade: campo direto no animal (editado pelo usuário)
    if (animal.animal_image) return animal.animal_image;
    // Fallback: imagem da dose de sêmen com mesmo registro/nome
    const byRgn = bullImageMap.get(animal.rgn.toLowerCase());
    if (byRgn) return byRgn;
    if (animal.name) {
      const byName = bullImageMap.get(animal.name.toLowerCase());
      if (byName) return byName;
    }
    const byFullName = bullImageMap.get(getBullName(animal).toLowerCase());
    if (byFullName) return byFullName;
    return null;
  };

  const saveSelection = async (animal: Animal, selected: boolean) => {
    setUpdatingRgn(animal.rgn);
    setError(null);

    try {
      await updateAnimal(animal.rgn, { is_natural_bull: selected });
      if (selected) {
        setSearch("");
        toast.success(`Touro ${getBullName(animal)} adicionado a Meus touros!`);
      } else {
        toast.success(`Touro ${getBullName(animal)} removido de Meus touros!`);
      }
    } catch (updateError) {
      console.error("Erro ao atualizar lista de touros:", updateError);
      setError("Não foi possível atualizar a lista. Tente novamente.");
      toast.error("Erro ao atualizar touro. Tente novamente.");
    } finally {
      setUpdatingRgn(null);
      setBullToRemove(null);
    }
  };

  const saveBullDetails = async (rgn: string, values: BullEditData) => {
    setIsSavingEdit(true);
    setEditError(null);

    try {
      await updateAnimal(rgn, {
        ...values,
        born_date: values.born_date || undefined,
      });
      toast.success("Dados do touro atualizados com sucesso!");
      setEditingBull(null);
    } catch (updateError) {
      console.error("Erro ao editar dados do touro:", updateError);
      setEditError("Não foi possível salvar os dados. Tente novamente.");
      toast.error("Erro ao salvar dados do touro.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3" aria-labelledby="add-bull-heading">
        <div>
          <h2
            id="add-bull-heading"
            className="text-base font-bold uppercase text-primary"
          >
            Adicionar do rebanho
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecione um macho para a lista de touros de monta natural.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar animal macho no rebanho"
            placeholder="Buscar por série, RGN ou nome"
            autoComplete="off"
            className="h-11 pl-9"
          />
        </div>

        {search.trim() && (
          <div className="divide-y overflow-hidden rounded-lg border border-border bg-card">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : candidates.length ? (
              candidates.map((animal) => (
                <div
                  key={animal.rgn}
                  className="flex min-w-0 items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">
                      {getBullName(animal)}
                    </p>
                    {animal.name && (
                      <p className="truncate text-xs text-muted-foreground">
                        {animal.name}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0 gap-1.5"
                    disabled={updatingRgn !== null}
                    onClick={() => void saveSelection(animal, true)}
                  >
                    {updatingRgn === animal.rgn ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Adicionar
                  </Button>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhum macho disponível corresponde à busca.
              </p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="my-bulls-heading">
        <div className="flex items-baseline justify-between gap-2">
          <h2
            id="my-bulls-heading"
            className="text-base font-bold uppercase text-primary"
          >
            Meus touros
          </h2>
          <span className="text-xs text-muted-foreground">
            {bulls.length} {bulls.length === 1 ? "animal" : "animais"}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : bulls.length ? (
          <Accordion type="single" collapsible className="space-y-3">
            {bulls.map((animal) => (
              <BullCard
                key={animal.rgn}
                animal={animal}
                imageSrc={getBullImage(animal)}
                onEdit={(selectedAnimal) => {
                  setEditError(null);
                  setEditingBull(selectedAnimal);
                }}
                onRemove={(selectedAnimal) => setBullToRemove(selectedAnimal)}
                isUpdating={updatingRgn === animal.rgn}
              />
            ))}
          </Accordion>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Você ainda não adicionou touros.
            </p>
          </div>
        )}
      </section>

      {/* Modal de Confirmação para Remoção */}
      {bullToRemove && (
        <Dialog open onOpenChange={(open) => !open && setBullToRemove(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive font-bold uppercase flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Remover Touro
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover{" "}
                <strong>{getBullName(bullToRemove)}</strong> de Meus touros? O
                animal permanecerá no rebanho, mas deixará de constar na lista
                de touros de monta natural.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="grid grid-cols-2 gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setBullToRemove(null)}
                disabled={updatingRgn !== null}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => void saveSelection(bullToRemove, false)}
                disabled={updatingRgn !== null}
              >
                {updatingRgn === bullToRemove.rgn ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  "Sim, Remover"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingBull && (
        <EditBullDialog
          key={editingBull.rgn}
          animal={editingBull}
          isSaving={isSavingEdit}
          error={editError}
          onClose={() => setEditingBull(null)}
          onSave={saveBullDetails}
        />
      )}
    </div>
  );
}
