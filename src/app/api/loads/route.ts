// app/api/loads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchLoads } from "@/lib/mockLoads";

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const origin = u.searchParams.get("origin") ?? undefined;
  const destination = u.searchParams.get("destination") ?? undefined;
  const equipment_type = u.searchParams.get("equipment_type") ?? undefined;

  const matches = searchLoads({ origin, destination, equipment_type });
  if (!matches.length) {
    return NextResponse.json({ error: "no_match" }, { status: 404 });
  }

  const top = matches
    .slice()
    .sort((a, b) => +new Date(a.pickup_datetime) - +new Date(b.pickup_datetime))[0];

  // FLAT payload
  return NextResponse.json(top);
}