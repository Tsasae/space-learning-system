import { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          {eyebrow}
        </p>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-50">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}
