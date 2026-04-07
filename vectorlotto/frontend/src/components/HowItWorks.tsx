"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Zap, Target, Cpu, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: Zap,
    title: "1. Strategy Ensemble",
    desc: "We run 4 AI models simultaneously: HOT (frequency biased), COLD (recency biased), HYBRID, and RANDOM (baseline).",
    color: "#a78bfa"
  },
  {
    icon: Target,
    title: "2. MAB Calibration",
    desc: "Multi-Armed Bandit (Thompson Sampling) dynamically weights the strategies based on their recent ROI performance.",
    color: "#06b6d4"
  },
  {
    icon: Cpu,
    title: "3. Vector Selection",
    desc: "Tickets are generated using probability vectors derived from 3 years of historical Mega Millions draw data.",
    color: "#f59e0b"
  },
  {
    icon: TrendingUp,
    title: "4. Monte Carlo Sim",
    desc: "We stress-test the chosen tickets against 200-2,000 virtual future draws to estimate potential long-term ROI.",
    color: "#34d399"
  }
];

export function HowItWorks() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 glass hover:bg-white/[0.04] transition-all group"
        style={{ border: "1px solid var(--border-subtle)", borderRadius: "12px" }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-violet/10 border border-accent-violet/20 group-hover:scale-110 transition-transform">
            <HelpCircle className="w-4 h-4 text-accent-violet-bright" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-sans">
              How VectorLotto Works
            </h3>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              The Statistical Engine Explained
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3"
                >
                  <div className="p-2 rounded-lg w-fit" style={{ background: `${step.color}15` }}>
                    <step.icon className="w-4 h-4" style={{ color: step.color }} />
                  </div>
                  <h4 className="text-[11px] font-bold text-white uppercase font-mono tracking-tight">
                    {step.title}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-text-muted">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
