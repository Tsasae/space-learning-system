import { API_URL } from '../config';
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "../components/common/SectionHeader";


const ML_FALLBACK = {
  precision: 0.878,
  recall: 1.0,
  accuracy: 0.99,
  f1_score: 0.935,
  roc_auc: 0.997,
};

const PERF_DATA = [
  { size: "1,000", bigquery: 2.201, pandas: 0.002 },
  { size: "10,000", bigquery: 2.62, pandas: 0.002 },
  { size: "50,000", bigquery: 7.273, pandas: 0.006 },
  { size: "100,000", bigquery: 11.553, pandas: 0.011 },
  { size: "572,137", bigquery: 60.891, pandas: 0.045 },
];

const TOOLTIP_STYLE = {
  background: "#0f1c2e",
  border: "1px solid rgba(148,163,184,0.16)",
  borderRadius: 16,
};

const ML_COLORS = ["#7dd3fc", "#34d399", "#a78bfa", "#f59e0b", "#fb7185"];

const LANDSAT_SAT_FALLBACK = [
  { spacecraft_id: "LANDSAT_1", scene_count: 298000 },
  { spacecraft_id: "LANDSAT_2", scene_count: 452000 },
  { spacecraft_id: "LANDSAT_3", scene_count: 510000 },
  { spacecraft_id: "LANDSAT_4", scene_count: 820000 },
  { spacecraft_id: "LANDSAT_5", scene_count: 2480000 },
  { spacecraft_id: "LANDSAT_7", scene_count: 2990000 },
  { spacecraft_id: "LANDSAT_8", scene_count: 2058135 },
];

const COMPARISON_ROWS = [
  { dataset: "NASA Wildfire", records: "572,137", model: "Logistic Reg", score: "99.0%" },
  { dataset: "Landsat Index", records: "9,608,135", model: "Linear Reg", score: "R²=1.0" },
];

function bqDate(val: any): string {
  return typeof val === "object" ? val?.value ?? "" : val ?? "";
}

