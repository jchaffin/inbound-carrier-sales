// app/api/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";

type Row = {
  session_id: string;
  timestamp: string;
  outcome: string;
  sentiment: string;
  rounds?: number;
  decision?: string;
};

const DB: Row[] = [];
const COUNT_OUTCOME = new Map<string, number>();
const COUNT_SENTIMENT = new Map<string, number>();
const COUNT_DECISION = new Map<string, number>();

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({} as any));

  const row: Row = {
    session_id: String(b.session_id || ""),
    timestamp: String(b.timestamp || new Date().toISOString()),
    outcome: String(b.outcome || "unknown"),
    sentiment: String(b.sentiment || "unknown"),
    rounds: b.rounds !== undefined ? Number(b.rounds) : undefined,
    decision: b.decision ? String(b.decision) : undefined,
  };

  if (!row.session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  DB.push(row);
  bump(COUNT_OUTCOME, row.outcome.toLowerCase());
  bump(COUNT_SENTIMENT, row.sentiment.toLowerCase());
  if (row.decision) bump(COUNT_DECISION, row.decision.toLowerCase());

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    totals: { calls: DB.length },
    outcome: Object.fromEntries(COUNT_OUTCOME.entries()),
    sentiment: Object.fromEntries(COUNT_SENTIMENT.entries()),
    decision: Object.fromEntries(COUNT_DECISION.entries()),
  });
}