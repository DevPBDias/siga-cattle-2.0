/**
 * Integrity Check — Compara contagens de registros local (RxDB) vs remoto (Supabase).
 *
 * Útil para diagnóstico e monitoramento pós-deploy.
 */

import { SyncLogger } from "./syncLogger";

export interface IntegrityResult {
  collection: string;
  tableName: string;
  localCount: number;
  remoteCount: number;
  difference: number;
  status: "ok" | "local_ahead" | "remote_ahead" | "error";
  error?: string;
}

export interface IntegrityReport {
  timestamp: number;
  results: IntegrityResult[];
  summary: {
    total: number;
    ok: number;
    divergent: number;
    errors: number;
  };
}

/** Mapeamento collection → tabela Supabase */
const COLLECTION_TABLE_MAP: Record<string, string> = {
  animals: "animals",
  vaccines: "vaccines",
  farms: "farms",
  animal_metrics_ce: "animal_metrics_ce",
  animal_metrics_weight: "animal_metrics_weight",
  animal_vaccines: "animal_vaccines",
  reproduction_events: "reproduction_events",
  animal_situations: "animal_situations",
  animal_partnerships: "animal_partnerships",
  semen_doses: "semen_doses",
  clients: "clients",
  movements: "movements",
  transactions: "transactions",
  deaths: "deaths",
  exchanges: "exchanges",
};

/**
 * Executa verificação de integridade comparando contagens local vs remoto.
 *
 * @param db Instância do RxDB
 * @param supabaseUrl URL do Supabase
 * @param supabaseKey chave anon do Supabase
 * @returns Relatório de integridade completo
 */
export async function runIntegrityCheck(
  db: any,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<IntegrityReport> {
  SyncLogger.info("integrity", "Starting integrity check...");

  const results: IntegrityResult[] = [];

  for (const [collectionName, tableName] of Object.entries(
    COLLECTION_TABLE_MAP,
  )) {
    const result: IntegrityResult = {
      collection: collectionName,
      tableName,
      localCount: 0,
      remoteCount: 0,
      difference: 0,
      status: "ok",
    };

    try {
      // Contagem local
      const collection = db[collectionName];
      if (!collection) {
        result.status = "error";
        result.error = "Collection not found in local DB";
        results.push(result);
        continue;
      }

      result.localCount = await collection.count().exec();

      // Contagem remota via HEAD + content-range
      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/${tableName}?select=*&_deleted=is.false`,
          {
            method: "HEAD",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Prefer: "count=exact",
            },
            signal: AbortSignal.timeout(10000),
          },
        );

        if (response.ok || response.status === 206) {
          const range = response.headers.get("content-range");
          if (range) {
            const total = range.split("/")[1];
            result.remoteCount = total === "*" ? -1 : parseInt(total, 10);
          }
        } else {
          result.status = "error";
          result.error = `HTTP ${response.status}`;
        }
      } catch (fetchErr) {
        result.status = "error";
        result.error =
          fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      }

      // Calcular diferença
      if (result.status !== "error") {
        result.difference = result.localCount - result.remoteCount;
        if (result.difference === 0) {
          result.status = "ok";
        } else if (result.difference > 0) {
          result.status = "local_ahead";
        } else {
          result.status = "remote_ahead";
        }
      }
    } catch (err) {
      result.status = "error";
      result.error = err instanceof Error ? err.message : String(err);
    }

    results.push(result);
  }

  const report: IntegrityReport = {
    timestamp: Date.now(),
    results,
    summary: {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      divergent: results.filter(
        (r) => r.status === "local_ahead" || r.status === "remote_ahead",
      ).length,
      errors: results.filter((r) => r.status === "error").length,
    },
  };

  // Log do resultado
  for (const r of results) {
    const icon =
      r.status === "ok"
        ? "✅"
        : r.status === "error"
          ? "❌"
          : "⚠️";
    SyncLogger.info(
      "integrity",
      `${icon} ${r.collection}: local=${r.localCount} remote=${r.remoteCount} diff=${r.difference}`,
    );
  }

  SyncLogger.info(
    "integrity",
    `Check complete: ${report.summary.ok} ok, ${report.summary.divergent} divergent, ${report.summary.errors} errors`,
  );

  return report;
}
