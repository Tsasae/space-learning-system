import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { resourceUsage, satisfactionHeatmap } from "../../data/mockData";
import { SectionHeader } from "../common/SectionHeader";

export function AnalyticsPanel() {
  return (
    <section className="space-y-6">
      <SectionHeader
        action={
          <button
            className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-50"
            type="button"
          >
            Share evaluation report
          </button>
        }
        description="Interactive reporting for student progress, resource usage, system performance, and continuous UX evaluation."
        eyebrow="Analytics & Reports"
        title="Evidence-driven monitoring and feedback"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">System performance</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resourceUsage}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f1c2e",
                    border: "1px solid rgba(148,163,184,0.16)",
                    borderRadius: 16,
                  }}
                />
                <Line dataKey="gpu" stroke="#7dd3fc" strokeWidth={3} type="monotone" />
                <Line dataKey="cpu" stroke="#34d399" strokeWidth={3} type="monotone" />
                <Line dataKey="storage" stroke="#f59e0b" strokeWidth={3} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">Learning effectiveness</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceUsage}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f1c2e",
                    border: "1px solid rgba(148,163,184,0.16)",
                    borderRadius: 16,
                  }}
                />
                <Bar dataKey="gpu" fill="#38bdf8" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">Satisfaction heatmap</p>
          <div className="mt-5 grid gap-3">
            {satisfactionHeatmap.map(([label, score]) => (
              <div key={label} className="grid grid-cols-[1fr_2fr_auto] items-center gap-3">
                <span className="text-sm text-slate-300">{label}</span>
                <div className="h-3 rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300"
                    style={{ width: `${(Number(score) / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-100">{score}/5</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">Feedback capture</p>
          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Course or system area"
            />
            <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none">
              <option>Satisfaction rating</option>
              <option>5 - Excellent</option>
              <option>4 - Good</option>
              <option>3 - Acceptable</option>
              <option>2 - Needs work</option>
            </select>
            <textarea
              className="h-40 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Describe usability issues, learning friction, or improvement ideas..."
            />
            <button
              className="w-full rounded-2xl bg-sky-300/15 px-4 py-3 text-sm font-medium text-sky-100"
              type="button"
            >
              Submit feedback
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
