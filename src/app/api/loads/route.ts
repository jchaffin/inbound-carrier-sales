// app/api/loads/route.ts
import { NextRequest, NextResponse } from "next/server";

type Load = {
  load_id: string;
  origin: string;
  destination: string;
  equipment_type: string;
  pickup_datetime: string;
  delivery_datetime: string;
  loadboard_rate: number;
  notes: string;
  weight: number;
  commodity_type: string;
  num_of_pieces: number;
  miles: number;
  dimensions: string;
};

let counter = 1000;

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  const load: Load = {
    load_id: `L-${counter++}`,
    origin: sp.get("origin") || "",
    destination: sp.get("destination") || "",
    equipment_type: sp.get("equipment_type") || "",
    pickup_datetime: sp.get("pickup_datetime") || "",
    delivery_datetime: sp.get("delivery_datetime") || "",
    loadboard_rate: Number(sp.get("loadboard_rate")) || 0,
    notes: sp.get("notes") || "",
    weight: Number(sp.get("weight")) || 0,
    commodity_type: sp.get("commodity_type") || "",
    num_of_pieces: Number(sp.get("num_of_pieces")) || 0,
    miles: Number(sp.get("miles")) || 0,
    dimensions: sp.get("dimensions") || "",
  };

  // ✅ return just one load
  return NextResponse.json(load);
}