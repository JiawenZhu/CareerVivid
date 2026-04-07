"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, Mail, Sparkles, X, Star, LogIn } from "lucide-react";
import { addToWaitlist } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";

const PRO_FEATURES = [
  "Unlimited Daily Predictions",
  "Monte Carlo Draw History",
  "Export Strategy CSV Data",
  "Email/Slack Draw Alerts",
  "Early Beta Algorithm Access",
  "Priority Support for Pool Packs"
];

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionCount: number;
}

export function PaywallModal({ isOpen, onClose, predictionCount }: PaywallModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSaving(true);
    try {
      await addToWaitlist(email, "paywall", predictionCount);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("Waitlist error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-lg overflow-hidden glass shadow-glow"
            style={{ 
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-accent)" 
            }}
          >
            {/* Top Badge */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-emerald" />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-accent-violet/20 border border-accent-violet/30">
                    <Lock className="w-5 h-5 text-accent-violet-bright" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white uppercase font-sans">
                      Daily Limit Reached
                    </h2>
                    <p className="text-[11px] font-mono text-text-muted tracking-widest uppercase">
                      Used: {predictionCount}/3 Predictions
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Pro Benefits */}
              <div className="space-y-4 mb-10">
                <h3 className="text-[10px] font-mono font-bold text-accent-violet-bright uppercase tracking-[0.2em] mb-2">
                  Unlock VectorLotto Pro
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PRO_FEATURES.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="p-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-[12px] font-medium text-text-secondary">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pricing Cards (Teaser) */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="text-[10px] font-mono text-text-muted uppercase mb-1">Monthly</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">$7</span>
                    <span className="text-[10px] text-text-muted">/mo</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-accent-violet/30 bg-accent-violet/10 relative overflow-hidden">
                  <div className="absolute -top-2 -right-6 px-8 py-1 rotate-45 bg-accent-violet-bright text-black text-[8px] font-black tracking-widest uppercase">
                    Best Value
                  </div>
                  <div className="text-[10px] font-mono text-accent-violet-bright uppercase mb-1">Lifetime</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">$49</span>
                    <span className="text-[10px] text-text-muted">/one-time</span>
                  </div>
                </div>
              </div>

              {/* Phase 1: Google Sign-In = Unlock gate */}
              <div className="space-y-4">
                {!user && (
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-[13px] font-bold transition-all hover:scale-[1.02] active:scale-100 border"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderColor: "rgba(255,255,255,0.15)",
                      color: "#fff",
                    }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                    Sign In with Google — Get Unlimited Access
                  </button>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                  <span className="text-[10px] font-mono text-text-muted uppercase">or join waitlist</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
                </div>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center text-center gap-2"
                  >
                    <Sparkles className="w-8 h-8 text-emerald-400 mb-2" />
                    <h4 className="font-bold text-white uppercase text-sm font-mono tracking-widest">
                      YOU'RE ON THE LIST!
                    </h4>
                    <p className="text-[12px] text-emerald-300/80">
                      We'll notify you as soon as Pro features launch.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-text-muted group-focus-within:text-accent-violet-bright transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="Enter your email for early access..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl glass border-white/10 text-[13px] font-medium text-white placeholder:text-text-muted focus:border-accent-violet-bright focus:outline-none transition-all focus:ring-4 focus:ring-accent-violet/10"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 group px-6 py-4 bg-accent-violet text-white text-[12px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-accent-violet-bright transition-all shadow-glow hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50"
                    >
                      <Star className="w-4 h-4 fill-white transition-transform group-hover:scale-125" />
                      {saving ? "Saving..." : "Notify Me & Unlock Early Access"}
                    </button>
                    <p className="text-center text-[10px] text-text-muted font-mono tracking-wide">
                      NO CREDIT CARD REQUIRED · PHASE 1 BETA
                    </p>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
