// lib/metricsStore.ts
export type Row = {
  session_id: string;
  timestamp: string;
  outcome: string;
  sentiment: string;
  rounds?: number;
  decision?: string;
};

export const DB: Row[] = [];
export const OUT = new Map<string, number>();
export const SEN = new Map<string, number>();
export const DEC = new Map<string, number>();

export function bump(map: Map<string, number>, key: string) {
  const k = (key || "unknown").toLowerCase();
  map.set(k, (map.get(k) ?? 0) + 1);
}

export function summary() {
  return {
    totals: { calls: DB.length },
    outcome: Object.fromEntries(OUT.entries()),
    sentiment: Object.fromEntries(SEN.entries()),
    decision: Object.fromEntries(DEC.entries()),
  };
}

export function list(limit = 50) {
  return DB.slice(-limit).reverse();
}

export function reset() {
  DB.length = 0;
  OUT.clear(); SEN.clear(); DEC.clear();
}

// HappyRobot session status events
export type HrStatusEvent = {
  id: string;
  sessionId: string;
  previous: string;
  current: string;
  updatedAt: string;
  time: string;
};

export const HR_STATUS_EVENTS: HrStatusEvent[] = [];

export function recordHrStatus(evt: HrStatusEvent) {
  HR_STATUS_EVENTS.push(evt);
}
