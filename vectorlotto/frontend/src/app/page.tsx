"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, RadialBarChart, RadialBar, Area, AreaChart, CartesianGrid
} from "recharts";
import {
  TrendingUp, TrendingDown, Zap, Shield, Activity, RefreshCcw,
  Play, ChevronRight, Info, AlertCircle, Target, Cpu,
  BarChart3, Layers, Copy, Check, Clock, HelpCircle, 
  ChevronDown, ChevronUp, Sparkles, Lock, Mail, Star, X
} from "lucide-react";
import { api, PredictionResponse, DistributionValue, SimulationResult, Ticket } from "@/lib/api";
import { InfoTooltip } from "@/components/InfoTooltip";
import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { PaywallModal } from "@/components/PaywallModal";
import { HowItWorks } from "@/components/HowItWorks";
import { AuthBar } from "@/components/AuthBar";
import { useAuth } from "@/lib/auth-context";
import { savePrediction, checkUsageGate, incrementUserPrediction, getSessionId } from "@/lib/firestore";

// ── Helpers ──────────────────────────────────────────────────────────────────

const strategyMeta: Record<string, { label: string; color: string; desc: string }> = {
  "A-hot": { label: "HOT", color: "#f97316", desc: "High-frequency numbers" },
  "B-cold": { label: "COLD", color: "#06b6d4", desc: "Overdue for return" },
  "D-hybrid": { label: "HYBRID", color: "#a78bfa", desc: "Balanced ensemble" },
  "C-random": { label: "RANDOM", color: "#8b93b5", desc: "Uniform baseline" },
};

const getStrategyBadgeClass = (s?: string): string => {
  const map: Record<string, string> = {
    "A-hot": "badge badge-hot",
    "B-cold": "badge badge-cold",
    "D-hybrid": "badge badge-hybrid",
    "C-random": "badge badge-random",
  };
  return map[s || ""] ?? "badge badge-random";
};

const TICKER_ITEMS = [
  { label: "ENGINE", value: "v4.0 MAB", color: "#a78bfa" },
  { label: "ALGORITHM", value: "Thompson Sampling", color: "#a78bfa" },
  { label: "KELLY", value: "Active", color: "#34d399" },
  { label: "STRATEGIES", value: "4 Active", color: "#a78bfa" },
  { label: "DISCLAIMER", value: "SIMULATION ONLY · NOT FINANCIAL ADVICE", color: "#f59e0b" },
  { label: "MEGA MILLIONS", value: "Tue + Fri Draws", color: "#a78bfa" },
  { label: "NUMBERS", value: "1-70 White · 1-25 Mega", color: "#a78bfa" },
  { label: "METHOD", value: "Monte Carlo + MAB", color: "#a78bfa" },
  { label: "STATUS", value: "Online", color: "#34d399" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function LiveTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-panel py-2.5 px-0">
      <div className="ticker-scroll">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-[11px] no-select">
            <span className="font-mono text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
              {item.label}
            </span>
            <span className="font-mono font-semibold" style={{ color: item.color }}>
              {item.value}
            </span>
            <span style={{ color: "var(--border-muted)" }} className="ml-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, color = "#a78bfa", icon: Icon, delay = 0
}: {
  label: string; value: string | number; sub?: string; color?: string; icon: any; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="stat-card glass-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="live-dot" />
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{sub}</div>}
    </motion.div>
  );
}

