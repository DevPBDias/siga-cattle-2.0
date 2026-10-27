import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getMarketQuotes, MARKET_CACHE_TAG } from "@/lib/market/cepea";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    revalidateTag(MARKET_CACHE_TAG, { expire: 0 });
    const data = await getMarketQuotes();
    return NextResponse.json({ ok: true, updatedAt: data.updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
