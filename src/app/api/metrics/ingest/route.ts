// app/api/metrics/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DB, OUT, SEN, DEC, bump, type Row } from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as Partial<Row>;
  const row: Row = {
    session_id: String(b.session_id || crypto.randomUUID()),
    timestamp: String(b.timestamp || new Date().toISOString()),
    outcome: String(b.outcome || "unknown"),
    sentiment: String(b.sentiment || "unknown"),
    rounds: b.rounds !== undefined ? Number(b.rounds) : undefined,
    decision: b.decision ? String(b.decision) : undefined,
  };

  DB.push(row);
  bump(OUT, row.outcome);
  bump(SEN, row.sentiment);
  if (row.decision) bump(DEC, row.decision);

  return NextResponse.json({ ok: true });
}


