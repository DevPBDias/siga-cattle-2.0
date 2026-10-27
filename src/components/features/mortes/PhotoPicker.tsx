"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { compressImage, MAX_PHOTOS } from "@/utils/death.utils";

interface PhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
  disabled?: boolean;
  labels?: string[];
}

export function PhotoPicker({
  photos,
  onChange,
  max = MAX_PHOTOS,
  disabled,
  labels,
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite tirar a mesma foto de novo
    if (!file || photos.length >= max) return;

    setProcessing(true);
    try {
      const dataUrl = await compressImage(file);
      onChange([...photos, dataUrl]);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao processar a foto.");
    } finally {
      setProcessing(false);
    }
  };

  const removePhoto = (index: number) =>
    onChange(photos.filter((_, i) => i !== index));

  const isFull = photos.length >= max;

  return (
    <div className="space-y-2">
      {/* capture="environment" abre a câmera traseira no celular */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: max }).map((_, index) => {
          const photo = photos[index];

          const content = photo ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Foto ${index + 1} do animal`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  disabled={disabled}
                  aria-label={`Remover foto ${index + 1}`}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || processing || isFull}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/30 bg-muted/30 text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
            >
              {processing && index === photos.length ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
              <span className="text-[10px] font-bold uppercase">
                Tirar foto
              </span>
            </button>
          );

          return (
            <div key={index} className="min-w-0 space-y-1.5">
              {labels?.[index] && (
                <p className="text-[11px] font-semibold uppercase tracking-tight text-primary">
                  {labels[index]}
                </p>
              )}
              {content}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        {photos.length}/{max} fotos (opcional)
      </p>
    </div>
  );
}
