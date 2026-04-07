"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, User, Crown, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AuthBar() {
  const { user, profile, loading, signInWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-7 w-24 rounded-lg animate-pulse" style={{ background: "var(--bg-elevated)" }} />
    );
  }

  if (!user) {
    return (
      <motion.button
        onClick={signInWithGoogle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))",
          border: "1px solid rgba(124,58,237,0.5)",
          color: "#a78bfa",
        }}
      >
        <LogIn className="w-3.5 h-3.5" />
        Sign In for Unlimited
      </motion.button>
    );
  }

  const isPro = profile?.plan === "pro";

  return (
    <div className="flex items-center gap-2">
      {isPro && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <Crown className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-mono text-amber-400 font-bold">PRO</span>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        {user.photoURL ? (
          <img src={user.photoURL} className="w-5 h-5 rounded-full" alt={user.displayName ?? "User"} />
        ) : (
          <User className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        )}
        <span className="text-[11px] font-mono hidden sm:block" style={{ color: "var(--text-secondary)" }}>
          {user.displayName?.split(" ")[0] ?? user.email?.split("@")[0]}
        </span>
        <button
          onClick={logout}
          className="p-0.5 rounded hover:text-rose-400 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    </div>
  );
}
