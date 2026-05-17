import {
  Activity,
  ArrowRight,
  BookCheck,
  Clock3,
  Cpu,
  PlayCircle,
  ServerCog,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adminMetrics,
  engagementBreakdown,
  instructorMetrics,
  studentMetrics,
  systemTimeline,
} from "../../data/mockData";
import { UserRole } from "../../types";
import { SectionHeader } from "../common/SectionHeader";
import { StatCard } from "../common/StatCard";

interface RoleDashboardProps {
  role: UserRole;
}

const roleCopy: Record<UserRole, { title: string; description: string }> = {
  admin: {
    title: "System observability and mission readiness",
    description:
      "Track Prometheus-style resource pressure, platform responsiveness, and active learning operations across the full cloud stack.",
  },
  instructor: {
    title: "Teaching operations and learner momentum",
    description:
      "See course engagement, completion health, active lab demand, and where intervention will most improve outcomes.",
  },
  student: {
    title: "Your lunar science mission console",
    description:
      "Keep moving with quick actions, module progress, and direct paths into simulations, notebooks, and assignments.",
  },
};

const pieColors = ["#7dd3fc", "#38bdf8", "#22d3ee", "#34d399", "#f59e0b"];

export function RoleDashboard({ role }: RoleDashboardProps) {
  const metrics =
    role === "admin"
      ? adminMetrics
      : role === "instructor"
        ? instructorMetrics
        : studentMetrics;

  return (
    <section className="space-y-6">
      <SectionHeader
        action={
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15"
            type="button"
          >
            Export live report
            <ArrowRight className="h-4 w-4" />
          </button>
        }
        description={roleCopy[role].description}
        eyebrow="Role-based Dashboard"
        title={roleCopy[role].title}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="glass-panel rounded-[28px] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Real-time platform timeline</p>
              <p className="text-sm text-slate-400">
                CPU usage, response latency, and active sessions
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              <Activity className="h-4 w-4" />
              Live sync
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemTimeline}>
                <defs>
                  <linearGradient id="cpuFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#7dd3fc" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#7dd3fc" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="latencyFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  dataKey="cpu"
                  stroke="#7dd3fc"
                  strokeWidth={2}
                  fill="url(#cpuFill)"
                  type="monotone"
                />
                <Area
                  dataKey="response"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#latencyFill)"
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-sky-400/10 p-3 text-sky-200">
                {role === "admin" ? <ServerCog className="h-5 w-5" /> : <BookCheck className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-100">Engagement profile</p>
                <p className="text-xs text-slate-400">Module interaction health</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementBreakdown}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={86}
                    paddingAngle={4}
                  >
                    {engagementBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f1c2e",
                      border: "1px solid rgba(148,163,184,0.16)",
                      borderRadius: 16,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-[28px] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200">
                {role === "student" ? <PlayCircle className="h-5 w-5" /> : <Cpu className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-100">Quick operations</p>
                <p className="text-xs text-slate-400">High-clarity next actions</p>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                "Continue course path",
                "Open Jupyter lab with GPU",
                "Run lunar simulation",
                "Review latest datasets",
              ].map((action) => (
                <button
                  key={action}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-300/10"
                  type="button"
                >
                  <span>{action}</span>
                  <Sparkles className="h-4 w-4 text-sky-200" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-amber-200" />
            <div>
              <p className="text-sm font-medium text-slate-100">Throughput snapshot</p>
              <p className="text-xs text-slate-400">Weekly utilization across compute tiers</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementBreakdown}>
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
                <Bar dataKey="value" fill="#38bdf8" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">Mission status</p>
          <div className="mt-4 grid gap-4">
            {[
              ["SUS target alignment", "74 / 100"],
              ["AI readiness", "12 active pipelines"],
              ["Virtual lab uptime", "99.3%"],
              ["Spatial ingest latency", "2.4 min"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-sm font-semibold text-slate-50">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
