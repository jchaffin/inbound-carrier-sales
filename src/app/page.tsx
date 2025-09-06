// app/dashboard/page.tsx
type Row = {
  session_id: string;
  timestamp: string;
  outcome: string;
  sentiment: string;
  rounds?: number;
  decision?: string;
};

async function getData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const [aggRes, listRes] = await Promise.all([
    fetch(`${base}/api/metrics`, { cache: "no-store", headers: { "x-api-key": process.env.API_KEY ?? "dev" } }),
    fetch(`${base}/api/metrics/list?limit=25`, { cache: "no-store", headers: { "x-api-key": process.env.API_KEY ?? "dev" } }),
  ]);
  const agg = await aggRes.json();
  const list = await listRes.json();
  return { agg, rows: list.rows as Row[] };
}

function BucketBar({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data || {});
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => {
        const pct = Math.round((v / total) * 100);
        return (
          <div key={k}>
            <div className="flex justify-between text-sm">
              <span className="capitalize">{k}</span><span>{v} ({pct}%)</span>
            </div>
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-black/70 rounded" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      {entries.length === 0 && <div className="text-sm text-gray-500">No data</div>}
    </div>
  );
}

export default async function Dashboard() {
  const { agg, rows } = await getData();
  const calls = agg?.totals?.calls ?? 0;

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Inbound Carrier Sales — Dashboard</h1>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total calls</div>
          <div className="text-3xl font-bold">{calls}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Outcomes</div>
          <BucketBar data={agg?.outcome || {}} />
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Sentiment</div>
          <BucketBar data={agg?.sentiment || {}} />
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="mb-3 font-medium">Recent calls</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Session</th>
                <th className="py-2 pr-4">Outcome</th>
                <th className="py-2 pr-4">Sentiment</th>
                <th className="py-2 pr-4">Decision</th>
                <th className="py-2 pr-4">Rounds</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.session_id + r.timestamp} className="border-b last:border-0">
                  <td className="py-2 pr-4">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.session_id}</td>
                  <td className="py-2 pr-4 capitalize">{r.outcome}</td>
                  <td className="py-2 pr-4 capitalize">{r.sentiment}</td>
                  <td className="py-2 pr-4 capitalize">{r.decision ?? ""}</td>
                  <td className="py-2 pr-4">{r.rounds ?? ""}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-6 text-gray-500" colSpan={6}>No calls yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}