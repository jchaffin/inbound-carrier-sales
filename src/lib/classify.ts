import { NegotiationState, NegotiationOutcome, SentimentLabel } from "@/lib/types";

const POSITIVE_WORDS = ["great", "good", "yes", "accept", "thanks", "perfect"];
const NEGATIVE_WORDS = ["no", "bad", "reject", "hate", "angry", "terrible", "worst"];

export function classifySentiment(text: string): SentimentLabel {
  const t = text.toLowerCase();
  const pos = POSITIVE_WORDS.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
  const neg = NEGATIVE_WORDS.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

export function classifyOutcomeFromState(state: NegotiationState): NegotiationOutcome {
  if (state.outcome) return state.outcome;
  if (typeof state.agreedRate === "number") return "accepted";
  return state.rounds >= 3 ? "expired" : "declined";
}


