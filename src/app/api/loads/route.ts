// app/api/loads/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Load } from "@/lib/types";
import { searchLoads } from "@/lib/mockLoads";

let counter = 1000;

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const origin = sp.get("origin") || undefined;
  const destination = sp.get("destination") || undefined;
  const equipment_type = sp.get("equipment_type") || undefined;

  // accept both loadboard_rate and loadboardRate from query, if present
  const rawRate = sp.get("loadboard_rate") ?? sp.get("loadboardRate") ?? "1200.00";
  const parsedRate = (() => {
    const cleaned = rawRate.replace(/[^0-9.]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 1200;
  })();

  // Prefer a real load from mock data matching the lane/equipment
  const result = searchLoads({ origin, destination, equipment_type });
  const match = result[0];

  const load: Load = match ?? {
    load_id: `L-${counter++}`,
    origin: origin ?? "",
    destination: destination ?? "",
    equipment_type: equipment_type ?? "",
    pickup_datetime: sp.get("pickup_datetime") || new Date().toISOString(),
    delivery_datetime:
      sp.get("delivery_datetime") || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    loadboard_rate: parsedRate ?? 1200,
    notes: sp.get("notes") || "",
    weight: Number(sp.get("weight")) || 0,
    commodity_type: sp.get("commodity_type") || "",
    num_of_pieces: Number(sp.get("num_of_pieces")) || 0,
    miles: Number(sp.get("miles")) || 0,
    dimensions: sp.get("dimensions") || "",
  };

  // If query provided a rate explicitly, override the matched load's rate
  if (parsedRate !== undefined) {
    load.loadboard_rate = parsedRate;
  }

  // include camelCase aliases for platforms expecting different casing
  const withAliases: Load & {
    loadboardRate: number;
    pickupDatetime: string;
    deliveryDatetime: string;
    equipmentType: string;
    numOfPieces?: number;
  } = {
    ...load,
    loadboardRate: load.loadboard_rate || 1200,
    pickupDatetime: load.pickup_datetime,
    deliveryDatetime: load.delivery_datetime,
    equipmentType: load.equipment_type,
    numOfPieces: load.num_of_pieces,
  };

  // For maximum compat, return both the object and an array wrapper
  return NextResponse.json({
    ...withAliases,
    load: withAliases,
    results: [withAliases],
  });
}