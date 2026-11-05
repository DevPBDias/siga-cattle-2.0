"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { PesagemCeWorkspace } from "@/components/features/pesagem/PesagemCeWorkspace";

export default function PesagemPage() {
  return (
    <main className="min-h-screen bg-background pb-12">
      <ShortHeader title="Pesagem / CE" />
      <div className="mx-auto w-full max-w-lg">
        <PesagemCeWorkspace />
      </div>
    </main>
  );
}
