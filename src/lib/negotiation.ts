import { NegotiationState, Offer } from "@/lib/types";

const MAX_ROUNDS = 3;

export function createNegotiation(
  sessionId: string,
  loadId: string,
  listPrice: number
): NegotiationState {
  const now = new Date().toISOString();
  return {
    sessionId,
    loadId,
    listPrice,
    rounds: 0,
    offers: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function evaluateCounter(
  state: NegotiationState,
  carrierOffer: number
): { state: NegotiationState; systemOffer?: Offer; done: boolean } {
  const updated: NegotiationState = {
    ...state,
    rounds: state.rounds + 1,
    offers: [
      ...state.offers,
      { by: "carrier", proposedRate: carrierOffer, timestamp: new Date().toISOString() },
    ],
    updatedAt: new Date().toISOString(),
  };

  // Acceptance threshold: allow down to 90% of list price progressively
  const minAcceptPct = 0.9 - (updated.rounds - 1) * 0.05; // 90%, 85%, 80%
  const minAccept = Math.round(updated.listPrice * Math.max(0.75, minAcceptPct));

  if (carrierOffer >= minAccept) {
    updated.agreedRate = carrierOffer;
    updated.outcome = "accepted";
    return { state: updated, done: true };
  }

  if (updated.rounds >= MAX_ROUNDS) {
    updated.outcome = "expired";
    return { state: updated, done: true };
  }

  // Counter with a midpoint between last system anchor and carrier offer
  const lastSystemOffer = updated.offers
    .filter((o) => o.by === "system")
    .slice(-1)[0]?.proposedRate ?? updated.listPrice;

  const counter = Math.round((lastSystemOffer + carrierOffer) / 2);
  const systemOffer: Offer = {
    by: "system",
    proposedRate: counter,
    timestamp: new Date().toISOString(),
  };
  updated.offers.push(systemOffer);

  return { state: updated, systemOffer, done: false };
}


