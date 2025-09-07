import { NextRequest, NextResponse } from "next/server";

type Session = {
  loadID: string;
  listPrice: number;
  round: number;          // increments when an offer is evaluated
  lastCounter?: number;   // last counter we gave
};

// in-memory session store
const SESSIONS = new Map<string, Session>();

const MAX_ROUNDS = 3;     // after this -> maxxed
const STEP_ABS   = 100;   // decrement $100 per round

const firstCounter = (listPrice: number) => Math.round(listPrice); // start at list
const floorPrice  = (listPrice: number) => Math.round(listPrice - STEP_ABS * 2); // e.g., 1200 -> 1000
const counterForRound = (listPrice: number, round: number) =>
  Math.max(Math.round(listPrice - STEP_ABS * (round - 1)), floorPrice(listPrice));

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = body[k];
      if (v !== undefined && v !== null && String(v).length > 0) return v;
    }
    return undefined;
  };

  const sessionID = String(pick("sessionID", "sessionId", "session_id") || "").trim();
  const loadID    = String(pick("loadID", "loadId", "load_id") || "").trim();
  const listPrice = Number(pick("listPrice", "list_price")); // support typos/case

  const offerRaw = pick("carrierOffer", "carrier_offer", "offer");
  const hasOffer = offerRaw !== undefined && offerRaw !== null && String(offerRaw).length > 0;
  const carrierOffer = hasOffer ? Number(offerRaw) : undefined;
  const acceptedRaw = pick("accept", "accepted");
  const accepted = (() => {
    if (acceptedRaw === undefined || acceptedRaw === null) return false;
    if (typeof acceptedRaw === "boolean") return acceptedRaw;
    const v = String(acceptedRaw).trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "y" || v === "accept" || v === "accepted";
  })();

  if (!sessionID || !loadID || !Number.isFinite(listPrice)) {
    return NextResponse.json(
      { error: "Missing: sessionID, loadID, listPrice" },
      { status: 400 }
    );
  }

  // init session
  const state = SESSIONS.get(sessionID) ?? { loadID, listPrice, round: 0 };
  SESSIONS.set(sessionID, state);

  // FIRST CALL (no offer) -> immediately COUNTER at list price
  if (!hasOffer) {
    state.round = 1;
    const ctr = firstCounter(listPrice);
    state.lastCounter = ctr;
    SESSIONS.set(sessionID, state);
    return NextResponse.json({
      decision: "counter",
      counter: ctr,
      floor: floorPrice(listPrice),
      round: state.round,
      state: { sessionID, loadID, listPrice }
    });
  }

  // Subsequent calls (evaluate last counter / new offer)
  state.round += 1;
  const floor = floorPrice(listPrice);

  // Accept only if explicitly indicated
  if (accepted) {
    return NextResponse.json({
      decision: "accept",
      counter: carrierOffer ?? state.lastCounter ?? listPrice,
      floor,
      round: state.round,
      state: { sessionID, loadID, listPrice }
    });
  }

  // Hit max rounds -> MAXXED (no further counter)
  if (state.round >= MAX_ROUNDS) {
    return NextResponse.json({
      decision: "maxxed",
      counter: 0,
      floor,
      round: state.round,
      state: { sessionID, loadID, listPrice }
    });
  }

  // Otherwise produce the next counter (5% step, not below floor)
  const ctr = counterForRound(listPrice, state.round);
  state.lastCounter = ctr;
  SESSIONS.set(sessionID, state);

  return NextResponse.json({
    decision: "counter",
    counter: ctr,
    floor,
    round: state.round,
    state: { sessionID, loadID, listPrice }
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("reset") === "1") {
    SESSIONS.clear();
    return NextResponse.json({ ok: true, cleared: true });
  }
  const dump = Array.from(SESSIONS.entries()).map(([k, v]) => ({ sessionID: k, ...v }));
  return NextResponse.json({ sessions: dump });
}