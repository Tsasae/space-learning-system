import { hpcJobs } from "../../data/mockData";
import { SectionHeader } from "../common/SectionHeader";

export function HPCJobsPanel() {
  return (
    <section className="space-y-6">
      <SectionHeader
        action={
          <button
            className="rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm font-medium text-sky-100"
            type="button"
          >
            Submit job
          </button>
        }
        description="Submit AI and parallel workloads, inspect queue state, and review logs from the cloud HPC backend."
        eyebrow="HPC Jobs"
        title="Cluster orchestration and workload visibility"
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm font-medium text-slate-100">Job submission</p>
          <div className="mt-5 space-y-4">
            <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none">
              <option>Select model</option>
              <option>CNN crater detection</option>
              <option>MPI terrain clustering</option>
              <option>Transformer mineral classifier</option>
            </select>
            <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none">
              <option>Select resources</option>
              <option>CPU only</option>
              <option>1x GPU</option>
              <option>Multi-GPU</option>
            </select>
            <textarea
              className="h-40 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="SLURM or workload notes"
            />
            <button
              className="w-full rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100"
              type="button"
            >
              Queue workload
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {hpcJobs.map((job) => (
            <div key={job.id} className="glass-panel rounded-[28px] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-50">{job.model}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {job.id} | {job.resources}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-2 text-xs font-medium ${
                    job.status === "Running"
                      ? "bg-sky-300/10 text-sky-100"
                      : job.status === "Completed"
                        ? "bg-emerald-400/10 text-emerald-100"
                        : "bg-amber-300/10 text-amber-100"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sky-300 to-emerald-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-[#091425] p-4 font-mono text-sm leading-7 text-slate-300">
                {job.logs.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
