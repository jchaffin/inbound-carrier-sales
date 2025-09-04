import { NextRequest, NextResponse } from "next/server";
import { createNegotiation, evaluateCounter } from "@/lib/negotiation";
import { NegotiationState } from "@/lib/types";

const SESSIONS = new Map<string, NegotiationState>();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { sessionId, loadId, listPrice, carrierOffer } = body as {
    sessionId?: string;
    loadId?: string;
    listPrice?: number;
    carrierOffer?: number;
  };

  if (!sessionId || !loadId || typeof listPrice !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let state = SESSIONS.get(sessionId);
  if (!state) {
    state = createNegotiation(sessionId, loadId, listPrice);
    // anchor with list price as first system offer
    state.offers.push({ by: "system", proposedRate: listPrice, timestamp: new Date().toISOString() });
    SESSIONS.set(sessionId, state);
  }

  if (typeof carrierOffer === "number") {
    const result = evaluateCounter(state, carrierOffer);
    SESSIONS.set(sessionId, result.state);
    return NextResponse.json(result);
  }

  return NextResponse.json({ state });
}


