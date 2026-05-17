import { projects } from "../../data/mockData";
import { SectionHeader } from "../common/SectionHeader";

export function ProjectsPanel() {
  return (
    <section className="space-y-6">
      <SectionHeader
        description="Capstone teams combine lunar science, AI, spatial analytics, and HPC workflows into applied mission-style projects."
        eyebrow="Projects"
        title="Collaborative capstone mission tracks"
      />
      <div className="grid gap-6 xl:grid-cols-3">
        {projects.map((project) => (
          <div key={project.title} className="glass-panel rounded-[28px] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200">{project.team}</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-50">{project.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{project.focus}</p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Current milestone</p>
              <p className="mt-2 text-sm text-slate-200">{project.milestone}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
