import { NextResponse } from "next/server";
import { reset, summary } from "@/lib/metrics";

export async function POST() {
  reset();
  return NextResponse.json({ ok: true, ...summary() });
}