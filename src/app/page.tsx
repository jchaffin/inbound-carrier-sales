"use client";
import { useCallback, useMemo, useState } from "react";

export default function Home() {
  const [mc, setMc] = useState("");
  const [verified, setVerified] = useState<any>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipment, setEquipment] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [selected, setSelected] = useState<any>(null);
  const [systemOffer, setSystemOffer] = useState<number | null>(null);
  const [carrierOffer, setCarrierOffer] = useState<string>("");
  const [state, setState] = useState<any>(null);

  const headers = useMemo(
    () => ({ "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "dev" }),
    []
  );

  const verify = useCallback(async () => {
    const r = await fetch(`/api/verify?mc=${mc}`, { headers });
    const data = await r.json();
    setVerified(data);
  }, [mc, headers]);

  const search = useCallback(async () => {
    const params = new URLSearchParams({ origin, destination, equipment_type: equipment });
    const r = await fetch(`/api/loads?${params.toString()}`, { headers });
    const data = await r.json();
    setResults(data.results ?? []);
  }, [origin, destination, equipment, headers]);

  const startNegotiation = useCallback(async (load: any) => {
    const sid = crypto.randomUUID();
    setSessionId(sid);
    setSelected(load);
    const r = await fetch(`/api/negotiate`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ sessionId: sid, loadId: load.load_id, listPrice: load.loadboard_rate }),
    });
    const data = await r.json();
    setState(data.state);
    const lastSystem = data.state?.offers?.filter((o: any) => o.by === "system").slice(-1)[0];
    setSystemOffer(lastSystem?.proposedRate ?? load.loadboard_rate);
  }, [headers]);

  const counter = useCallback(async () => {
    if (!selected || !sessionId) return;
    const r = await fetch(`/api/negotiate`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        loadId: selected.load_id,
        listPrice: selected.loadboard_rate,
        carrierOffer: Number(carrierOffer || 0),
      }),
    });
    const data = await r.json();
    setState(data.state);
    setSystemOffer(data.systemOffer?.proposedRate ?? null);
  }, [headers, sessionId, selected, carrierOffer]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inbound Carrier Sales - POC</h1>
      <section className="space-y-3">
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-sm text-gray-600">MC Number</label>
            <input className="border rounded px-3 py-2" value={mc} onChange={(e) => setMc(e.target.value)} />
          </div>
          <button className="px-3 py-2 rounded bg-black text-white" onClick={verify}>Verify</button>
          {verified && (
            <span className="text-sm">
              {verified.eligible ? "Eligible" : "Not eligible"}
              {verified.legalName ? ` • ${verified.legalName}` : ""}
            </span>
          )}
        </div>
      </section>
      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input placeholder="Origin" className="border rounded px-3 py-2" value={origin} onChange={(e) => setOrigin(e.target.value)} />
          <input placeholder="Destination" className="border rounded px-3 py-2" value={destination} onChange={(e) => setDestination(e.target.value)} />
          <input placeholder="Equipment" className="border rounded px-3 py-2" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
          <button className="px-3 py-2 rounded bg-black text-white" onClick={search}>Search Loads</button>
        </div>
        <div className="border rounded divide-y">
          {results.map((l) => (
            <div key={l.load_id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm">
                <div className="font-medium">{l.origin} → {l.destination} • {l.equipment_type}</div>
                <div className="text-gray-500">Pickup {new Date(l.pickup_datetime).toLocaleString()} • List ${l.loadboard_rate}</div>
              </div>
              <button className="px-3 py-1.5 rounded bg-gray-900 text-white" onClick={() => startNegotiation(l)}>Negotiate</button>
            </div>
          ))}
        </div>
      </section>
      {selected && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Negotiation</h2>
          <div className="text-sm">System offer: {systemOffer ? `$${systemOffer}` : "-"}</div>
          <div className="flex gap-2 items-end">
            <input placeholder="Your counter" className="border rounded px-3 py-2" value={carrierOffer} onChange={(e) => setCarrierOffer(e.target.value)} />
            <button className="px-3 py-2 rounded bg-black text-white" onClick={counter}>Send Counter</button>
          </div>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(state, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
