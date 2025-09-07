"use client";
import useSWR from "swr";

type Log = {
  id?: string;
  mcNumber?: string;
  loadId?: string;
  offers?: Array<{ by: string; proposedRate: number; timestamp: string }>;
  agreedRate?: number;
  outcome?: string;
  sentiment?: string;
  createdAt?: string;
};

type MetricsResponse = {
  logs: Log[];
  metrics: {
    totalCalls: number;
    outcomes: Record<string, number>;
    sentiments: Record<string, number>;
    avgRounds: number;
    conversionRate: number;
  };
};

const fetcher = (url: string) =>
  fetch(url, { headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "dev" } }).then((r) =>
    r.json()
  );

export default function DashboardPage() {
  const { data } = useSWR<MetricsResponse>("/api/logs", fetcher, { refreshInterval: 3000 });
  const metrics = data?.metrics;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inbound Carrier Sales - Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Calls" value={metrics?.totalCalls ?? 0} />
        <Stat label="Conversion Rate" value={`${Math.round((metrics?.conversionRate ?? 0) * 100)}%`} />
        <Stat label="Avg Rounds" value={(metrics?.avgRounds ?? 0).toFixed(1)} />
        <Stat label="Positive Sentiment" value={metrics?.sentiments?.positive ?? 0} />
      </div>
      <section>
        <h2 className="text-xl font-semibold mb-2">Outcomes</h2>
        <div className="flex flex-wrap gap-2">
          {metrics &&
            Object.entries(metrics.outcomes).map(([k, v]) => (
              <span key={k} className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800">
                {k}: {v}
              </span>
            ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Recent Calls</h2>
        <div className="border rounded divide-y">
          {((data?.logs ?? []) as Log[]).slice(-20).reverse().map((log) => (
            <div key={log.id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm">
                <div className="font-medium">MC {log.mcNumber} → Load {log.loadId ?? "-"}</div>
                <div className="text-gray-500">Offers: {log.offers?.length ?? 0} • Rate: {log.agreedRate ?? "-"}</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge>{log.outcome}</Badge>
                <Badge>{log.sentiment}</Badge>
                <span className="text-gray-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded border bg-white dark:bg-black">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{children}</span>;
}


