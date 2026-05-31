import type { ProgressState } from '../../hooks/useProgressTracking';

const fmt = (n: number) => (Number.isInteger(n) ? n : n.toFixed(1));

export function LiveProgressBar({ progress }: { progress: ProgressState }) {
  const { total, breakdown, seenCount, totalSlides } = progress;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Хичээлийн явц (live)
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-sky-300">
            {fmt(total)}%
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Материал {seenCount}/{totalSlides} слайд
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
          style={{ width: `${total}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Segment label="Материал" value={breakdown.material} max={40} color="sky" />
        <Segment label="Даалгавар" value={breakdown.assignment} max={30} color="violet" />
        <Segment label="Шалгалт" value={breakdown.quiz} max={30} color="emerald" />
      </div>
    </div>
  );
}

const COLORS: Record<string, string> = {
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  emerald: 'bg-emerald-400',
};

function Segment({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums">
          {fmt(value)}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${COLORS[color]} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
