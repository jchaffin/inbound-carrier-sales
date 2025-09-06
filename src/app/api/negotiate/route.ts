// app/api/negotiate/route.ts
import { NextRequest, NextResponse } from "next/server";

type State = { loadID: string; listPrice: number; round: number };
const SESSIONS = new Map<string, State>();

function decide(listPrice: number, offer: number, round: number) {
  const floor = Math.round(listPrice * 0.9); // 90% floor
  const maxRounds = 3;

  // after max rounds → reject outright
  if (round > maxRounds) {
    return { decision: "reject", counter: 0, floor, round };
  }

  // accept if carrier >= floor
  if (offer >= floor) {
    return { decision: "accept", counter: offer, floor, round };
  }

  // counter decays 5% per round, never below floor
  const decay = Math.max(1 - 0.05 * round, floor / listPrice);
  const counter = Math.max(Math.round(listPrice * decay), floor);

  return { decision: "counter", counter, floor, round };
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({} as any));
  const sessionID = String(b.sessionID || "").trim();
  const loadID = String(b.loadID || "").trim();
  const listPrice = Number(b.listPrice);
  const carrierOffer =
    b.carrierOffer === undefined || b.carrierOffer === null
      ? undefined
      : Number(b.carrierOffer);

  if (!sessionID || !loadID || !Number.isFinite(listPrice)) {
    return NextResponse.json(
      { error: "Missing: sessionID, loadID, listPrice" },
      { status: 400 }
    );
  }

  const prev = SESSIONS.get(sessionID) ?? { loadID, listPrice, round: 0 };

  // if no offer yet, start with a high counter (e.g. 105% of list)
  if (!Number.isFinite(carrierOffer as number)) {
    const round = prev.round + 1;
    const floor = Math.round(listPrice * 0.9);
    const counter = Math.round(listPrice * 1.05);
    SESSIONS.set(sessionID, { loadID, listPrice, round });
    return NextResponse.json({
      decision: "counter",
      counter,
      floor,
      round,
      state: { sessionID, loadID, listPrice },
    });
  }

  const round = prev.round + 1;
  SESSIONS.set(sessionID, { loadID, listPrice, round });

  const r = decide(listPrice, carrierOffer as number, round);
  return NextResponse.json({
    decision: r.decision,     // "accept" | "counter" | "maxed"
    counter: r.counter,       // broker counter or null
    floor: r.floor,
    round: r.round,
    state: { sessionID, loadID, listPrice },
  });
}
// Reset negotiation state for a session
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionID = searchParams.get("sessionID");

  if (!sessionID) {
    return NextResponse.json({ error: "Missing sessionID" }, { status: 400 });
  }

  const had = SESSIONS.delete(sessionID);
  return NextResponse.json({
    sessionID,
    reset: had,
    message: had ? "Session reset" : "No existing session",
  });
}
