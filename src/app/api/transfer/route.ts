// app/api/transfer/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Optional: you can capture the payload if you want to log/debug
  const body = await req.json().catch(() => ({}));

  console.log("Mock TransferCall invoked:", body);

  return NextResponse.json({
    status: "complete",
    message: "Call successfully transferred to sales rep (mock).",
  });
}