import { NextRequest, NextResponse } from "next/server";
import { getLogs, logCall, summarize } from "@/lib/metrics";
import { CallLogEntry } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ logs: getLogs(), metrics: summarize() });
}

export async function POST(request: NextRequest) {
  const data = (await request.json()) as CallLogEntry;
  if (!data || !data.id || !data.mcNumber || !data.outcome || !data.sentiment) {
    return NextResponse.json({ error: "Invalid log entry" }, { status: 400 });
  }
  logCall(data);
  return NextResponse.json({ ok: true });
}


