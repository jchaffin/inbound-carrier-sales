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
const FLOOR_PCT = 0.90;   // 90% of list is hard floor
const STEP_PCT  = 0.05;   // counters step down 5% per round

const firstCounter = (listPrice: number) => Math.round(listPrice * (1 - STEP_PCT));
const floorPrice  = (listPrice: number) => Math.round(listPrice * FLOOR_PCT);
const counterForRound = (listPrice: number, round: number) =>
  Math.max(Math.round(listPrice * (1 - STEP_PCT * round)), floorPrice(listPrice));

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

  if (!sessionID || !loadID || !Number.isFinite(listPrice)) {
    return NextResponse.json(
      { error: "Missing: sessionID, loadID, listPrice" },
      { status: 400 }
    );
  }

  // init session
  const state = SESSIONS.get(sessionID) ?? { loadID, listPrice, round: 0 };
  SESSIONS.set(sessionID, state);

  // FIRST CALL (no offer) -> immediately COUNTER
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

  // Accept if the supplied offer meets or beats our floor
  if (carrierOffer! >= floor) {
    return NextResponse.json({
      decision: "accept",
      counter: carrierOffer,
      floor,
      round: state.round,
      state: { sessionID, loadID, listPrice }
    });
  }

  // Hit max rounds -> MAXXED (no further counter)
  if (state.round > MAX_ROUNDS) {
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