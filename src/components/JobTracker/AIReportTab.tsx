/**
 * AIReportTab.tsx
 *
 * The "AI Report" tab inside JobDetailModal.
 * Shows the Career-Ops A-F evaluation output and lets users trigger
 * the evaluation, LinkedIn outreach, and deep research workflows.
 */

import React, { useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  evaluateJob,
  generateLinkedInOutreach,
  generateDeepResearch,
} from "../../services/careerOpsService";
import type { JobApplicationData, AIJobEvaluation } from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4.5
      ? "#22c55e"
      : score >= 4.0
      ? "#84cc16"
      : score >= 3.0
      ? "#f59e0b"
      : "#ef4444";
  const label =
    score >= 4.5
      ? "Excellent Match"
      : score >= 4.0
      ? "Strong Match"
      : score >= 3.0
      ? "Moderate Match"
      : "Weak Match";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px",
        background: `${color}15`,
        border: `1px solid ${color}40`,
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `${color}25`,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "18px",
          color,
        }}
      >
        {score.toFixed(1)}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: "15px", color }}>
          {label}
        </div>
        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: 2 }}>
          Score out of 5.0
        </div>
      </div>
    </div>
  );
}

function EvalBlock({
  title,
  icon,
  content,
}: {
  title: string;
  icon: string;
  content: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        background: "#16213e",
        border: "1px solid #1e3a5f",
        borderRadius: "10px",
        marginBottom: "10px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#e2e8f0",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <span>
          {icon} {title}
        </span>
        <span style={{ color: "#64748b", fontSize: "18px" }}>
          {expanded ? "−" : "+"}
        </span>
      </button>
      {expanded && (
        <div
          style={{
            padding: "0 16px 14px",
            color: "#cbd5e1",
            fontSize: "13px",
            lineHeight: "1.7",
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

function ATSKeywords({ keywords }: { keywords: string[] }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          fontSize: "12px",
          color: "#64748b",
          fontWeight: 600,
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        🎯 ATS Keywords ({keywords.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {keywords.map((kw, i) => (
          <span
            key={i}
            style={{
              padding: "3px 10px",
              background: "#1e3a5f",
              color: "#93c5fd",
              borderRadius: "20px",
              fontSize: "12px",
              cursor: "pointer",
              userSelect: "all",
            }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface AIReportTabProps {
  job: JobApplicationData;
}

export default function AIReportTab({ job }: AIReportTabProps) {
  const { currentUser } = useAuth();

  const [evalLoading, setEvalLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [linkedInMsg, setLinkedInMsg] = useState<string>(
    (job as any).linkedInOutreach || ""
  );
  const [researchPrompt, setResearchPrompt] = useState<string>(
    (job as any).deepResearchPrompt || ""
  );
  const [evaluation, setEvaluation] = useState<AIJobEvaluation | null>(
    job.aiEvaluation || null
  );

  // ── Evaluate Job ─────────────────────────────────────────────────────────

  const handleEvaluate = useCallback(async () => {
    if (!job.jobDescription) {
      setError(
        "Please add a job description before running AI evaluation."
      );
      return;
    }
    setEvalLoading(true);
    setError(null);
    try {
      const result = await evaluateJob({
        jobId: job.id,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        jobDescription: job.jobDescription,
        jobPostURL: job.jobPostURL,
        location: job.location,
      });
      setEvaluation(result.evaluation);
    } catch (err: any) {
      const msg = err?.message || "Evaluation failed. Please try again.";
      if (msg.includes("career profile")) {
        setError(
          "⚠️ Career Profile not set up. Go to Settings → Career Profile and paste your CV."
        );
      } else if (msg.includes("credit")) {
        setError("💳 AI credit limit reached. Upgrade your plan to continue.");
      } else {
        setError(msg);
      }
    } finally {
      setEvalLoading(false);
    }
  }, [job]);

  // ── LinkedIn Outreach ─────────────────────────────────────────────────────

  const handleLinkedIn = useCallback(async () => {
    setLinkedInLoading(true);
    setError(null);
    try {
      const msg = await generateLinkedInOutreach({
        jobId: job.id,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
      });
      setLinkedInMsg(msg);
    } catch (err: any) {
      setError(err?.message || "Failed to generate outreach message.");
    } finally {
      setLinkedInLoading(false);
    }
  }, [job]);

  // ── Deep Research ─────────────────────────────────────────────────────────

  const handleResearch = useCallback(async () => {
    setResearchLoading(true);
    setError(null);
    try {
      const prompt = await generateDeepResearch({
        jobId: job.id,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        jobDescription: job.jobDescription,
      });
      setResearchPrompt(prompt);
    } catch (err: any) {
      setError(err?.message || "Failed to generate research prompt.");
    } finally {
      setResearchLoading(false);
    }
  }, [job]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "0 2px" }}>
      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "#7f1d1d20",
            border: "1px solid #ef444440",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#fca5a5",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Primary CTA — Run Evaluation */}
      {!evaluation && (
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🤖</div>
          <div
            style={{
              color: "#e2e8f0",
              fontWeight: 700,
              fontSize: "16px",
              marginBottom: "6px",
            }}
          >
            AI Job Evaluation
          </div>
          <div
            style={{
              color: "#64748b",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            Get a 6-axis analysis of this job against your career profile.
            Includes CV gap analysis, ATS keywords, comp research, and
            interview prep.
          </div>
          <button
            id="ai-evaluate-job-btn"
            onClick={handleEvaluate}
            disabled={evalLoading}
            style={{
              background: evalLoading
                ? "#334155"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: evalLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {evalLoading
              ? "⏳ Analyzing… (up to 30s)"
              : "✨ Run AI Evaluation — 3 credits"}
          </button>
        </div>
      )}

      {/* Evaluation Results */}
      {evaluation && (
        <div>
          <ScoreBadge score={evaluation.score} />

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: "4px 12px",
                background: "#1e3a5f",
                color: "#93c5fd",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {evaluation.archetype}
            </span>
            <span
              style={{
                padding: "4px 12px",
                background: evaluation.recommendApply ? "#14532d20" : "#7f1d1d20",
                color: evaluation.recommendApply ? "#86efac" : "#fca5a5",
                border: `1px solid ${evaluation.recommendApply ? "#86efac40" : "#fca5a540"}`,
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {evaluation.recommendApply ? "✅ Recommend Applying" : "⚠️ Consider Carefully"}
            </span>
          </div>

          {evaluation.atsKeywords?.length > 0 && (
            <ATSKeywords keywords={evaluation.atsKeywords} />
          )}

          <div style={{ marginTop: "16px" }}>
            <EvalBlock
              title="Role Overview"
              icon="📋"
              content={evaluation.blocksA_F.roleOverview}
            />
            <EvalBlock
              title="CV Match & Gaps"
              icon="🎯"
              content={evaluation.blocksA_F.cvMatch}
            />
            <EvalBlock
              title="Level Strategy"
              icon="📈"
              content={evaluation.blocksA_F.levelStrategy}
            />
            <EvalBlock
              title="Compensation Research"
              icon="💰"
              content={evaluation.blocksA_F.compResearch}
            />
            <EvalBlock
              title="Personalization Plan (Top 5 CV Tweaks)"
              icon="✏️"
              content={evaluation.blocksA_F.personalizationPlan}
            />
            <EvalBlock
              title="Interview Prep (STAR Stories)"
              icon="🎤"
              content={evaluation.blocksA_F.interviewPrep}
            />
          </div>

          {/* Re-run */}
          <button
            onClick={handleEvaluate}
            disabled={evalLoading}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#64748b",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              cursor: evalLoading ? "not-allowed" : "pointer",
              marginTop: "8px",
              marginBottom: "24px",
              width: "100%",
            }}
          >
            {evalLoading ? "⏳ Re-analyzing…" : "🔄 Re-run Evaluation — 3 credits"}
          </button>
        </div>
      )}

      {/* LinkedIn Outreach */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: linkedInMsg ? "10px" : 0,
          }}
        >
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "14px" }}>
              💼 LinkedIn Outreach
            </div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>
              ≤300 char personalised connection request
            </div>
          </div>
          <button
            id="ai-linkedin-outreach-btn"
            onClick={handleLinkedIn}
            disabled={linkedInLoading}
            style={{
              background: linkedInLoading ? "#334155" : "#0077b5",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: linkedInLoading ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {linkedInLoading ? "…" : linkedInMsg ? "Regenerate" : "Generate — 1 credit"}
          </button>
        </div>
        {linkedInMsg && (
          <div
            style={{
              background: "#16213e",
              borderRadius: "8px",
              padding: "12px",
              color: "#cbd5e1",
              fontSize: "13px",
              lineHeight: "1.6",
              position: "relative",
            }}
          >
            {linkedInMsg}
            <button
              onClick={() => navigator.clipboard.writeText(linkedInMsg)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#1e3a5f",
                color: "#93c5fd",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {/* Deep Research Prompt */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: researchPrompt ? "10px" : 0,
          }}
        >
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "14px" }}>
              🔍 Deep Research
            </div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>
              Perplexity.ai research prompt for {job.companyName}
            </div>
          </div>
          <button
            id="ai-deep-research-btn"
            onClick={handleResearch}
            disabled={researchLoading}
            style={{
              background: researchLoading ? "#334155" : "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: researchLoading ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {researchLoading
              ? "…"
              : researchPrompt
              ? "Regenerate"
              : "Generate — 1 credit"}
          </button>
        </div>
        {researchPrompt && (
          <div
            style={{
              background: "#16213e",
              borderRadius: "8px",
              padding: "12px",
              color: "#cbd5e1",
              fontSize: "12px",
              lineHeight: "1.6",
              position: "relative",
              whiteSpace: "pre-wrap",
            }}
          >
            {researchPrompt}
            <button
              onClick={() => {
                navigator.clipboard.writeText(researchPrompt);
                window.open("https://www.perplexity.ai/", "_blank");
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#1e3a5f",
                color: "#93c5fd",
                border: "none",
                borderRadius: "4px",
                padding: "3px 8px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Copy & Open Perplexity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
