"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChartNoAxesCombined,
  FileText,
  Gauge,
  Map,
  Scan,
  Settings,
  User,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const nav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: Gauge },
  { label: "Heatmap", href: "/dashboard", icon: Map },
  { label: "Devices", href: "/dashboard", icon: Scan },
  { label: "Analytics", href: "/dashboard", icon: ChartNoAxesCombined },
  { label: "Reports", href: "/dashboard", icon: FileText },
  { label: "Settings", href: "/dashboard", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const active = nav.find((item) => item.href === pathname)?.label ?? "Overview";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#0B1120] md:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl ring-1 ring-white/15">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-500" />
          <Scan className="relative h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-white">
            WayScan
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80 ring-1 ring-white/10">
              AI
            </span>
          </div>
          <div className="text-xs text-white/60">Command Center</div>
        </div>
      </div>

      <nav className="px-3">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-white/40">
          NAVIGATION
        </div>
        <ul className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === active;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={[
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    "hover:scale-[1.01] hover:border-purple-500/50 hover:bg-white/5 hover:text-white",
                    "border border-transparent",
                    isActive
                      ? "bg-white/5 text-white border-white/10"
                      : "text-white/70",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-4.5 w-4.5 transition-colors",
                      isActive ? "text-purple-300" : "text-white/60 group-hover:text-purple-200",
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-white/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <User className="h-5 w-5 text-white/70" aria-hidden />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white/90">City Operator</div>
              <div className="text-xs text-white/60">ops@wayscan.ai</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60 ring-1 ring-white/10">
          <Activity className="h-4 w-4 text-white/60" aria-hidden />
          Status: AI sync stable
        </div>
      </div>
    </aside>
  );
}

