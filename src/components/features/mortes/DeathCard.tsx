"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Death } from "@/types/death.type";
import { formatIsoDate } from "@/utils/death.utils";
import { getSupabase } from "@/lib/supabase/client";

const DEATH_PHOTOS_BUCKET = "animal_deaths";

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/50 pb-0.5">
    <dt className="text-[9px] font-bold uppercase text-muted-foreground">
      {label}
    </dt>
    <dd className="m-0 truncate text-right text-[11px] font-semibold text-primary">
      {value || "-"}
    </dd>
  </div>
);

export function DeathCard({ death }: { death: Death }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const photos = death.photos ?? [];
  const photoKey = JSON.stringify(photos);
  const [displayPhotos, setDisplayPhotos] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const resolvePhotos = async () => {
      const sources = JSON.parse(photoKey) as string[];
      const resolved = await Promise.all(
        sources.map(async (photo) => {
          if (photo.startsWith("data:") || photo.startsWith("http")) {
            return photo;
          }

          const { data, error } = await getSupabase()
            .storage.from(DEATH_PHOTOS_BUCKET)
            .createSignedUrl(photo, 3600);

          return error ? "" : data.signedUrl;
        }),
      );

      if (!cancelled) setDisplayPhotos(resolved);
    };

    void resolvePhotos();
    return () => {
      cancelled = true;
    };
  }, [photoKey]);

  return (
    <article
      className="rounded-xl border border-border bg-card p-3 shadow-sm"
      aria-label={`Morte do animal ${death.animal_rgn}`}
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="m-0 text-[17px] font-bold leading-tight tracking-tight text-primary">
            {death.animal_rgn}
          </h3>
          <span className="block text-[10px] text-muted-foreground">
            Morte em {formatIsoDate(death.date)}
          </span>
        </div>

        <span className="shrink-0 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[10px] font-black uppercase text-destructive">
          {death.reason}
        </span>
      </header>

      {death.mother_name && (
        <dl className="m-0 grid grid-cols-1 gap-y-1">
          <Field label="Mãe" value={death.mother_name} />
        </dl>
      )}

      {displayPhotos.some(Boolean) && (
        <div className="mt-2 flex gap-2">
          {displayPhotos.map((photo, index) =>
            photo ? (
              <button
                key={index}
                type="button"
                onClick={() => setPreviewIndex(index)}
                aria-label={`Ampliar foto ${index + 1}`}
                className="h-14 w-14 overflow-hidden rounded-lg border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`Foto ${index + 1} do animal ${death.animal_rgn}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ) : null,
          )}
        </div>
      )}

      <Dialog
        open={previewIndex !== null}
        onOpenChange={(open) => !open && setPreviewIndex(null)}
      >
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">
            Foto do animal {death.animal_rgn}
          </DialogTitle>
          {previewIndex !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayPhotos[previewIndex]}
              alt={`Foto ${previewIndex + 1} do animal ${death.animal_rgn}`}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
}
