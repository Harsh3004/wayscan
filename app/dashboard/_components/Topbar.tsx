import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B1120]/92 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
              aria-hidden
            />
            <input
              placeholder="Search issues, roads, zones..."
              className={[
                "w-full rounded-xl border border-white/10 bg-[#111827] px-10 py-2.5 text-sm text-white placeholder:text-white/50",
                "outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
              ].join(" ")}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/60 ring-1 ring-white/10">
              ⌘ K
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-xs font-semibold text-white/75 md:block">
            AI Node Status:{" "}
            <span className="ml-1 text-emerald-300">Online</span>
          </div>

          <button
            className={[
              "relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#111827]",
              "transition hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-[0_16px_60px_-40px_rgba(168,85,247,0.9)]",
            ].join(" ")}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-white/70" aria-hidden />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#111827]" />
          </button>
        </div>
      </div>
    </header>
  );
}

