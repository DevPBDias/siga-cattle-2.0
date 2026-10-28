"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { SyncStatusIndicator } from "@/components/sync/SyncStatusIndicator";

const ShortHeader = ({ title }: { title: string }) => {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-3.5 shadow-lg md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h3 className="text-lg font-semibold uppercase">{title}</h3>
        </div>

        <SyncStatusIndicator />
      </div>
    </div>
  );
};

export default ShortHeader;
