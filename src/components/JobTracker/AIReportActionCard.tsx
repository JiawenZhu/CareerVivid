import React from 'react';

interface AIReportActionCardProps {
  title: string;
  subtitle: string;
  buttonId: string;
  buttonColor: string;
  loading: boolean;
  content: string;
  emptyLabel: string;
  copyLabel: string;
  onGenerate: () => void;
  onCopy: () => void;
}

const AIReportActionCard: React.FC<AIReportActionCardProps> = ({
  title,
  subtitle,
  buttonId,
  buttonColor,
  loading,
  content,
  emptyLabel,
  copyLabel,
  onGenerate,
  onCopy,
}) => {
  return (
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
          marginBottom: content ? "10px" : 0,
        }}
      >
        <div>
          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "14px" }}>{title}</div>
          <div style={{ color: "#64748b", fontSize: "12px" }}>{subtitle}</div>
        </div>
        <button
          id={buttonId}
          onClick={onGenerate}
          disabled={loading}
          style={{
            background: loading ? "#334155" : buttonColor,
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "7px 14px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          {loading ? "…" : content ? "Regenerate" : emptyLabel}
        </button>
      </div>
      {content && (
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
          {content}
          <button
            onClick={onCopy}
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
            {copyLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default AIReportActionCard;
