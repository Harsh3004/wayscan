import {
  Scan,
  Flame,
  CheckCircle2,
  BadgeDollarSign,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { StatCard } from "./_components/StatCard";
import { HeatmapCard } from "./_components/HeatmapCard";
import { ActivityFeed } from "./_components/ActivityFeed";
import { ChartSection } from "./_components/ChartSection";

export default function DashboardPage() {
  return (
    <div className="relative">
      {/* Subtle ambient glow (works inside dashboard layout) */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-sky-500/15 blur-3xl" />

      <div className="relative space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-purple-200" aria-hidden />
              AI Monitoring • Live signals
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Command Center
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/60">
              Track scans, prioritize hotspots, and dispatch crews with real-time clustering and risk
              scoring.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-xs text-white/70">
              <div className="font-semibold text-white/80">Today</div>
              <div className="mt-0.5 text-white/55">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            <a
              href="#heatmap"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 transition hover:border-purple-500/40 hover:bg-white/7"
            >
              View hotspots
              <ArrowUpRight className="h-4 w-4 text-white/60 transition group-hover:text-white/85" aria-hidden />
            </a>
          </div>
        </header>

        {/* KPI row */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Scan}
            label="Total Scans"
            value="14,276"
            trend="+11%"
            accent="from-purple-400 via-blue-400 to-cyan-300"
          />
          <StatCard
            icon={Flame}
            label="Active Issues"
            value="289"
            trend="-6%"
            accent="from-orange-300 via-pink-500 to-red-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Resolved"
            value="1,309"
            trend="+18%"
            accent="from-emerald-300 via-green-400 to-cyan-200"
          />
          <StatCard
            icon={BadgeDollarSign}
            label="Estimated Savings"
            value="$6.8k"
            trend="+22%"
            accent="from-yellow-300 via-lime-300 to-emerald-200"
          />
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ChartSection />
          </div>
          <div className="lg:col-span-5">
            <ActivityFeed />
          </div>
        </section>

        {/* Heatmap */}
        <section id="heatmap" className="space-y-3 scroll-mt-24">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Pothole Density Heatmap
            </h2>
            <div className="text-xs font-semibold text-white/60">
              Updated just now
            </div>
          </div>
          <HeatmapCard />
        </section>
      </div>
    </div>
  );
}