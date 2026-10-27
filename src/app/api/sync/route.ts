import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Creates a Supabase client that properly handles the authentication context.
 * If a Bearer token is provided in the Authorization header, it uses that token
 * to create a client with the correct RLS context. Otherwise, it falls back
 * to the server-side client (cookies).
 */
async function getSupabaseForRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );
  }

  // Fallback to cookie-based client for Server Components
  return await createServerClient();
}

const ALLOWED_TABLES = new Set([
  "animals",
  "farms",
  "vaccines",
  "user_profiles",
  "animal_metrics_weight",
  "animal_metrics_ce",
  "animal_vaccines",
  "reproduction_events",
  "animal_statuses",
  "animal_situations",
  "semen_doses",
  "clients",
  "movements",
  "sales",
  "deaths",
  "exchanges",
  "retreats",
  "agenda_reminders",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const lastModified = searchParams.get("lastModified");
  const lastId = searchParams.get("lastId");
  const limit = searchParams.get("limit") || "1000";
  const primaryKey = searchParams.get("primaryKey") || "id";

  if (!table) {
    return NextResponse.json(
      { error: "Table name is required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TABLES.has(table)) {
    console.warn(`[SyncAPI] Blocked unauthorized table access attempt: ${table}`);
    return NextResponse.json(
      { error: "Access to the requested table is forbidden" },
      { status: 403 },
    );
  }

  const supabase = await getSupabaseForRequest(req);

  // Diagnostic: Verify authentication session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    console.warn(
      "[SyncAPI] Unauthorized access attempt to:",
      table,
      userError?.message,
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log(`[SyncAPI] Auth verified for ${user.email} (UID: ${user.id})`);

  // Build Query
  let query = supabase
    .from(table)
    .select("*")
    .order("updated_at", { ascending: true })
    .order(primaryKey, { ascending: true })
    .limit(parseInt(limit));

  if (lastModified !== null && lastModified !== undefined) {
    const lastModNum = Number(lastModified);
    if (lastId) {
      // FIX: Quote primary keys to avoid scientific notation parsing issues (e.g. 10e3...) in PostgREST
      const idFilter = `"${lastId}"`;
      query = query.or(
        `updated_at.gt.${lastModNum},and(updated_at.eq.${lastModNum},${primaryKey}.gt.${idFilter})`,
      );
    } else {
      query = query.gte("updated_at", lastModNum);
    }
  }

  // Execution
  const { data, error } = await query;

  if (error) {
    console.error(`[SyncAPI] Pull error for ${table}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(
    `[SyncAPI] Pull success for ${table}: ${data?.length || 0} rows found`,
  );

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, documents, primaryKey = "id" } = body;

    if (!table || !documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: "Table and documents are required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TABLES.has(table)) {
      console.warn(`[SyncAPI] Blocked unauthorized table write attempt: ${table}`);
      return NextResponse.json(
        { error: "Access to the requested table is forbidden" },
        { status: 403 },
      );
    }

    const supabase = await getSupabaseForRequest(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use upsert which matches resolution=merge-duplicates behavior
    const { data, error } = await supabase
      .from(table)
      .upsert(documents, {
        onConflict: primaryKey,
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error(`[SyncAPI] Push error for ${table}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(
      `[SyncAPI] Push success for ${table}: ${data?.length || 0} rows synced for ${user.email}`,
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error(`[SyncAPI] Internal error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
