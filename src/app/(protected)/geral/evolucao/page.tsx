"use client";

import { useState } from "react";
import ShortHeader from "@/components/layout/ShortHeader";
import { HerdEvolutionChart } from "@/components/features/reports/HerdEvolutionChart";
import type {
  HerdEvolutionCategory,
  HerdEvolutionPeriod,
} from "@/hooks/reports/useHerdEvolution";

export default function HerdEvolutionPage() {
  const [period, setPeriod] = useState<HerdEvolutionPeriod>("month");
  const [category, setCategory] = useState<HerdEvolutionCategory>("all");

  return (
    <main className="min-h-screen bg-background pb-24">
      <ShortHeader title="Evolução do rebanho" />
      <section className="mx-auto max-w-lg space-y-4 p-4">
        <HerdEvolutionChart
          period={period}
          category={category}
          onPeriodChange={setPeriod}
          onCategoryChange={setCategory}
        />
      </section>
    </main>
  );
}
