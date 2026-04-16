"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CloudOff,
  Layers,
  Lock,
  Mail,
  Scan,
  Shield,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "join">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const backgroundStyle = useMemo(
    () => ({
      background:
        "linear-gradient(180deg, #0B1120 0%, #020617 100%)",
    }),
    []
  );

  return (
    <main className="relative min-h-screen text-white" style={backgroundStyle}>
      {/* Subtle background pattern + glow (no heavy blur) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -top-24 left-[18%] h-56 w-56 rounded-full bg-violet-500/10 blur-xl" />
        <div className="absolute top-28 left-[38%] h-40 w-40 rounded-full bg-sky-500/10 blur-xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Top Navbar */}
        <header className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-[#111827]">
              <Shield className="h-5 w-5 text-white/80" aria-hidden />
            </div>
            <div className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 to-sky-300 bg-clip-text text-transparent">
                WayScan
              </span>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setOpen(true);
              }}
              className={[
                "flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white/85 transition sm:flex-none",
                "border border-white/10 bg-transparent hover:border-white/20 hover:bg-white/5",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/25",
              ].join(" ")}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("join");
                setOpen(true);
              }}
              className={[
                "flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition sm:flex-none",
                "bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]",
                "hover:opacity-95",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/30",
              ].join(" ")}
            >
              Join as Admin
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="grid items-start gap-8 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-32">
          {/* LEFT SIDE: stacked feature cards */}
          <div className="order-2 space-y-4 lg:order-none lg:col-span-3 lg:pt-6">
            <MiniFeatureCard
              icon={<Sparkles className="h-4.5 w-4.5 text-violet-200" aria-hidden />}
              title="Smart Scan"
              description="Real-time AI on your phone"
            />
            <MiniFeatureCard
              icon={<Layers className="h-4.5 w-4.5 text-sky-200" aria-hidden />}
              title="Deduplication"
              description="Smart merging of duplicate reports"
            />
            <MiniFeatureCard
              icon={<CloudOff className="h-4.5 w-4.5 text-emerald-200" aria-hidden />}
              title="Offline Ready"
              description="Works without internet"
            />
          </div>

          {/* CENTER CONTENT */}
          <div className="order-1 text-center lg:order-none lg:col-span-6 lg:pt-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70"
            >
              <Scan className="h-3.5 w-3.5 text-white/70" aria-hidden />
              Live road intelligence
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.04 }}
              className="mt-5 text-5xl font-semibold leading-[0.98] tracking-tight sm:mt-6 sm:text-7xl"
            >
              <span className="mr-2">🛡️</span>WayScan
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
              className="mt-4 text-sm font-semibold tracking-widest text-white/70 sm:mt-5 sm:text-base"
            >
              AI POWERED pothole detection
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.12 }}
              className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-lg"
            >
              Scan roads via mobile, analyze via dashboards.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.16 }}
              className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center"
            >
              <a
                href="/app-release.apk"
                download
                className={[
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white sm:w-auto",
                  "bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]",
                  "shadow-[0_18px_60px_-40px_rgba(139,92,246,0.85)]",
                  "transition hover:opacity-95",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/30",
                ].join(" ")}
              >
                <Smartphone className="h-4.5 w-4.5" aria-hidden />
                Download APK
              </a>
              <button
                type="button"
                className={[
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white/85 transition sm:w-auto",
                  "border border-white/10 bg-transparent hover:border-white/20 hover:bg-white/5",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/25",
                ].join(" ")}
              >
                Watch System Demo
              </button>
            </motion.div>
          </div>

          {/* RIGHT SIDE: phone mockup */}
          <div className="order-3 lg:order-none lg:col-span-3 lg:flex lg:justify-end lg:pt-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
              className="mx-auto w-full max-w-xs sm:max-w-sm lg:mx-0"
            >
              <PhoneMock />
            </motion.div>
          </div>
        </section>

      </div>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-xl"
              onClick={() => setOpen(false)}
            />

            <div className="relative mx-auto flex min-h-full max-w-6xl items-center justify-center px-6 py-12">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descId}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={[
                  "w-full max-w-md overflow-hidden rounded-xl border border-white/10",
                  "bg-white/6 backdrop-blur-md",
                  "shadow-[0_40px_140px_-90px_rgba(139,92,246,0.75)]",
                ].join(" ")}
              >
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div
                        id={titleId}
                        className="text-base font-semibold tracking-tight text-white/90"
                      >
                        {authMode === "join" ? "Join as Admin" : "Admin Login"}
                      </div>
                      <div id={descId} className="mt-1 text-sm text-slate-400">
                        {authMode === "join"
                          ? "Request admin access for your authority team."
                          : "Use authority credentials to access the admin console."}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-white/70 transition hover:border-white/10 hover:bg-white/5"
                      aria-label="Close"
                    >
                      <span aria-hidden>×</span>
                    </button>
                  </div>

                  <form
                    className="mt-5 space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <label className="block">
                      <span className="sr-only">Email</span>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45"
                          aria-hidden
                        />
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          placeholder="Email"
                          className={[
                            "w-full rounded-xl border border-white/10 bg-[#0B1120]/60 px-10 py-3 text-sm text-white/90",
                            "placeholder:text-white/40 outline-none",
                            "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20",
                          ].join(" ")}
                          autoComplete="email"
                          required
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="sr-only">Password</span>
                      <div className="relative">
                        <Lock
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45"
                          aria-hidden
                        />
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type="password"
                          placeholder="Password"
                          className={[
                            "w-full rounded-xl border border-white/10 bg-[#0B1120]/60 px-10 py-3 text-sm text-white/90",
                            "placeholder:text-white/40 outline-none",
                            "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20",
                          ].join(" ")}
                          autoComplete="current-password"
                          required
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      className={[
                        "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white",
                        "bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]",
                        "transition hover:opacity-95",
                        "focus:outline-none focus:ring-2 focus:ring-violet-500/30",
                      ].join(" ")}
                    >
                      {authMode === "join" ? "Request Access" : "Login as Authority"}
                      <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
                    </button>
                  </form>

                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-[#0B1120]/40 p-3 text-xs text-white/55">
                    <TriangleAlert className="mt-0.5 h-4 w-4 text-white/45" aria-hidden />
                    <div>
                      This is a UI-only modal. Connect it to your auth backend when ready.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function MiniFeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div className="mt-1 text-sm leading-relaxed text-slate-400">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[32px] bg-gradient-to-b from-violet-500/10 to-sky-500/10" />

      <div className="origin-center rotate-2 sm:rotate-3">
        <div className="rounded-[28px] border border-white/10 bg-[#0B1120] p-3 shadow-[0_26px_90px_-70px_rgba(59,130,246,0.55)]">
          <div className="rounded-[24px] border border-white/10 bg-[#070C16] p-3">
            <div className="flex items-center justify-between px-2 pb-3">
              <div className="text-xs font-semibold text-white/65">WayScan</div>
              <div className="text-[11px] font-semibold text-emerald-300">LIVE</div>
            </div>

            {/* Road image placeholder */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A1020]">
              {/* Subtle textured road background */}
              <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:48px_48px]" />
              <div className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.07),transparent_55%),radial-gradient(circle_at_70%_65%,rgba(255,255,255,0.05),transparent_60%)]" />
              <div className="relative h-72">
                {/* Road stripe */}
                <div className="absolute left-1/2 top-0 h-full w-[42%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]" />
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
                <div className="absolute left-1/2 top-10 h-10 w-1 -translate-x-1/2 rounded-full bg-white/20" />
                <div className="absolute left-1/2 top-28 h-10 w-1 -translate-x-1/2 rounded-full bg-white/20" />
                <div className="absolute left-1/2 top-46 h-10 w-1 -translate-x-1/2 rounded-full bg-white/20" />

                {/* Pothole (center) */}
                <div className="absolute left-1/2 top-[54%] h-14 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0f1a] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.06)]" />
                <div className="absolute left-1/2 top-[54%] h-8 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35 blur-[1px]" />

                {/* Optional scanning line */}
                <div className="wayscan-scanline pointer-events-none absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-sky-200/50 to-transparent" />

                {/* Animated detection box */}
                <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2">
                  <div className="wayscan-detect-pulse h-20 w-28 rounded-lg border border-white/85 shadow-[0_0_0_6px_rgba(255,255,255,0.06)]" />
                  <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[0_0_38px_rgba(139,92,246,0.16)]" />

                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-9">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827]/90 px-3 py-1.5 text-xs font-semibold text-white/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                      Pothole Detected
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/70">
                Scan
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/70">
                Review
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/70">
                Upload
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
