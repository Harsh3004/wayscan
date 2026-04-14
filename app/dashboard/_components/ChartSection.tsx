export function ChartSection() {
  return (
    <section
      className={[
        "group relative overflow-hidden rounded-xl border border-white/10 bg-[#111827] p-6",
        "transition hover:scale-[1.01] hover:border-purple-500/50 hover:shadow-[0_26px_90px_-64px_rgba(168,85,247,0.85)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-indigo-500/8 blur-xl" />
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-purple-500/8 blur-xl" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Predictive Risk Analysis
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              Trend forecast from scan density + historical repairs (demo data)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_0_6px_rgba(56,189,248,0.10)]" />
            Rising risk
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#0B1120]/55 p-4">
            <div className="text-xs font-semibold text-white/60">Next 7 days</div>
            <div className="mt-2 text-2xl font-semibold text-white">High</div>
            <div className="mt-1 text-xs text-white/50">Zone 3, MG Road, Bypass</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0B1120]/55 p-4">
            <div className="text-xs font-semibold text-white/60">Hotspots</div>
            <div className="mt-2 text-2xl font-semibold text-white">12</div>
            <div className="mt-1 text-xs text-white/50">Clusters above threshold</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0B1120]/55 p-4">
            <div className="text-xs font-semibold text-white/60">Recommended</div>
            <div className="mt-2 text-2xl font-semibold text-white">2 crews</div>
            <div className="mt-1 text-xs text-white/50">Deploy to peak corridors</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
          Upgrade this card to a real chart once your live risk model endpoint is ready.
        </div>
      </div>
    </section>
  );
}