function NumberBall({ n, type = "white", delay = 0, size = "default" }: { n: number; type?: "white" | "mega"; delay?: number; size?: "default" | "lg" }) {
  const sizeClass = size === "lg" ? "ball ball-lg" : "ball";
  const typeClass = type === "mega" ? "ball-mega" : "ball-white";
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 400, damping: 20 }}
      className={`${sizeClass} ${typeClass}`}
    >
      {n.toString().padStart(2, "0")}
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);
  return (
    <button onClick={copy} className="p-1.5 rounded transition-all opacity-40 hover:opacity-100" style={{ color: copied ? "#34d399" : "var(--text-secondary)" }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function MABWeightBar({ name, data, index }: { name: string; data: any; index: number }) {
  const meta = strategyMeta[name] ?? { label: name, color: "#8b93b5", desc: "" };
  const pct = (data.theta * 100).toFixed(1);
  const roiColor = data.ema_roi >= 0 ? "#34d399" : "#f43f5e";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
          <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{name}</span>
          <span className="badge" style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}40`, color: meta.color, fontFamily: "var(--font-mono)", fontSize: "9px", padding: "1px 6px", borderRadius: "999px" }}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono" style={{ color: roiColor }}>
            ROI {data.ema_roi >= 0 ? "+" : ""}{(data.ema_roi * 100).toFixed(1)}%
          </span>
          <span className="font-mono font-semibold" style={{ color: meta.color }}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
          style={{ background: `linear-gradient(90deg, ${meta.color}aa, ${meta.color})` }}
        />
      </div>
      <div className="text-[10px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        Allocation: {data.allocation} tickets · Kelly f: {(data.kelly_f * 100).toFixed(2)}%
      </div>
    </motion.div>
  );
}

function HeatmapGrid({ data }: { data: DistributionValue[] }) {
  const [hoveredNum, setHoveredNum] = useState<number | null>(null);
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.probability));
  const min = Math.min(...data.map((d) => d.probability));

  const cells = Array.from({ length: 70 }, (_, i) => {
    const n = i + 1;
    const d = data.find((x) => x.number === n);
    const prob = d?.probability ?? 0;
    const normalized = max > min ? (prob - min) / (max - min) : 0;
    return { n, prob, normalized };
  });

  const getColor = (norm: number): string => {
    if (norm > 0.75) return `rgba(124, 58, 237, ${0.3 + norm * 0.7})`;
    if (norm > 0.5) return `rgba(139, 92, 246, ${0.2 + norm * 0.5})`;
    if (norm > 0.25) return `rgba(91, 33, 182, ${0.15 + norm * 0.35})`;
    return `rgba(30, 20, 60, ${0.5 + norm * 0.3})`;
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: "4px" }}>
        {cells.map(({ n, prob, normalized }, idx) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.008, duration: 0.25 }}
            className="heatmap-cell"
            style={{ background: getColor(normalized), color: normalized > 0.6 ? "#c4b5fd" : "var(--text-muted)" }}
            onMouseEnter={() => setHoveredNum(n)}
            onMouseLeave={() => setHoveredNum(null)}
            title={`#${n}: ${(prob * 100).toFixed(3)}%`}
          >
            {n}
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {hoveredNum !== null && (() => {
          const d = data.find((x) => x.number === hoveredNum);
          if (!d) return null;
          const norm = max > min ? (d.probability - min) / (max - min) : 0;
          return (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 p-3 rounded-lg font-mono text-xs flex items-center gap-4"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-muted)" }}
            >
              <span style={{ color: "var(--text-muted)" }}>BALL</span>
              <span className="font-bold text-base" style={{ color: "#a78bfa" }}>
                #{hoveredNum.toString().padStart(2, "0")}
              </span>
              <span style={{ color: "var(--text-muted)" }}>PROBABILITY</span>
              <span style={{ color: "#34d399" }}>{(d.probability * 100).toFixed(4)}%</span>
              <span style={{ color: "var(--text-muted)" }}>INTENSITY</span>
              <span style={{ color: "#f59e0b" }}>{(norm * 100).toFixed(1)}%</span>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function SimulatorPanel({
  prediction, loading: parentLoading
}: { prediction: PredictionResponse | null; loading: boolean }) {
  const [drawCount, setDrawCount] = useState(200);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simHistory, setSimHistory] = useState<{ draws: number; roi: number }[]>([]);

  const runSimulation = async () => {
    if (!prediction || parentLoading) return;
    setSimLoading(true);
    try {
      const res = await api.simulate({ tickets: prediction.predictions, draw_count: drawCount });
      setSimResult(res);
      setSimHistory(prev => [...prev.slice(-10), { draws: drawCount, roi: res.roi * 100 }]);
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  const totalTickets = prediction?.predictions.length ?? 0;
  const totalEntries = totalTickets * drawCount;

  return (
    <div className="surface-elevated p-6 space-y-5 glass-hover rounded-2xl border" style={{ borderColor: "var(--border-muted)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: "rgba(5, 150, 105, 0.15)" }}>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-sm font-semibold">Monte Carlo Engine</h3>
              <InfoTooltip 
                title="Monte Carlo Simulator" 
                content="Stochastic simulation of 2,000+ future outcomes using high-dimensional probability vectors. We stress-test tickets against noise to confirm ROI robustness."
              />
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              WHAT-IF SIMULATOR
            </p>
          </div>
        </div>
        <div className="badge badge-live animate-glow">
          <div className="live-dot w-1.5 h-1.5" />
          LIVE
        </div>
      </div>

      <div className="divider-h" />

      {/* Draw count slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px]" style={{ fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--text-muted)" }}>VIRTUAL DRAWS</span>
          <span className="font-semibold" style={{ color: "#a78bfa" }}>{drawCount.toLocaleString()}</span>
        </div>
        <input
          type="range" min={10} max={2000} step={10}
          value={drawCount}
          onChange={(e) => setDrawCount(parseInt(e.target.value))}
        />
        <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          <span>10</span>
          <span>{totalEntries.toLocaleString()} total entries</span>
          <span>2,000</span>
        </div>
      </div>

      {/* Estimated cost */}
      <div className="p-3 rounded-lg" style={{ background: "rgba(10, 10, 20, 0.6)", border: "1px solid var(--border-subtle)" }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "TICKETS", value: totalTickets },
            { label: "DRAWS", value: drawCount.toLocaleString() },
            { label: "VIRTUAL COST", value: `$${(totalTickets * drawCount * 2).toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{label}</div>
              <div className="font-mono font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={runSimulation}
        disabled={simLoading || parentLoading || !prediction}
        className="btn btn-emerald w-full"
      >
        {simLoading ? (
          <>
            <RefreshCcw className="w-4 h-4 animate-spin" />
            Running Simulation...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run What-If Analysis
          </>
        )}
      </button>

      {/* Sim Results */}
      <AnimatePresence mode="wait">
        {simResult && (
          <motion.div
            key={simResult.draw_count + simResult.net_profit}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="divider-h" />
            <div className="text-[10px] font-mono tracking-widest" style={{ color: "var(--text-muted)" }}>
              SIMULATION RESULTS — {simResult.draw_count.toLocaleString()} DRAWS
            </div>

            {/* Big number */}
            <div className="text-center py-4">
              <div
                className="text-4xl font-black font-mono"
                style={{ color: simResult.net_profit >= 0 ? "#34d399" : "#f43f5e" }}
              >
                {simResult.net_profit >= 0 ? "+" : ""}
                ${Math.abs(simResult.net_profit).toLocaleString()}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                VIRTUAL NET RETURN
              </div>
              {simResult.net_profit < 0 && (
                <div className="text-[10px] mt-2 italic" style={{ color: "var(--text-muted)" }}>
                  This mirrors real lottery odds — the house always has edge
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                {
                  label: "ROI",
                  value: `${(simResult.roi * 100).toFixed(2)}%`,
                  color: simResult.roi >= 0 ? "#34d399" : "#f43f5e"
                },
                {
                  label: "WIN RATE",
                  value: `${((simResult.win_count / (simResult.draw_count)) * 100).toFixed(3)}%`,
                  color: "#a78bfa"
                },
                {
                  label: "TOTAL WON",
                  value: `$${simResult.total_won.toLocaleString()}`,
                  color: "#fde68a"
                },
                {
                  label: "TOTAL SPENT",
                  value: `$${simResult.total_spent.toLocaleString()}`,
                  color: "var(--text-secondary)"
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-2.5 rounded-lg text-center" style={{ background: "var(--bg-overlay)" }}>
                  <div className="font-mono font-bold text-sm" style={{ color }}>{value}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Historical ROI chart */}
            {simHistory.length > 1 && (
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="roi" stroke="#34d399" strokeWidth={1.5} fill="url(#roiGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketCard({ ticket, index }: { ticket: Ticket; index: number }) {
  const balls = `${ticket.wb.map(n => n.toString().padStart(2, "0")).join(" ")} MB:${ticket.mb.toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      className="p-4 rounded-xl group transition-all"
      style={{
        background: "var(--bg-overlay)",
        border: "1px solid var(--border-subtle)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(124, 58, 237, 0.4)";
        (e.currentTarget as HTMLElement).style.background = "rgba(22, 27, 45, 0.9)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
        (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)";
      }}
    >
      <div className="flex items-center gap-3">
        {/* Index */}
        <div className="font-mono text-[11px] w-8 text-center" style={{ color: "var(--text-muted)" }}>
          T{(index + 1).toString().padStart(2, "0")}
        </div>

        {/* White balls */}
        <div className="flex gap-1.5 flex-1">
          {ticket.wb.map((n, j) => (
            <NumberBall key={j} n={n} delay={index * 0.06 + j * 0.04} />
          ))}
        </div>

        {/* Mega ball */}
        <NumberBall n={ticket.mb} type="mega" delay={index * 0.06 + 0.25} />

        {/* Strategy + copy */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className={getStrategyBadgeClass(ticket.strategy)}>{strategyMeta[ticket.strategy || ""]?.label || ticket.strategy}</span>
          <CopyButton text={balls} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function VectorLottoDashboard() {
  const { user, profile } = useAuth();
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [wbData, setWbData] = useState<DistributionValue[]>([]);
  const [mbData, setMbData] = useState<DistributionValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [predictionCount, setPredictionCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const prevBankroll = useRef<number | null>(null);

  // Initialize prediction count from localStorage (anonymous fallback)
  useEffect(() => {
    const savedCount = localStorage.getItem("vectorlotto_predCount");
    if (savedCount) setPredictionCount(parseInt(savedCount));
  }, []);

  const fetchData = useCallback(async () => {
    // ── Usage Gate ────────────────────────────────────────────────────────────
    // Signed-in users: check Firestore (pro gets unlimited)
    // Anonymous users: localStorage-only 3/day limit
    if (user) {
      const gate = await checkUsageGate(user.uid);
      if (!gate.allowed) {
        setShowPaywall(true);
        return;
      }
    } else {
      if (predictionCount >= 3) {
        setShowPaywall(true);
        return;
      }
    }

    setLoading(true);
    setFetchError(null);
    try {
      const [pred, dist] = await Promise.all([api.predict(), api.getDistributions()]);
      prevBankroll.current = prediction?.bankroll_at_pred ?? null;
      setPrediction(pred);
      setWbData(dist.wb_distribution);
      setMbData(dist.mb_distribution);
      setLastUpdated(new Date());
      
      // ── Persist to Firestore ────────────────────────────────────────────────
      const sessionId = getSessionId();
      try {
        await savePrediction({
          userId: user?.uid ?? null,
          sessionId,
          runId: pred.run_id,
          targetDrawDate: pred.target_draw_date,
          ticketCount: pred.predictions.length,
          budget: pred.budget,
          bankrollAtPred: pred.bankroll_at_pred,
          ensembleWeights: pred.ensemble_weights as Record<string, unknown>,
          tickets: pred.predictions.map(t => ({ wb: t.wb, mb: t.mb, strategy: t.strategy ?? "" })),
        });
        if (user) await incrementUserPrediction(user.uid);
      } catch (firestoreErr) {
        console.warn("Firestore save failed (non-blocking):", firestoreErr);
      }

      // ── Local count (anonymous fallback) ────────────────────────────────────
      const newCount = predictionCount + 1;
      setPredictionCount(newCount);
      localStorage.setItem("vectorlotto_predCount", newCount.toString());
    } catch (err: any) {
      setFetchError(err.message || "Failed to reach VectorLotto API");
    } finally {
      setLoading(false);
    }
  }, [prediction, predictionCount, user]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading && !prediction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: "var(--bg-base)" }}>
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full border-2 border-violet-500/20 animate-spin-slow" style={{ borderTopColor: "#7c3aed" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-8 h-8" style={{ color: "#a78bfa" }} />
          </div>
        </div>
        <div className="font-mono text-sm tracking-widest" style={{ color: "var(--text-muted)" }}>
          CALIBRATING MAB ENGINE
        </div>
        <div className="mt-2 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
          Loading Thompson Sampling state...
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (fetchError && !prediction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: "var(--bg-base)" }}>
        <div className="p-4 rounded-full" style={{ background: "rgba(244, 63, 94, 0.1)" }}>
          <AlertCircle className="w-10 h-10 text-rose-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-rose-400">API Connection Failed</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {fetchError}
          </p>
          <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
            Make sure the backend is running: <code className="font-mono">uvicorn app.main:app --port 8000</code>
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-primary mt-2">
          <RefreshCcw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  const bankrollDelta = prevBankroll.current !== null && prediction
    ? prediction.bankroll_at_pred - prevBankroll.current
    : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Top Bar / Nav ─────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{
          background: "rgba(6, 8, 16, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg animate-glow" style={{ background: "rgba(124, 58, 237, 0.2)" }}>
            <Zap className="w-5 h-5" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">VectorLotto</span>
            <span className="ml-2 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>v4.0</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-4">
            <div className="live-dot" />
            <span className="text-[11px] font-mono" style={{ color: "#34d399" }}>LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {/* Free tier quota indicator (anonymous users) */}
          {!user && predictionCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px]"
              style={{ background: predictionCount >= 2 ? "rgba(245,158,11,0.15)" : "var(--bg-elevated)", border: `1px solid ${predictionCount >= 2 ? "rgba(245,158,11,0.4)" : "var(--border-subtle)"}`, color: predictionCount >= 2 ? "#fbbf24" : "var(--text-muted)" }}>
              {3 - predictionCount}/3 FREE
            </div>
          )}
          <div className="px-3 py-1.5 rounded-lg font-mono text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-muted)" }}>BANKROLL </span>
            <span className="font-semibold" style={{ color: "#a78bfa" }}>${prediction?.bankroll_at_pred.toLocaleString()}</span>
            {bankrollDelta !== null && bankrollDelta !== 0 && (
              <span className="ml-2" style={{ color: bankrollDelta >= 0 ? "#34d399" : "#f43f5e" }}>
                {bankrollDelta >= 0 ? "▲" : "▼"}{Math.abs(bankrollDelta).toLocaleString()}
              </span>
            )}
          </div>
          <AuthBar />
          <button
            onClick={fetchData}
            disabled={loading}
            className={`btn btn-ghost btn-icon ${loading ? "opacity-50" : ""}`}
            title="Refresh"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

      </nav>

      {/* ── Live Ticker ────────────────────────────────────────────────────── */}
      <LiveTicker />

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="p-4 md:p-6 max-w-screen-2xl mx-auto">
        
        {/* Banner Section */}
        <HowItWorks />

        {/* ── Hero Stats Row ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <StatCard
            label="ACTIVE TICKETS"
            value={prediction?.predictions.length ?? "--"}
            sub={`Budget: ${prediction?.budget} Kelly-weighted`}
            color="#a78bfa"
            icon={Layers}
            delay={0}
          />
          <StatCard
            label="VIRTUAL BANKROLL"
            value={`$${prediction ? (prediction.bankroll_at_pred / 1000).toFixed(1) : "--"}K`}
            sub="Thompson Sampled"
            color="#34d399"
            icon={TrendingUp}
            delay={0.08}
          />
          <StatCard
            label="TARGET DRAW"
            value={prediction?.target_draw_date ?? "--"}
            sub="Tue / Fri draws"
            color="#f59e0b"
            icon={Target}
            delay={0.16}
          />
          <StatCard
            label="STRATEGIES ACTIVE"
            value={prediction ? Object.keys(prediction.ensemble_weights).length : "--"}
            sub="Hot · Cold · Hybrid · Random"
            color="#06b6d4"
            icon={BarChart3}
            delay={0.24}
          />
        </div>

        {/* ── Body Grid: Predictions + Heatmap | Simulator + MAB ───────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: "16px" }} className="grid-cols-1 lg:grid-cols-[3fr_2fr]">

          {/* Left: Predictions + Heatmap */}
          <div className="space-y-5">

            {/* Prediction Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              id="predictions-section"
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border-muted)", background: "var(--bg-surface)" }}
            >
              {/* Card header */}
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(124, 58, 237, 0.04)" }}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: "#a78bfa" }} />
                  <div>
                    <div className="flex items-center">
                      <h2 className="font-semibold text-sm tracking-tight">Active Prediction Plan</h2>
                      <InfoTooltip 
                        title="AI Prediction Tickets" 
                        content="Direct outputs from the Ensemble Engine. Each ticket uses a weighted strategy (HOT/COLD/HYBRID) selected by the MAB agent for the current state."
                      />
                    </div>
                    <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                      RUN_ID: {prediction?.run_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </div>
              </div>

              {/* Tickets */}
              <div className="p-5 space-y-2">
                {prediction?.predictions.map((ticket, i) => (
                  <TicketCard key={i} ticket={ticket} index={i} />
                ))}
              </div>

              {/* Footer disclaimer */}
              <div className="px-6 py-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)" }}>
                <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  SIMULATION ONLY · No real tickets purchased · Past performance ≠ future results
                </p>
              </div>
            </motion.div>

            {/* ── Grid: Heatmap + MAB + Simulator ─────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>

              {/* Probability Heatmap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                id="heatmap-section"
                className="rounded-2xl p-6 space-y-4"
                style={{ border: "1px solid var(--border-muted)", background: "var(--bg-surface)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" style={{ color: "#a78bfa" }} />
                    <div className="flex items-center">
                      <h3 className="font-semibold text-sm">White Ball Probability Heatmap</h3>
                      <InfoTooltip 
                        title="Probability Heatmap" 
                        content="Interactive density grid of ball frequencies. Higher intensity (brighter purple) indicates numbers the model projects as having higher entropy/likelihood."
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    <span>Low</span>
                    <div className="flex gap-0.5">
                      {["rgba(30,20,60,0.8)", "rgba(91,33,182,0.4)", "rgba(109,40,217,0.6)", "rgba(124,58,237,0.8)", "rgba(139,92,246,1)"].map((c, i) => (
                        <div key={i} className="w-4 h-2 rounded-sm" style={{ background: c }} />
                      ))}
                    </div>
                    <span>High</span>
                  </div>
                </div>

                {wbData.length > 0 ? <HeatmapGrid data={wbData} /> : (
                  <div className="flex items-center justify-center h-32" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    Loading distribution data...
                  </div>
                )}
              </motion.div>

              {/* Distribution Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="rounded-2xl p-6 space-y-4"
                style={{ border: "1px solid var(--border-muted)", background: "var(--bg-surface)" }}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: "#06b6d4" }} />
                  <h3 className="font-semibold text-sm">Ensemble Weight Vector</h3>
                  <span className="text-[10px] font-mono ml-auto" style={{ color: "var(--text-muted)" }}>Numbers 1-70</span>
                </div>
                <div style={{ height: "200px" }}>
                  {wbData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wbData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="10%">
                        <XAxis
                          dataKey="number"
                          stroke="transparent"
                          tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                          tickLine={false}
                          axisLine={false}
                          interval={9}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(11, 14, 24, 0.95)",
                            borderColor: "rgba(124, 58, 237, 0.4)",
                            borderRadius: "8px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                          }}
                          itemStyle={{ color: "#a78bfa" }}
                          labelStyle={{ color: "#fff", fontWeight: 700 }}
                          formatter={(val: any) => [`${(val * 100).toFixed(3)}%`, "Probability"]}
                          labelFormatter={(label) => `Ball #${label}`}
                        />
                        <Bar dataKey="probability" radius={[3, 3, 0, 0]}>
                          {wbData.map((entry, index) => {
                            const probNorm = entry.probability / Math.max(...wbData.map(d => d.probability));
                            const opacity = 0.4 + probNorm * 0.6;
                            return <Cell key={`cell-${index}`} fill={`rgba(124, 58, 237, ${opacity})`} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>Loading...</div>}
                </div>
              </motion.div>

              {/* Mega Ball Distribution */}
              {mbData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-2xl p-6 space-y-4"
                  style={{ border: "1px solid rgba(245, 158, 11, 0.2)", background: "var(--bg-surface)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ background: "rgba(245, 158, 11, 0.4)", border: "1px solid rgba(245, 158, 11, 0.6)" }} />
                    <h3 className="font-semibold text-sm">Mega Ball Distribution</h3>
                    <span className="text-[10px] font-mono ml-auto" style={{ color: "var(--text-muted)" }}>Numbers 1-25</span>
                  </div>
                  <div style={{ height: "120px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mbData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <XAxis
                          dataKey="number"
                          tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(11, 14, 24, 0.95)",
                            borderColor: "rgba(245, 158, 11, 0.4)",
                            borderRadius: "8px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                          }}
                          itemStyle={{ color: "#fde68a" }}
                          labelStyle={{ color: "#fff", fontWeight: 700 }}
                          formatter={(val: any) => [`${(val * 100).toFixed(3)}%`, "Probability"]}
                          labelFormatter={(label) => `Mega Ball #${label}`}
                        />
                        <Bar dataKey="probability" radius={[3, 3, 0, 0]}>
                          {mbData.map((entry, index) => {
                            const probNorm = entry.probability / Math.max(...mbData.map(d => d.probability));
                            const opacity = 0.35 + probNorm * 0.65;
                            return <Cell key={`mb-cell-${index}`} fill={`rgba(245, 158, 11, ${opacity})`} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-5">

            {/* Monte Carlo Simulator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              id="simulator-section"
            >
              <SimulatorPanel prediction={prediction} loading={loading} />
            </motion.div>

            {/* MAB Agent Confidence */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              id="mab-section"
              className="rounded-2xl p-6 space-y-4"
              style={{ border: "1px solid var(--border-muted)", background: "var(--bg-surface)" }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "#a78bfa" }} />
                <div className="flex items-center">
                  <h3 className="font-semibold text-sm">Agent Confidence (MAB)</h3>
                  <InfoTooltip 
                    title="MAB Strategy Agent" 
                    content="The engine uses Thompson Sampling to manage the explore/exploit trade-off. It rewards strategies that yield 'virtual hits' and decays weights of underperformers."
                  />
                </div>
              </div>
              <div className="text-[11px] font-mono px-1" style={{ color: "var(--text-muted)" }}>
                Thompson Sampling θ — higher = more draws allocated
              </div>

              <div className="space-y-4">
                {prediction &&
                  Object.entries(prediction.ensemble_weights).map(([name, data], i) => (
                    <MABWeightBar key={name} name={name} data={data} index={i} />
                  ))}
              </div>
            </motion.div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl p-4 flex gap-3"
              style={{
                background: "rgba(245, 158, 11, 0.04)",
                border: "1px solid rgba(245, 158, 11, 0.15)",
              }}
            >
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
              <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>RESEARCH TOOL ONLY. </span>
                VectorLotto uses Thompson Sampling (MAB) and Kelly Criterion to dynamically weight strategies. This is a statistical simulation — not gambling advice. No real tickets are purchased. Lottery odds are fixed; past patterns do not guarantee future results. Play responsibly.
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="mt-12 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: "#7c3aed" }} />
          <span className="font-semibold text-sm">VectorLotto</span>
          <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
            — Statistical Ensemble Engine v4.0
          </span>
        </div>
        <div className="text-[10px] font-mono text-center" style={{ color: "var(--text-muted)" }}>
          FOR EDUCATIONAL / RESEARCH USE ONLY · NOT A GAMBLING PLATFORM · NO REAL MONEY INVOLVED
        </div>
      </footer>

      {/* Overlays */}
      <OnboardingOverlay />
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        predictionCount={predictionCount}
      />
    </div>
  );
}
