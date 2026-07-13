import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import type { CourseWidgetProps } from './types';

/**
 * Tokenizer playground — the learner types text and watches it split into
 * (approximate) tokens, with live counts and API-cost estimates. Completes
 * once they've edited the text and produced at least 20 tokens.
 */

const DEFAULT_TEXT = 'Type here and watch your words become tokens!';

/** Approximate BPE-style splitting: short words are one token, long words split into 3-4 char pieces. */
const tokenize = (text: string): string[] => {
  const tokens: string[] = [];
  const parts = text.match(/\s*[\p{L}\p{N}]+|\s*[^\s\p{L}\p{N}]/gu) ?? [];
  const sizes = [4, 3, 4, 4, 3];
  for (const part of parts) {
    const trimmed = part.trimStart();
    const lead = part.slice(0, part.length - trimmed.length);
    // Non-ASCII (e.g. CJK, emoji) tends to cost roughly one token per character.
    if (/[^\x00-\x7F]/.test(trimmed)) {
      const chars = Array.from(trimmed);
      chars.forEach((ch, i) => tokens.push(i === 0 ? lead + ch : ch));
      continue;
    }
    if (trimmed.length <= 4) {
      tokens.push(part);
      continue;
    }
    let i = 0;
    let n = 0;
    while (i < trimmed.length) {
      const size = Math.min(sizes[n % sizes.length], trimmed.length - i);
      tokens.push((i === 0 ? lead : '') + trimmed.slice(i, i + size));
      i += size;
      n += 1;
    }
  }
  return tokens;
};

const PRICE_TIERS = [
  { name: 'Budget model', perMillion: 0.25 },
  { name: 'Mid-tier model', perMillion: 3 },
  { name: 'Frontier model', perMillion: 15 },
];

const CHIP_COLORS = [
  'bg-[#e8e5ff] text-[#4c43b3] dark:bg-[#37317a]/60 dark:text-[#c4befc]',
  'bg-[#dff3e4] text-[#1e7a3c] dark:bg-[#1c4a2b]/60 dark:text-[#8fe3ab]',
  'bg-[#ffe9d6] text-[#a35410] dark:bg-[#5c3a17]/60 dark:text-[#ffc891]',
  'bg-[#e0f0ff] text-[#1861a8] dark:bg-[#1c3f5e]/60 dark:text-[#8fc9ff]',
];

const TokenizerWidget: React.FC<CourseWidgetProps> = ({ completed, onComplete }) => {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [edited, setEdited] = useState(false);

  const tokens = useMemo(() => tokenize(text), [text]);
  const chars = text.length;
  const ratio = tokens.length > 0 ? (chars / tokens.length).toFixed(1) : '—';

  useEffect(() => {
    if (edited && tokens.length >= 20 && !completed) onComplete();
  }, [edited, tokens.length, completed, onComplete]);

  return (
    <div className="rounded-2xl border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-5">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--cv-action-primary)]">
        <Coins size={13} /> Tokenizer playground
      </p>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setEdited(true); }}
        rows={3}
        className="mt-3 w-full resize-y rounded-xl border border-[var(--cv-border-warm)] bg-transparent p-3 font-mono text-[13px] text-[var(--cv-text-heading)] outline-none focus:border-[var(--cv-action-border)]"
        placeholder="Type anything — a prompt, a paragraph, an emoji, 中文…"
        aria-label="Text to tokenize"
      />

      {/* Token chips */}
      <div className="mt-3 flex min-h-[44px] flex-wrap gap-1 rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3">
        {tokens.map((token, i) => (
          <motion.span
            key={`${i}-${token}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className={`whitespace-pre rounded-md px-1.5 py-0.5 font-mono text-[12px] font-bold ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
          >
            {token}
          </motion.span>
        ))}
        {tokens.length === 0 && <span className="text-xs text-[var(--cv-text-muted)]">Tokens appear here…</span>}
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-[var(--cv-border-warm)] p-2.5">
          <p className="text-lg font-extrabold tabular-nums text-[var(--cv-text-heading)]">{tokens.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">tokens</p>
        </div>
        <div className="rounded-xl border border-[var(--cv-border-warm)] p-2.5">
          <p className="text-lg font-extrabold tabular-nums text-[var(--cv-text-heading)]">{chars}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">characters</p>
        </div>
        <div className="rounded-xl border border-[var(--cv-border-warm)] p-2.5">
          <p className="text-lg font-extrabold tabular-nums text-[var(--cv-text-heading)]">{ratio}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">chars / token</p>
        </div>
      </div>

      {/* Cost estimate */}
      <div className="mt-3 rounded-xl bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.04))] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">
          Sending this prompt 10,000 times would cost (input tokens only):
        </p>
        <div className="mt-1.5 grid gap-1 sm:grid-cols-3">
          {PRICE_TIERS.map((tier) => (
            <p key={tier.name} className="text-xs font-medium text-[var(--cv-text-body)]">
              <span className="font-extrabold tabular-nums text-[var(--cv-text-heading)]">
                ${((tokens.length * 10_000 * tier.perMillion) / 1_000_000).toFixed(2)}
              </span>{' '}
              {tier.name.toLowerCase()}
            </p>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[11px] font-medium text-[var(--cv-text-muted)]">
        {completed || (edited && tokens.length >= 20)
          ? '✓ Lesson complete! Try pasting emoji or non-English text — notice how the token count jumps. That is why the same message costs more in some languages.'
          : 'To complete: edit the text so it produces at least 20 tokens. (Splitting shown here is approximate — real tokenizers learn their pieces from data.)'}
      </p>
    </div>
  );
};

export default TokenizerWidget;
