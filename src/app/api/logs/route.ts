import { NextRequest, NextResponse } from "next/server";
import { DB, bump, list, summary, type Row } from "@/lib/metrics";

export async function GET() {
  return NextResponse.json({ logs: list(50), metrics: normalize(summary()) });
}

export async function POST(request: NextRequest) {
  const b = (await request.json()) as Partial<Row>;
  const r: Row = {
    session_id: String(b.session_id || crypto.randomUUID()),
    timestamp: String(b.timestamp || new Date().toISOString()),
    outcome: String(b.outcome || "unknown"),
    sentiment: String(b.sentiment || "unknown"),
    rounds: b.rounds !== undefined ? Number(b.rounds) : undefined,
    decision: b.decision ? String(b.decision) : undefined,
  };
  DB.push(r);
  bump(new Map(Object.entries({})), "noop"); // no-op to satisfy import if tree-shaken
  return NextResponse.json({ ok: true });
}

function normalize(s: ReturnType<typeof summary>) {
  const calls = s.totals.calls || 0;
  const outcomes = s.outcome || {};
  const sentiments = s.sentiment || {};
  const rounds = DB.map((r) => (typeof r.rounds === "number" ? r.rounds : 0));
  const avgRounds = rounds.length ? rounds.reduce((a, b) => a + b, 0) / rounds.length : 0;
  const accepted = (outcomes["accepted"] ?? 0) + (outcomes["transferred"] ?? 0);
  const conversionRate = calls ? accepted / calls : 0;
  return {
    totalCalls: calls,
    outcomes,
    sentiments,
    avgRounds,
    conversionRate,
  };
}


