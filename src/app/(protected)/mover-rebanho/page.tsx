"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { MoverRebanhoForm } from "@/components/features/mover-rebanho/MoverRebanhoForm";

export default function MoverRebanhoPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <ShortHeader title="MOVER REBANHO" />
      <main className="p-4 max-w-lg mx-auto space-y-4">
        <MoverRebanhoForm />
      </main>
    </div>
  );
}
