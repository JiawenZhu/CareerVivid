"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Sparkles } from "lucide-react";

const ONBOARDING_STEPS = [
  {
    id: "predictions-section",
    title: "AI Predictions",
    text: "These are your AI-suggested lottery numbers for the next draw. Each uses a different strategy—HOT picks frequent numbers, COLD picks overdue ones.",
    position: "bottom"
  },
  {
    id: "heatmap-section",
    title: "Probability Heatmap",
    text: "Brighter purple = that number appears more in our model. This is based on 3 years of historical Mega Millions data.",
    position: "top"
  },
  {
    id: "mab-section",
    title: "MAB Strategy Agent",
    text: "Think of 4 AI robots competing to find the best strategy. The one with the highest win rate gets more tickets allocated.",
    position: "left"
  },
  {
    id: "simulator-section",
    title: "Monte Carlo Simulator",
    text: "Simulates 200 future draws and counts how often your tickets would win. Purely virtual—no money involved.",
    position: "top"
  }
];

export function OnboardingOverlay() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("vectorlotto_onboardingDone");
    if (!hasSeenOnboarding) {
      setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
      }, 1500);
    }
  }, []);

  const updateSpotlight = useCallback(() => {
    if (currentStep >= 0 && currentStep < ONBOARDING_STEPS.length) {
      const element = document.getElementById(ONBOARDING_STEPS[currentStep].id);
      if (element) {
        setSpotlightRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentStep]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    return () => window.removeEventListener("resize", updateSpotlight);
  }, [updateSpotlight]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem("vectorlotto_onboardingDone", "true");
  };

  if (!isVisible || currentStep === -1 || !spotlightRect) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Darkened backdrop with spotlight cutout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        style={{
          clipPath: `polygon(
            0% 0%, 
            0% 100%, 
            ${spotlightRect.left - 8}px 100%, 
            ${spotlightRect.left - 8}px ${spotlightRect.top - 8}px, 
            ${spotlightRect.right + 8}px ${spotlightRect.top - 8}px, 
            ${spotlightRect.right + 8}px ${spotlightRect.bottom + 8}px, 
            ${spotlightRect.left - 8}px ${spotlightRect.bottom + 8}px, 
            ${spotlightRect.left - 8}px 100%, 
            100% 100%, 
            100% 0%
          )`
        }}
      />

      {/* Tooltip content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="absolute z-[101] pointer-events-auto max-w-sm glass p-6 shadow-glow"
          style={{
            left: step.position === "left" ? spotlightRect.left - 380 : (step.position === "right" ? spotlightRect.right + 20 : spotlightRect.left),
            top: step.position === "top" ? spotlightRect.top - 200 : (step.position === "bottom" ? spotlightRect.bottom + 20 : spotlightRect.top),
            width: "340px",
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-accent)"
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent-violet-bright" />
            <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-white">
              {step.title}
            </h3>
            <span className="ml-auto text-[10px] font-mono text-text-muted">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>
          
          <p className="text-[13px] leading-relaxed text-text-secondary mb-6">
            {step.text}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={handleComplete}
              className="text-[11px] font-mono uppercase tracking-widest text-text-muted hover:text-white transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-accent-violet text-white text-[11px] font-mono uppercase tracking-widest rounded-md hover:bg-accent-violet-bright transition-all shadow-glow"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
