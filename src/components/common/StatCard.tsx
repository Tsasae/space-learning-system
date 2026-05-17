import { MetricCardData } from "../../types";

const toneClasses: Record<MetricCardData["tone"], string> = {
  accent: "from-sky-400/20 to-cyan-300/5 text-sky-200",
  success: "from-emerald-400/20 to-emerald-300/5 text-emerald-200",
  warning: "from-amber-400/20 to-amber-300/5 text-amber-100",
};

export function StatCard({ title, value, delta, tone }: MetricCardData) {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div
        className={`mb-4 inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}
      >
        {title}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-semibold text-slate-50">{value}</p>
        <p className="text-sm text-slate-400">{delta}</p>
      </div>
    </div>
  );
}
