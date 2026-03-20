"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { BarChart2, CheckCircle, Inbox, Bookmark, Highlighter } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DayPoint  { date: string; label: string; short: string; count: number }
interface MonthPoint { date: string; label: string; count: number }

interface StatsData {
  total_saved: number;
  total_digested: number;
  total_unread: number;
  total_highlights: number;
  by_folder: { name: string; color: string; count: number }[];
  by_day: DayPoint[];
  by_month: MonthPoint[];
}

async function fetchStats(): Promise<StatsData> {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// ── Animated count-up ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) return;
    let raf: number;
    const step = (ts: number) => {
      if (!start.current) start.current = ts;
      const pct = Math.min((ts - start.current) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - pct, 3);
      setCount(Math.round(ease * target));
      if (pct < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, delay }: {
  label: string; value: number; icon: React.ElementType;
  color: string; delay: number;
}) {
  const animated = useCountUp(value, 1000);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-border shadow-card p-5 flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-text-primary">{animated.toLocaleString()}</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Pie tooltip ───────────────────────────────────────────────────────────────
function PieTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: item } = payload[0];
  return (
    <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
      <span className="font-medium">{name}</span>
      <span className="text-white/60 ml-1">{value} link{value !== 1 ? "s" : ""}</span>
    </div>
  );
}

// ── Bar tooltip ───────────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
      <p className="text-white/60 mb-0.5">{label}</p>
      <p className="font-semibold">{payload[0].value} digested</p>
    </div>
  );
}

// ── Activity chart ────────────────────────────────────────────────────────────
type Period = "week" | "month" | "year";

function ActivityChart({ by_day, by_month }: { by_day: DayPoint[]; by_month: MonthPoint[] }) {
  const [period, setPeriod] = useState<Period>("week");

  const data = period === "week"
    ? by_day.slice(-7).map((d) => ({ label: d.label, count: d.count }))
    : period === "month"
    ? by_day.map((d) => ({ label: d.short, count: d.count }))
    : by_month.map((d) => ({ label: d.label, count: d.count }));

  const total = data.reduce((s, d) => s + d.count, 0);

  const TABS: { value: Period; label: string }[] = [
    { value: "week",  label: "Week"  },
    { value: "month", label: "Month" },
    { value: "year",  label: "Year"  },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border border-border shadow-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">Digestion Activity</p>
          <p className="text-xs text-text-muted mt-0.5">
            {total} link{total !== 1 ? "s" : ""} this {period === "year" ? "year" : period}
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                period === value
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={period === "month" ? 8 : 20} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              interval={period === "month" ? 4 : 0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="count" fill="#7F77DD" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    staleTime: 1000 * 60,
  });

  const digestedRate = stats && stats.total_saved > 0
    ? Math.round((stats.total_digested / stats.total_saved) * 100)
    : 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BarChart2 className="w-5 h-5 text-brand-purple" />
          <h1 className="text-2xl font-semibold text-text-primary">Stats</h1>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-border p-5 h-20 animate-pulse" />
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-border p-6 h-64 animate-pulse" />
            <div className="bg-white rounded-2xl border border-border p-6 h-72 animate-pulse" />
          </div>
        )}

        {stats && (
          <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Saved"  value={stats.total_saved}      icon={Bookmark}    color="#7F77DD" delay={0}    />
              <StatCard label="Digested"     value={stats.total_digested}   icon={CheckCircle} color="#1D9E75" delay={0.06} />
              <StatCard label="Unread"       value={stats.total_unread}     icon={Inbox}       color="#6366F1" delay={0.12} />
              <StatCard label="Highlights"   value={stats.total_highlights} icon={Highlighter} color="#BA7517" delay={0.18} />
            </div>

            {/* Digestion rate */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white rounded-2xl border border-border shadow-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-text-primary">Digestion Rate</p>
                <span className="text-sm font-bold text-brand-purple">{digestedRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #7C6EE8, #0EA87A)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${digestedRate}%` }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-text-muted mt-2">
                {stats.total_digested} of {stats.total_saved} saved links digested
              </p>
            </motion.div>

            {/* Activity bar chart */}
            <ActivityChart by_day={stats.by_day} by_month={stats.by_month} />

            {/* Pie chart by folder */}
            {stats.by_folder.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-border shadow-card p-5"
              >
                <p className="text-sm font-semibold text-text-primary mb-4">Digested by Folder</p>
                <div className="flex items-center gap-6">
                  <div className="w-44 h-44 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.by_folder}
                          dataKey="count"
                          nameKey="name"
                          cx="50%" cy="50%"
                          innerRadius={42} outerRadius={70}
                          paddingAngle={2} strokeWidth={0}
                        >
                          {stats.by_folder.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    {stats.by_folder.map((entry, i) => {
                      const pct = stats.total_digested > 0
                        ? Math.round((entry.count / stats.total_digested) * 100)
                        : 0;
                      return (
                        <div key={i} className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-text-secondary truncate flex-1">{entry.name}</span>
                          <span className="text-xs text-text-muted tabular-nums flex-shrink-0">{entry.count}</span>
                          <span className="text-xs text-text-muted tabular-nums w-8 text-right flex-shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {stats.total_digested === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center justify-center py-12 gap-3 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-purple-light flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-brand-purple" />
                </div>
                <p className="font-semibold text-text-primary">No data yet</p>
                <p className="text-sm text-text-muted max-w-xs">
                  Start reading and marking links as digested to see your stats.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
