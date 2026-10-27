"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { uploadDoseImage, compressImage } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";

interface BullImageUploadProps {
  value?: string;
  uploadId: string;
  onChange: (url: string | undefined) => void;
}

export function BullImageUpload({ value, uploadId, onChange }: BullImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const compressedFile = await compressImage(file, 800, 0.8);
      const result = await uploadDoseImage(compressedFile, uploadId);

      if (result.success && result.url) {
        onChange(result.url);
      }
    } catch (err) {
      console.error("[BullImageUpload] Upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    onChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-primary/30">
        {value ? (
          <>
            <Image
              src={value}
              alt="Foto do touro"
              fill
              className="object-cover"
              unoptimized
              crossOrigin="anonymous"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
        {value ? "Trocar Foto" : "Adicionar Foto"}
      </Button>
    </div>
  );
}
