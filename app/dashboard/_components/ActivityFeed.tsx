import { Dot, ShieldCheck } from "lucide-react";

type ActivityItem = {
  message: string;
  time: string;
  meta?: string;
};

const items: ActivityItem[] = [
  { message: "Pothole detected — MG Road (AI 98%)", time: "2m ago", meta: "Severity: High" },
  { message: "Cluster merged — Indore Bypass", time: "7m ago", meta: "Duplicates removed: 6" },
  { message: "Repair crew dispatched — Zone 3", time: "18m ago", meta: "ETA: 35 mins" },
  { message: "Offline sync completed — Device #A17", time: "33m ago", meta: "Scans uploaded: 42" },
  { message: "New hotspot — Ring Road (Ward 12)", time: "51m ago", meta: "Cluster size: 14" },
];

export function ActivityFeed() {
  return (
    <section
      className={[
        "group relative overflow-hidden rounded-xl border border-white/10 bg-[#111827] p-6",
        "transition hover:scale-[1.01] hover:border-purple-500/50 hover:shadow-[0_26px_90px_-64px_rgba(168,85,247,0.85)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-purple-500/8 blur-xl" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-white">
            Live Activity Feed
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Streaming events from devices + AI nodes
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
          Verified
        </div>
      </div>

      <div className="relative mt-6 space-y-4">
        {items.map((it) => (
          <div
            key={it.message}
            className="rounded-xl border border-white/10 bg-[#0B1120]/70 p-4 transition hover:border-white/15"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <Dot className="mt-0.5 h-5 w-5 text-purple-300" aria-hidden />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/90">
                      {it.message}
                    </div>
                    {it.meta ? (
                      <div className="mt-1 text-xs text-white/60">{it.meta}</div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-xs font-semibold text-white/50">{it.time}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

