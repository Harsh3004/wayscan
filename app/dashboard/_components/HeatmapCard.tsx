import { Flame, MapPinned } from "lucide-react";

export function HeatmapCard() {
  return (
    <section
      className={[
        "group relative overflow-hidden rounded-xl border border-white/10 bg-[#111827]",
        "transition hover:scale-[1.01] hover:border-purple-500/50 hover:shadow-[0_28px_90px_-64px_rgba(168,85,247,0.85)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-purple-500/12 blur-xl" />
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-sky-500/10 blur-xl" />
      </div>

      <div className="relative flex items-start justify-between gap-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-purple-200" aria-hidden />
            <h2 className="text-base font-semibold tracking-tight text-white">
              Live Pothole Heatmap
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Real-time AI issue clustering active
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          Hot zones
          <Flame className="h-3.5 w-3.5 text-rose-300" aria-hidden />
        </div>
      </div>

      <div className="relative px-6 pb-6">
        <div className="relative h-[400px] overflow-hidden rounded-xl border border-white/10 bg-[#0B1120]">
          <div className="absolute inset-0 opacity-90">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_60%)]" />
          </div>

          {/* clusters */}
          <ClusterDot className="left-[18%] top-[28%]" color="rose" />
          <ClusterDot className="left-[54%] top-[38%]" color="amber" />
          <ClusterDot className="left-[72%] top-[60%]" color="yellow" />
          <ClusterDot className="left-[38%] top-[68%]" color="rose" />
          <ClusterDot className="left-[62%] top-[22%]" color="amber" />

          <div className="absolute bottom-4 left-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70 ring-1 ring-white/10">
            Dark map placeholder • clusters glow by severity
          </div>
        </div>
      </div>
    </section>
  );
}

function ClusterDot(props: {
  className: string;
  color: "rose" | "amber" | "yellow";
}) {
  const palette =
    props.color === "rose"
      ? {
          core: "bg-rose-500",
          glow: "shadow-[0_0_0_10px_rgba(244,63,94,0.14),0_0_40px_rgba(244,63,94,0.25)]",
        }
      : props.color === "amber"
        ? {
            core: "bg-orange-500",
            glow: "shadow-[0_0_0_10px_rgba(249,115,22,0.14),0_0_40px_rgba(249,115,22,0.25)]",
          }
        : {
            core: "bg-yellow-400",
            glow: "shadow-[0_0_0_10px_rgba(250,204,21,0.12),0_0_40px_rgba(250,204,21,0.20)]",
          };

  return (
    <div className={["absolute", props.className].join(" ")}>
      <div className={["h-2.5 w-2.5 rounded-full", palette.core, palette.glow].join(" ")} />
      <div className="absolute -inset-8 rounded-full bg-white/0" />
    </div>
  );
}