export default function CloudAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [mlResults, setMlResults] = useState<any>(null);
  const [wildfireRows, setWildfireRows] = useState<any[]>([]);
  const [landsatBySat, setLandsatBySat] = useState<any[]>(LANDSAT_SAT_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      const [statsResult, mlResult, wildfireResult, landsatBySatResult] = await Promise.allSettled([
        fetch(`${API_URL}/api/bigquery/stats`, { signal }).then((r) => {
          if (!r.ok) throw new Error("stats failed");
          return r.json();
        }),
        fetch(`${API_URL}/api/bigquery/ml-results`, { signal }).then((r) => {
          if (!r.ok) throw new Error("ml-results failed");
          return r.json();
        }),
        fetch(`${API_URL}/api/bigquery/wildfire?limit=500&confidence=high`, { signal }).then((r) => {
          if (!r.ok) throw new Error("wildfire failed");
          return r.json();
        }),
        fetch(`${API_URL}/api/bigquery/landsat-by-satellite`, { signal }).then((r) => {
          if (!r.ok) throw new Error("landsat-by-satellite failed");
          return r.json();
        }),
      ]);

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value?.data ?? statsResult.value);
      }
      if (mlResult.status === "fulfilled") {
        setMlResults(mlResult.value?.data ?? mlResult.value ?? ML_FALLBACK);
      }
      if (wildfireResult.status === "fulfilled") {
        const d = wildfireResult.value;
        const rows = d?.data ?? d ?? [];
        setWildfireRows(rows.slice(0, 20));
      }
      if (landsatBySatResult.status === "fulfilled") {
        const d = landsatBySatResult.value;
        const rows = d?.data ?? d ?? [];
        if (rows.length > 0) setLandsatBySat(rows);
      }

      const anyFailed = [statsResult, mlResult, wildfireResult, landsatBySatResult].some((r) => r.status === "rejected");
      if (anyFailed && !signal.aborted) {
        setError("Зарим өгөгдлийг татаж чадсангүй. Боломжтой бол fallback өгөгдлийг харуулна.");
      }

      if (!signal.aborted) setLoading(false);
    }

    fetchAll();
    return () => controller.abort();
  }, []);

  const mlData = mlResults ?? ML_FALLBACK;
  const mlChartData = [
    { metric: "Precision", value: mlData.precision },
    { metric: "Recall", value: mlData.recall },
    { metric: "Accuracy", value: mlData.accuracy },
    { metric: "F1-Score", value: mlData.f1_score },
    { metric: "ROC-AUC", value: mlData.roc_auc },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Cloud Analytics"
        title="Cloud Analytics"
        description="NASA Wildfire BigQuery — үүлэн орчинд их өгөгдлийн шинжилгээ"
      />

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-300/20 border-t-sky-300" />
        </div>
      )}

      {!loading && error && (
        <div className="glass-panel rounded-[28px] border border-amber-300/20 bg-amber-300/5 px-5 py-4 text-sm text-amber-300">
          {error}
        </div>
      )}

      {!loading && (
        <>
          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Records" value={stats.total_records?.toLocaleString() ?? "—"} />
              <StatCard label="High Confidence" value={stats.high_confidence?.toLocaleString() ?? "—"} />
              <StatCard label="Avg Brightness" value={Number(stats.avg_brightness).toFixed(2)} />
              <StatCard label="Data Source" value="BigQuery Cloud" accent />
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-sm font-medium text-slate-100">ML Model Results</p>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mlChartData} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis
                      dataKey="metric"
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 1]}
                      tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, ""]}
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {mlChartData.map((_, i) => (
                        <Cell key={i} fill={ML_COLORS[i % ML_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-sm font-medium text-slate-100">
                BigQuery vs Pandas Хурдны Харьцуулалт
              </p>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={PERF_DATA} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis
                      dataKey="size"
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      unit="s"
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [`${v}s`, ""]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                    />
                    <Bar dataKey="bigquery" name="BigQuery" fill="#4285F4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pandas" name="Pandas" fill="#EA4335" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                BigQuery: cloud дата татах | Pandas: локал боловсруулалт
              </p>
            </div>
          </div>

          {/* ── Landsat section ── */}
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">
              Landsat Dataset
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">
              Google BigQuery — Landsat Index
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Scenes" value="9,608,135" />
            <StatCard label="Satellites" value="7" />
            <StatCard label="Period" value="1972–2021" />
            <StatCard label="Source" value="Google BigQuery" accent />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="glass-panel rounded-[28px] p-6">
              <p className="text-sm font-medium text-slate-100">Scenes per Spacecraft</p>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={landsatBySat}
                    margin={{ top: 0, right: 0, left: 0, bottom: 32 }}
                  >
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis
                      dataKey="spacecraft_id"
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      angle={-35}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number) => [v.toLocaleString(), "Scenes"]}
                    />
                    <Bar dataKey="scene_count" radius={[8, 8, 0, 0]}>
                      {landsatBySat.map((_, i) => (
                        <Cell key={i} fill={ML_COLORS[i % ML_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-6">
              <p className="mb-4 text-sm font-medium text-slate-100">Dataset Comparison</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    {["Dataset", "Records", "ML Model", "R² / Accuracy"].map((col) => (
                      <th
                        key={col}
                        className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.dataset} className="text-slate-300 transition hover:bg-white/5">
                      <td className="py-3 pr-4 font-medium text-slate-100">{row.dataset}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{row.records}</td>
                      <td className="py-3 pr-4">{row.model}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-300">
                          {row.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {wildfireRows.length > 0 && (
            <div className="glass-panel rounded-[28px] p-6">
              <p className="mb-4 text-sm font-medium text-slate-100">
                NASA Wildfire Бичлэгүүд (BigQuery-аас бодит цагаар)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      {["Latitude", "Longitude", "Bright Ti4", "Confidence", "Acq Date", "Satellite"].map(
                        (col) => (
                          <th
                            key={col}
                            className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {wildfireRows.map((row, i) => (
                      <tr key={i} className="text-slate-300 transition hover:bg-white/5">
                        <td className="py-2 pr-4">{row.latitude}</td>
                        <td className="py-2 pr-4">{row.longitude}</td>
                        <td className="py-2 pr-4">{row.bright_ti4}</td>
                        <td className="py-2 pr-4">
                          <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-xs text-sky-300">
                            {row.confidence}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{bqDate(row.acq_date)}</td>
                        <td className="py-2">{row.satellite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-panel rounded-[28px] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-sky-300" : "text-slate-50"}`}>
        {value}
      </p>
    </div>
  );
}
