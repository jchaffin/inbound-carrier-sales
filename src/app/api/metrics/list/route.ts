import { NextRequest, NextResponse } from "next/server";
import { list } from "@/lib/metrics";

export async function GET(req: NextRequest) {
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 50);
  return NextResponse.json({ rows: list(isFinite(limit) ? limit : 50) });
}