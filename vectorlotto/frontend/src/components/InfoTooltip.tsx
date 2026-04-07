"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";

interface InfoTooltipProps {
  title: string;
  content: string;
}

export function InfoTooltip({ title, content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block ml-2" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full transition-colors hover:bg-white/10 text-text-muted hover:text-accent-violet-bright"
        aria-label="More info"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 w-64 p-4 mt-2 -right-2 glass shadow-2xl pointer-events-auto"
            style={{
              background: "rgba(22, 27, 45, 0.95)",
              border: "1px solid var(--border-accent)",
              boxShadow: "0 0 30px rgba(124, 58, 237, 0.2)"
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold tracking-tight uppercase text-accent-violet-bright font-mono">
                {title}
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[12px] leading-relaxed text-text-secondary">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
