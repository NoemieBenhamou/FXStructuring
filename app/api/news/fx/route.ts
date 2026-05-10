import { NextResponse } from "next/server";
import { getFxNews } from "@/lib/server/fx-data";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get("currency") ?? "FX";
  return NextResponse.json(await getFxNews(currency));
}
