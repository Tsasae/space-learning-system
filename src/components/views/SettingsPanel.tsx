import { SectionHeader } from "../common/SectionHeader";

export function SettingsPanel() {
  return (
    <section className="space-y-6">
      <SectionHeader
        description="Platform preferences, integration toggles, and policy surfaces for a scalable cloud learning environment."
        eyebrow="Settings"
        title="Workspace configuration and controls"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">Interface settings</p>
          <div className="mt-5 space-y-4">
            {["Compact density", "Realtime notifications", "Auto-save notebooks"].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <span className="text-sm text-slate-300">{item}</span>
                <div className={`h-6 w-11 rounded-full p-1 ${index !== 1 ? "bg-sky-300/20" : "bg-white/10"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white ${index !== 1 ? "translate-x-5" : ""}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">Integration status</p>
          <div className="mt-5 space-y-4">
            {[
              "JupyterHub API connected",
              "Prometheus metrics synced",
              "Spatial storage mounted",
              "SLURM scheduler available",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
