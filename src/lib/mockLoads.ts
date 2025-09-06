import { Load } from "@/lib/types";

export const MOCK_LOADS: Load[] = [
  {
    load_id: "L-1001",
    origin: "Chicago, IL",
    destination: "Dallas, TX",
    pickup_datetime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    delivery_datetime: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    equipment_type: "Dry Van",
    loadboard_rate: 2200,
    notes: "No pallets exchange",
    weight: 38000,
    commodity_type: "Consumer goods",
    num_of_pieces: 22,
    miles: 968,
    dimensions: "48'x102'",
  },
  {
    load_id: "L-1002",
    origin: "Atlanta, GA",
    destination: "Orlando, FL",
    pickup_datetime: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    delivery_datetime: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    equipment_type: "Reefer",
    loadboard_rate: 1400,
    notes: "Maintain 36°F",
    weight: 30000,
    commodity_type: "Produce",
    num_of_pieces: 18,
    miles: 440,
    dimensions: "53'x102'",
  },
  {
    load_id: "L-1003",
    origin: "Los Angeles, CA",
    destination: "Phoenix, AZ",
    pickup_datetime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    delivery_datetime: new Date(Date.now() + 30 * 3600 * 1000).toISOString(),
    equipment_type: "Flatbed",
    loadboard_rate: 1200,
    notes: "Tarp required",
    weight: 42000,
    commodity_type: "Steel",
    num_of_pieces: 10,
    miles: 372,
    dimensions: "48'x102'",
  },
  {
    load_id: "L-1004",
    origin: "Los Angeles, CA",
    destination: "Phoenix, AZ",
    pickup_datetime: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    delivery_datetime: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    equipment_type: "Reefer",
    loadboard_rate: 1400,
    notes: "Maintain 36°F",

  }
];

export function searchLoads(query: {
  origin?: string;
  destination?: string;
  equipment_type?: string;
}): Load[] {
  const { origin, destination, equipment_type } = query;
  return MOCK_LOADS.filter((l) => {
    const originMatch = origin
      ? l.origin.toLowerCase().includes(origin.toLowerCase())
      : true;
    const destMatch = destination
      ? l.destination.toLowerCase().includes(destination.toLowerCase())
      : true;
    const equipMatch = equipment_type
      ? l.equipment_type.toLowerCase() === equipment_type.toLowerCase()
      : true;
    return originMatch && destMatch && equipMatch;
  });
}


