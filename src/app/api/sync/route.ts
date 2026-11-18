import { NextRequest, NextResponse } from "next/server";
import {
  createClient as createSupabaseClient,
} from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { resolveAnimalOrganizationId } from "@/lib/sync/organization";

// ---------------------------------------------------------------------------
// Allowlist — apenas essas tabelas podem ser acessadas via API de sync.
// ---------------------------------------------------------------------------
const ALLOWED_TABLES = new Set([
  "animals",
  "farms",
  "user_profiles",
  "clients",
  "animal_situations",
  "animal_statuses",
  "vaccines",
  "animal_metrics_weight",
  "animal_metrics_ce",
  "animal_vaccines",
  "reproduction_events",
  "deaths",
  "sales",
  "exchanges",
  "retreats",
  "agenda_reminders",
  "movements",
  "semen_doses",
]);

// ---------------------------------------------------------------------------
// PK override: mapeia a chave primária real do Supabase quando necessário
// ---------------------------------------------------------------------------
const SERVER_PK_OVERRIDE: Record<string, string> = {
  animals: "animal_key",
  reproduction_events: "event_id",
};

async function getSupabaseForRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } },
    );
  }
  return await createServerClient();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const lastModified = searchParams.get("lastModified");
  const lastId = searchParams.get("lastId");
  const limit = searchParams.get("limit") || "1000";
  const clientPrimaryKey = searchParams.get("primaryKey") || "id";

  if (!table) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 });
  }
  if (!ALLOWED_TABLES.has(table)) {
    console.warn(`[SyncAPI] Blocked unauthorized table access attempt: ${table}`);
    return NextResponse.json(
      { error: "Access to the requested table is forbidden" },
      { status: 403 },
    );
  }

  const supabase = await getSupabaseForRequest(req);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    console.warn("[SyncAPI] Unauthorized pull attempt on:", table, userError?.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serverPk = SERVER_PK_OVERRIDE[table] ?? clientPrimaryKey;

  console.log(`[SyncAPI] Pull: ${table} (pk=${serverPk}) for ${user.email}`);

  // Consulta todas as colunas existentes na tabela no Supabase
  let query = supabase
    .from(table)
    .select("*")
    .order("updated_at", { ascending: true })
    .order(serverPk, { ascending: true })
    .limit(parseInt(limit));

  if (lastModified !== null && lastModified !== undefined) {
    const lastModNum = Number(lastModified);

    // Se lastModNum > 0: filtra por updated_at (bigint numérico)
    if (lastModNum > 0) {
      const validLastId = lastId && lastId !== "undefined" && lastId !== "null";
      if (validLastId) {
        query = query.or(
          `updated_at.gt.${lastModNum},and(updated_at.eq.${lastModNum},${serverPk}.gt."${lastId}")`,
        );
      } else {
        query = query.gte("updated_at", lastModNum);
      }
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error(`[SyncAPI] Pull error for ${table}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Prepara os dados para o cliente RxDB
  let processedData = data || [];
  if (Array.isArray(processedData)) {
    processedData = processedData.map((row: Record<string, unknown>) => {
      // Garante que server_updated_at seja compatível com o checkpoint do cliente
      if (row.server_updated_at === undefined && row.updated_at !== undefined) {
        row.server_updated_at = row.updated_at;
      }
      return row;
    });
  }

  console.log(`[SyncAPI] Pull success for ${table}: ${processedData.length} rows`);
  return NextResponse.json(processedData);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, documents, primaryKey: clientPrimaryKey = "id" } = body;

    if (!table || !documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: "Table and documents are required" }, { status: 400 });
    }
    if (!ALLOWED_TABLES.has(table)) {
      console.warn(`[SyncAPI] Blocked unauthorized table write attempt: ${table}`);
      return NextResponse.json(
        { error: "Access to the requested table is forbidden" },
        { status: 403 },
      );
    }

    const supabase = await getSupabaseForRequest(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let animalOrgId: string | null = null;
    if (table === "animals") {
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, role, owner_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[SyncAPI] Failed to resolve animal organization:", profileError);
        return NextResponse.json(
          { error: "Could not load the authenticated user's organization profile." },
          { status: 500 },
        );
      }

      if (!profile) {
        return NextResponse.json(
          { error: "No user profile found to determine the animal organization." },
          { status: 409 },
        );
      }

      const organization = resolveAnimalOrganizationId(profile, user.id);
      if (organization.error) {
        return NextResponse.json({ error: organization.error }, { status: 409 });
      }
      animalOrgId = organization.orgId;
    }

    const serverPk = SERVER_PK_OVERRIDE[table] ?? clientPrimaryKey;

    // Sanitiza documentos para o Supabase: remove colunas inexistentes no banco remoto
    const sanitizedDocuments = documents.map((doc: Record<string, unknown>) => {
      const clean = { ...doc };
      delete clean.server_updated_at;
      delete clean.device_id;

      if (table === "animals") {
        clean.org_id = animalOrgId;
      } else {
        delete clean.org_id;
      }
      return clean;
    });

    const { data, error } = await supabase
      .from(table)
      .upsert(sanitizedDocuments, { onConflict: serverPk, ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`[SyncAPI] Push error for ${table}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[SyncAPI] Push success for ${table}: ${data?.length ?? 0} rows for ${user.email}`);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[SyncAPI] Internal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
