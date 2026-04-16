import { ArrowUpRight } from "lucide-react";

type IconType = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export function StatCard(props: {
  title: string;
  value: string;
  trend: string;
  icon: IconType;
  sparkPath: string;
}) {
  const Icon = props.icon;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-xl border border-white/10 bg-[#111827] p-5",
        "transition hover:scale-[1.01] hover:border-purple-500/50 hover:shadow-[0_24px_80px_-56px_rgba(168,85,247,0.8)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="absolute -right-6 bottom-0 h-16 w-44 opacity-35"
        >
          <path
            d={props.sparkPath}
            fill="none"
            stroke="rgba(168,85,247,0.9)"
            strokeWidth="2"
          />
          <path
            d={props.sparkPath}
            fill="none"
            stroke="rgba(56,189,248,0.7)"
            strokeWidth="2"
            className="translate-y-[1px]"
          />
        </svg>
        <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-gradient-to-br from-purple-500/18 via-indigo-500/10 to-sky-500/10 blur-xl" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-white/60">
            {props.title}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {props.value}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            {props.trend}
          </div>
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Icon className="h-5 w-5 text-white/75" aria-hidden />
        </div>
      </div>
    </div>
  );
}

