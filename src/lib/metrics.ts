import { CallLogEntry, MetricsSummary, SentimentLabel } from "@/lib/types";

const CALL_LOGS: CallLogEntry[] = [];

export function logCall(entry: CallLogEntry) {
  CALL_LOGS.push(entry);
}

export function getLogs(): CallLogEntry[] {
  return CALL_LOGS.slice(-500);
}

export function summarize(): MetricsSummary {
  const totalCalls = CALL_LOGS.length;
  const outcomes: Record<string, number> = {};
  const sentiments: Record<SentimentLabel, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  let totalRounds = 0;
  let totalConversions = 0;

  for (const log of CALL_LOGS) {
    outcomes[log.outcome] = (outcomes[log.outcome] ?? 0) + 1;
    sentiments[log.sentiment] += 1;
    totalRounds += log.offers.length;
    if (log.outcome === "accepted" || log.outcome === "transferred") totalConversions += 1;
  }

  const avgRounds = totalCalls ? totalRounds / totalCalls : 0;
  const conversionRate = totalCalls ? totalConversions / totalCalls : 0;

  return { totalCalls, outcomes, sentiments, avgRounds, conversionRate };
}


