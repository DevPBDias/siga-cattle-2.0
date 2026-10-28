"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { diffInDays, todayISO } from "@/utils/dates";

export interface DashboardStats {
  activeTotal: number;
  entradaEsteMes: number;
  nascimentos30d: number;
  femeasPrenhas: number;
  gmdMedio: number | null;
  totalPesagens: number;
  animalEmTratamento: number;
  animalEmAlerta: number;
}

const EMPTY: DashboardStats = {
  activeTotal: 0,
  entradaEsteMes: 0,
  nascimentos30d: 0,
  femeasPrenhas: 0,
  gmdMedio: null,
  totalPesagens: 0,
  animalEmTratamento: 0,
  animalEmAlerta: 0,
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function fetchStats() {
      const supabase = getSupabase();
      const today = todayISO();
      const thisMonth = today.slice(0, 7);

      const { data: animals, error: animalError } = await supabase
        .from("animals")
        .select("rgn, animal_state, born_date, created_at")
        .eq("_deleted", false);

      if (animalError || !active) {
        if (active) setError(animalError?.message ?? "Erro ao carregar dados");
        if (active) setLoading(false);
        return;
      }

      const { data: weights, error: weightError } = await supabase
        .from("animal_weights")
        .select("rgn, value, date")
        .eq("_deleted", false);

      if (!active) return;
      if (weightError) {
        setError(weightError.message);
        setLoading(false);
        return;
      }

      const animalList = animals ?? [];
      const activeTotal = animalList.filter((a) => a.animal_state === "ATIVO").length;
      const entradaEsteMes = animalList.filter((a) => {
        if (!a.created_at) return false;
        return new Date(a.created_at).toISOString().slice(0, 7) === thisMonth;
      }).length;
      const nascimentos30d = animalList.filter((a) => {
        if (!a.born_date) return false;
        const days = diffInDays(a.born_date, today);
        return days >= 0 && days <= 30;
      }).length;
      const femeasPrenhas = animalList.filter((a) => a.animal_state === "PRENHA").length;
      const animalEmTratamento = animalList.filter((a) => a.animal_state === "EM_TRATAMENTO").length;
      const animalEmAlerta = animalList.filter((a) => a.animal_state === "ALERTA").length;

      const ws = weights ?? [];
      let gmdMedio: number | null = null;
      if (ws.length >= 2) {
        const byAnimal: Record<string, typeof ws> = {};
        for (const w of ws) {
          if (!byAnimal[w.rgn]) byAnimal[w.rgn] = [];
          byAnimal[w.rgn].push(w);
        }
        const gmds: number[] = [];
        for (const wList of Object.values(byAnimal)) {
          if (wList.length < 2) continue;
          const sorted = [...wList].sort((a, b) =>
            (a.date || "").localeCompare(b.date || "")
          );
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const dias = diffInDays(first.date, last.date);
          if (dias > 0) gmds.push((last.value - first.value) / dias);
        }
        if (gmds.length > 0) {
          gmdMedio = gmds.reduce((s, v) => s + v, 0) / gmds.length;
        }
      }

      if (active) {
        setStats({ activeTotal, entradaEsteMes, nascimentos30d, femeasPrenhas, gmdMedio, totalPesagens: ws.length, animalEmTratamento, animalEmAlerta });
        setError(null);
        setLoading(false);
      }
    }

    void fetchStats();
    return () => { active = false; };
  }, []);

  return { stats, loading, error };
}
