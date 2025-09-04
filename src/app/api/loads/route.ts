import { NextRequest, NextResponse } from "next/server";
import { searchLoads } from "@/lib/mockLoads";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin") ?? undefined;
  const destination = searchParams.get("destination") ?? undefined;
  const equipment_type = searchParams.get("equipment_type") ?? undefined;

  const results = searchLoads({ origin, destination, equipment_type });
  return NextResponse.json({ results });
}


