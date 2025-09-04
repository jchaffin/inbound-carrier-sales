import { NextRequest, NextResponse } from "next/server";
import { verifyCarrier } from "@/lib/fmcsa";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mc = searchParams.get("mc");
  if (!mc) {
    return NextResponse.json({ error: "Missing mc" }, { status: 400 });
  }
  const result = await verifyCarrier(mc);
  return NextResponse.json(result);
}


