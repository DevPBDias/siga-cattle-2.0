"use client";

import { BulkReproductionPanel } from "@/components/features/reproduction/BulkReproductionPanel";
import ShortHeader from "@/components/layout/ShortHeader";

export default function ReproducaoLotePage() {
  return (
    <div className="flex flex-col overflow-hidden bg-background h-dvh pb-12">
      <ShortHeader title="Reprodução em lote" />
      <BulkReproductionPanel />
    </div>
  );
}
