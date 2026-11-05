"use client";

import { BulkReproductionPanel } from "@/components/features/reproduction/BulkReproductionPanel";
import ShortHeader from "@/components/layout/ShortHeader";

export default function ReproducaoLotePage() {
  return (
    <div className="flex flex-col overflow-hidden bg-background h-dvh pb-12">
      <ShortHeader title="Reprodução em lote" />
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto w-full max-w-2xl">
          <BulkReproductionPanel />
        </div>
      </div>
    </div>
  );
}
