import { NextRequest, NextResponse } from "next/server";

type Session = {
  loadID: string;
  listPrice: number;
  round: number;          // increments when an offer is evaluated
  lastCounter?: number;   // last counter we gave
};

// in-memory session store
const SESSIONS = new Map<string, Session>();

// policy knobs
const MAX_ROUNDS = 3;            // after this -> reject
const FLOOR_PCT   = 0.90;        // 90% of list is our hard floor
const STEP_PCT    = 0.05;        // counters step down 5% per round

function firstCounter(listPrice: number) {
  // first ask: 5% below list
  return Math.round(listPrice * (1 - STEP_PCT));
}

function floorPrice(listPrice: number) {
  return Math.round(listPrice * FLOOR_PCT);
}

function counterForRound(listPrice: number, round: number) {
  // round starts at 1 on first evaluated offer
  const decayed = Math.round(listPrice * (1 - STEP_PCT * round));
  return Math.max(decayed, floorPrice(listPrice));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));

  const sessionID = String(body.sessionID || "").trim();
  const loadID    = String(body.loadID    || "").trim();
  const listPrice = Number(body.listPrice);

  // carrierOffer can be omitted on the very first call
  const hasOffer      = body.carrierOffer !== undefined && body.carrierOffer !== null;
  const carrierOffer  = hasOffer ? Number(body.carrierOffer) : undefined;

  if (!sessionID || !loadID || !Number.isFinite(listPrice)) {
    return NextResponse.json(
      { error: "Missing: sessionID, loadID, listPrice" },
      { status: 400 }
    );
  }

  // init session if new
  const state = SESSIONS.get(sessionID) ?? { loadID, listPrice, round: 0 };
  SESSIONS.set(sessionID, state);

  // no offer yet -> tell the agent what to ask for first
  if (!hasOffer) {
    const seed = firstCounter(listPrice);
    state.lastCounter = seed;
    return NextResponse.json({
      message: "awaiting_offer",
      seedCounter: seed,
      floor: floorPrice(listPrice),
      state: { sessionID, loadID, listPrice, round: state.round }
    });
  }

  // evaluate an offer
  state.round += 1;

  const floor = floorPrice(listPrice);

  // accept if at/above floor
  if (carrierOffer! >= floor) {
    return NextResponse.json({
      decision: "accept",
      counter: carrierOffer, // accept their price
      floor,
      round: state.round,
      state: { sessionID, loadID, listPrice }
    });
  }

  // max rounds reached -> hard reject, no counter
  if (state.round >= MAX_ROUNDS) {
    return NextResponse.json({
      decision: "reject",
      counter: 0,
      floor,
      round: state.round,
      state: { sessionID, loadID, listPrice }
    });
  }

  // otherwise counter down by 5% per round, not below floor
  const ctr = counterForRound(listPrice, state.round);
  state.lastCounter = ctr;

  return NextResponse.json({
    decision: "counter",
    counter: ctr,
    floor,
    round: state.round,
    state: { sessionID, loadID, listPrice }
  });
}

// Optional: inspect/clear sessions during demos
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("reset") === "1") {
    SESSIONS.clear();
    return NextResponse.json({ ok: true, cleared: true });
  }
  const dump = Array.from(SESSIONS.entries()).map(([k, v]) => ({ sessionID: k, ...v }));
  return NextResponse.json({ sessions: dump });
}