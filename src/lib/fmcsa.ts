import { CarrierVerification } from "@/lib/types";

// Simple in-memory allowlist for demo when no API key is configured
const MOCK_ACTIVE_MC = new Map<string, { legalName: string; insuranceValid: boolean }>([
  ["123456", { legalName: "Acme Logistics LLC", insuranceValid: true }],
  ["987654", { legalName: "Sunrise Transport Inc", insuranceValid: true }],
]);

export async function verifyCarrier(mcNumber: string): Promise<CarrierVerification> {
  const apiKey = process.env.FMCSA_API_KEY;
  if (apiKey) {
    try {
      return await fetchFromFmcsaApi(mcNumber, apiKey);
    } catch {
      // Fall through to mock on any API failure
    }
  }

  const record = MOCK_ACTIVE_MC.get(mcNumber);
  if (!record) {
    return { mcNumber, status: "not_found", eligible: false };
  }
  return {
    mcNumber,
    legalName: record.legalName,
    insuranceValid: record.insuranceValid,
    status: record.insuranceValid ? "active" : "inactive",
    eligible: record.insuranceValid,
  };
}

// Minimal real API fetch with env-configurable base URL
type FmcsaResponse = {
  legal_name?: string;
  name?: string;
  status?: "active" | "inactive" | string;
  insurance_valid?: boolean;
  insurance?: { valid?: boolean };
};

export async function fetchFromFmcsaApi(mcNumber: string, apiKey: string): Promise<CarrierVerification> {
  const base = process.env.FMCSA_BASE_URL || "https://api.fmcsa.example";
  const url = `${base}/carriers/${encodeURIComponent(mcNumber)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    // 5s timeout via AbortController could be added if desired
  });
  if (!res.ok) throw new Error(`FMCSA ${res.status}`);
  const data = (await res.json()) as FmcsaResponse;
  // Normalize fields from hypothetical FMCSA response
  const insuranceValid = Boolean(data?.insurance_valid ?? data?.insurance?.valid);
  const status = (data?.status ?? (insuranceValid ? "active" : "inactive")) as CarrierVerification["status"];
  return {
    mcNumber,
    legalName: data?.legal_name ?? data?.name,
    status: status === "active" || status === "inactive" ? status : insuranceValid ? "active" : "inactive",
    eligible: insuranceValid,
    insuranceValid,
  };
}


