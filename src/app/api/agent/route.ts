import { NextRequest, NextResponse } from "next/server";
import { verifyCarrier } from "@/lib/fmcsa";
import { searchLoads } from "@/lib/mockLoads";
import { createNegotiation, evaluateCounter } from "@/lib/negotiation";
import { classifyOutcomeFromState, classifySentiment } from "@/lib/classify";
import { logCall } from "@/lib/metrics";
import { NegotiationState } from "@/lib/types";

type AgentStep = "start" | "verify" | "search" | "negotiate" | "transfer" | "end";

interface AgentSession {
  id: string;
  step: AgentStep;
  mcNumber?: string;
  verified?: boolean;
  load?: any;
  negotiation?: NegotiationState;
}

const AGENT_SESSIONS = new Map<string, AgentSession>();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  let { sessionId, step, mcNumber, search, counterOffer, accept, transcriptSummary } = body as any;

  if (!sessionId) sessionId = crypto.randomUUID();
  let session = AGENT_SESSIONS.get(sessionId);
  if (!session) {
    session = { id: sessionId, step: "start" };
    AGENT_SESSIONS.set(sessionId, session);
  }

  step = (step as AgentStep) ?? session.step;

  // Step handlers
  if (step === "start") {
    session.step = "verify";
    return NextResponse.json({ sessionId, message: "Welcome. Please provide your MC number.", next: "verify" });
  }

  if (step === "verify") {
    if (!mcNumber) return NextResponse.json({ sessionId, message: "What is your MC number?" });
    const res = await verifyCarrier(mcNumber);
    session.mcNumber = mcNumber;
    session.verified = res.eligible;
    if (!res.eligible) {
      return NextResponse.json({ sessionId, message: "Sorry, we cannot proceed. Do you have another MC?", status: res });
    }
    session.step = "search";
    return NextResponse.json({ sessionId, message: "Great, what lane and equipment are you looking for? (origin, destination, equipment)", status: res, next: "search" });
  }

  if (step === "search") {
    if (!search) return NextResponse.json({ sessionId, message: "Please provide origin, destination, and equipment." });
    const [origin, destination, equipment_type] = [search.origin, search.destination, search.equipment_type];
    const results = searchLoads({ origin, destination, equipment_type });
    const load = results[0];
    if (!load) {
      return NextResponse.json({ sessionId, message: "No matching loads found. Would you like to try another search?" });
    }
    session.load = load;
    // Initialize negotiation
    session.negotiation = createNegotiation(sessionId, load.load_id, load.loadboard_rate);
    session.negotiation.offers.push({ by: "system", proposedRate: load.loadboard_rate, timestamp: new Date().toISOString() });
    session.step = "negotiate";
    const msg = `I found ${load.origin} → ${load.destination}, ${load.equipment_type}, pickup ${new Date(load.pickup_datetime).toLocaleString()}, listed at $${load.loadboard_rate}. Are you interested?`;
    return NextResponse.json({ sessionId, message: msg, load, anchor: load.loadboard_rate, next: "negotiate" });
  }

  if (step === "negotiate") {
    if (accept) {
      session.step = "transfer";
      const outcome = "transferred" as const;
      const sentiment = classifySentiment(transcriptSummary ?? "");
      // Log
      logCall({
        id: crypto.randomUUID(),
        mcNumber: session.mcNumber!,
        loadId: session.load?.load_id,
        offers: session.negotiation?.offers ?? [],
        agreedRate: session.negotiation?.agreedRate ?? session.negotiation?.offers.slice(-1)[0]?.proposedRate,
        outcome,
        sentiment,
        transcriptSummary,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ sessionId, message: "Great, transferring you to a sales rep now.", action: { type: "transfer", repPhone: "+1-555-0100" }, next: "end" });
    }
    if (typeof counterOffer === "number") {
      if (!session.load || !session.negotiation) return NextResponse.json({ sessionId, message: "Let's pick a load first." });
      const result = evaluateCounter(session.negotiation, counterOffer);
      session.negotiation = result.state;
      if (result.done) {
        const outcome = classifyOutcomeFromState(result.state);
        const sentiment = classifySentiment(transcriptSummary ?? "");
        logCall({
          id: crypto.randomUUID(),
          mcNumber: session.mcNumber!,
          loadId: session.load.load_id,
          offers: result.state.offers,
          agreedRate: result.state.agreedRate,
          outcome,
          sentiment,
          transcriptSummary,
          createdAt: new Date().toISOString(),
        });
        if (outcome === "accepted") {
          session.step = "transfer";
          return NextResponse.json({ sessionId, message: "Accepted. Transferring to sales rep.", action: { type: "transfer", repPhone: "+1-555-0100" }, next: "end" });
        }
        session.step = "end";
        return NextResponse.json({ sessionId, message: "No deal reached. Thanks for your time.", outcome });
      }
      return NextResponse.json({ sessionId, message: `How about $${result.systemOffer?.proposedRate}?`, state: result.state });
    }
    return NextResponse.json({ sessionId, message: "Would you like to accept the listed rate or make a counter offer?" });
  }

  if (step === "transfer") {
    return NextResponse.json({ sessionId, message: "Transferring to rep.", action: { type: "transfer", repPhone: "+1-555-0100" }, next: "end" });
  }

  return NextResponse.json({ sessionId, message: "Session ended." });
}


