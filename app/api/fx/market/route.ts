import { NextResponse } from "next/server";
import type { MarketRange } from "@/lib/api/client";
import { getMarketData } from "@/lib/server/fx-data";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pair = searchParams.get("pair") ?? "EURUSD";
  const range = (searchParams.get("range") as MarketRange | null) ?? "2Y";
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  return NextResponse.json(await getMarketData(pair, { range, startDate, endDate }));
}
