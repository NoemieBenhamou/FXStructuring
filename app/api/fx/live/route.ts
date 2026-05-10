import { NextResponse } from "next/server";
import { getLiveFxData } from "@/lib/server/fx-data";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pair = searchParams.get("pair") ?? "EURUSD";
  return NextResponse.json(await getLiveFxData(pair));
}
