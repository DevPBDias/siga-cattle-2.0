"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { DosesSemenWorkspace } from "@/components/features/doses/DosesSemenWorkspace";

export default function DosesSemenPage() {
  return (
    <main className="min-h-screen bg-background pb-12">
      <ShortHeader title="TOUROS / SEMÊN" />
      <DosesSemenWorkspace />
    </main>
  );
}
