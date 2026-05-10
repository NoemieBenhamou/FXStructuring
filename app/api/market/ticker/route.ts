import { NextResponse } from "next/server";
import { getMarketTicker } from "@/lib/server/fx-data";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  return NextResponse.json(await getMarketTicker());
}
