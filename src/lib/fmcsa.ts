import { CarrierVerification } from "@/lib/types";

// Simple in-memory allowlist for demo
const MOCK_ACTIVE_MC = new Map<string, { legalName: string; insuranceValid: boolean }>([
  ["123456", { legalName: "Acme Logistics LLC", insuranceValid: true }],
  ["987654", { legalName: "Sunrise Transport Inc", insuranceValid: true }],
]);

export async function verifyCarrier(mcNumber: string): Promise<CarrierVerification> {
  const record = MOCK_ACTIVE_MC.get(mcNumber);
  if (!record) {
    return {
      mcNumber,
      status: "not_found",
      eligible: false,
    };
  }
  return {
    mcNumber,
    legalName: record.legalName,
    insuranceValid: record.insuranceValid,
    status: record.insuranceValid ? "active" : "inactive",
    eligible: record.insuranceValid,
  };
}

// Placeholder for real FMCSA API fetch scaffolding
export async function fetchFromFmcsaApi(_mcNumber: string): Promise<CarrierVerification> {
  // In a real integration, call FMCSA SAFER/LICENSING API here
  // Return normalized CarrierVerification
  return {
    mcNumber: _mcNumber,
    status: "inactive",
    eligible: false,
  };
}


