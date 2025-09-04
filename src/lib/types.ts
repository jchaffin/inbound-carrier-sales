export type EquipmentType =
  | "Dry Van"
  | "Reefer"
  | "Flatbed"
  | "Power Only"
  | "Box Truck";

export interface Load {
  load_id: string;
  origin: string;
  destination: string;
  pickup_datetime: string; // ISO string
  delivery_datetime: string; // ISO string
  equipment_type: EquipmentType;
  loadboard_rate: number; // USD
  notes?: string;
  weight?: number; // lbs
  commodity_type?: string;
  num_of_pieces?: number;
  miles?: number;
  dimensions?: string;
}

export interface CarrierVerification {
  mcNumber: string;
  legalName?: string;
  status: "active" | "inactive" | "not_found";
  eligible: boolean;
  insuranceValid?: boolean;
}

export type NegotiationOutcome =
  | "accepted"
  | "declined"
  | "expired"
  | "transferred";

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface Offer {
  proposedRate: number;
  timestamp: string; // ISO
  by: "carrier" | "system";
}

export interface NegotiationState {
  sessionId: string;
  loadId: string;
  listPrice: number;
  rounds: number;
  offers: Offer[];
  agreedRate?: number;
  outcome?: NegotiationOutcome;
  createdAt: string;
  updatedAt: string;
}

export interface CallLogEntry {
  id: string;
  mcNumber: string;
  loadId?: string;
  offers: Offer[];
  agreedRate?: number;
  outcome: NegotiationOutcome | "no_match" | "disconnected";
  sentiment: SentimentLabel;
  transcriptSummary?: string;
  createdAt: string;
}

export interface MetricsSummary {
  totalCalls: number;
  outcomes: Record<string, number>;
  sentiments: Record<SentimentLabel, number>;
  avgRounds: number;
  conversionRate: number; // accepted or transferred over total calls
}


