import React, { useState, useRef, useEffect } from 'react';
import { Tool } from '../agent/Tool';
import { useAgent } from '../hooks/useAgent';
import { CODING_AGENT_SYSTEM_PROMPT } from '../agent/QueryEngine';

// ---------------------------------------------------------------------------
// Minimal code-block renderer (no external dep)
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on fenced code blocks ```lang?\n...\n```
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      nodes.push(
        <span key={`t-${lastIndex}`} className="agent-text">
          {before}
        </span>,
      );
    }

    const lang = match[1] || 'code';
    const code = match[2].trim();
    nodes.push(
      <div key={`cb-${match.index}`} className="agent-code-block">
        <div className="agent-code-lang">{lang}</div>
        <pre className="agent-code-pre">
          <code>{code}</code>
        </pre>
      </div>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push(
      <span key={`t-${lastIndex}`} className="agent-text">
        {text.slice(lastIndex)}
      </span>,
    );
  }

  return nodes.length > 0 ? nodes : [<span key="empty">{text}</span>];
}

// ---------------------------------------------------------------------------
// AgentChat Component
// ---------------------------------------------------------------------------

export interface AgentChatProps {
  apiKey: string;
  tools?: Tool[];
  systemInstruction?: string;
  /** Use coding-optimised system prompt. Default: false */
  codingMode?: boolean;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  apiKey,
  tools,
  systemInstruction,
  codingMode = false,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resolvedSystem = systemInstruction
    ?? (codingMode ? CODING_AGENT_SYSTEM_PROMPT : 'You are a helpful AI assistant.');

  const { askStreaming, history, isGenerating, isCompacting, streamingText, clearHistory } =
    useAgent({
      apiKey,
      tools,
      systemInstruction: resolvedSystem,
    });

  // Scroll to bottom on new messages / streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    const prompt = input;
    setInput('');
    await askStreaming(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <>
      {/* Scoped styles */}
      <style>{`
        .agent-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 700px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: #0f172a;
          font-family: 'Inter', system-ui, sans-serif;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }
        .agent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
        }
        .agent-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #e2e8f0;
          font-size: 14px;
        }
        .agent-mode-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #6366f1;
          color: white;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .agent-clear-btn {
          font-size: 12px;
          color: #64748b;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .agent-clear-btn:hover { color: #e2e8f0; background: #334155; }
        .agent-compact-banner {
          background: #1e293b;
          border-bottom: 1px solid #334155;
          padding: 6px 16px;
          font-size: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .agent-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: #334155 transparent;
        }
        .agent-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          font-size: 14px;
          font-style: italic;
        }
        .agent-bubble-wrap {
          display: flex;
          flex-direction: column;
        }
        .agent-bubble-wrap.user { align-items: flex-end; }
        .agent-bubble-wrap.model { align-items: flex-start; }
        .agent-role-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
          color: #64748b;
        }
        .agent-bubble {
          max-width: 85%;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .agent-bubble.user {
          background: #6366f1;
          color: #fff;
          border-bottom-right-radius: 2px;
        }
        .agent-bubble.model {
          background: #1e293b;
          color: #e2e8f0;
          border-bottom-left-radius: 2px;
          border: 1px solid #334155;
        }
        .agent-bubble.streaming {
          border-color: #6366f1;
        }
        .agent-tool-call {
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 6px 10px;
          margin-top: 6px;
          color: #f59e0b;
        }
        .agent-tool-result {
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          background: #064e3b;
          border: 1px solid #065f46;
          border-radius: 6px;
          padding: 6px 10px;
          margin-top: 6px;
          color: #6ee7b7;
          max-height: 120px;
          overflow-y: auto;
        }
        .agent-code-block {
          margin: 8px 0;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #334155;
        }
        .agent-code-lang {
          background: #1e293b;
          color: #64748b;
          font-family: 'Fira Code', monospace;
          font-size: 10px;
          padding: 3px 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 1px solid #334155;
        }
        .agent-code-pre {
          background: #020617;
          margin: 0;
          padding: 10px 12px;
          overflow-x: auto;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.6;
          color: #7dd3fc;
        }
        .agent-text { white-space: pre-wrap; }
        .agent-dots {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 10px 14px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 10px;
          border-bottom-left-radius: 2px;
          width: fit-content;
        }
        .agent-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6366f1;
          animation: agent-bounce 1.2s infinite;
        }
        .agent-dot:nth-child(2) { animation-delay: 0.2s; }
        .agent-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes agent-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        .agent-form {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: #1e293b;
          border-top: 1px solid #334155;
          align-items: flex-end;
        }
        .agent-textarea {
          flex: 1;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 10px 12px;
          color: #e2e8f0;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          max-height: 120px;
          min-height: 40px;
          outline: none;
          transition: border-color 0.15s;
          line-height: 1.5;
        }
        .agent-textarea:focus { border-color: #6366f1; }
        .agent-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        .agent-textarea::placeholder { color: #475569; }
        .agent-send-btn {
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          white-space: nowrap;
          min-height: 40px;
        }
        .agent-send-btn:hover:not(:disabled) { background: #4f46e5; }
        .agent-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .agent-hint {
          font-size: 10px;
          color: #334155;
          padding: 0 16px 6px;
          background: #1e293b;
          text-align: right;
        }
      `}</style>

      <div className="agent-chat">
        {/* Header */}
        <div className="agent-header">
          <div className="agent-header-title">
            <span>🤖</span>
            <span>AI Agent</span>
            {codingMode && <span className="agent-mode-badge">CODING</span>}
          </div>
          <button className="agent-clear-btn" onClick={clearHistory}>
            Clear memory
          </button>
        </div>

        {/* Compacting banner */}
        {isCompacting && (
          <div className="agent-compact-banner">
            <span>📦</span>
            <span>Compacting context window…</span>
          </div>
        )}

        {/* Messages */}
        <div className="agent-messages">
          {history.length === 0 && !isGenerating ? (
            <div className="agent-empty">
              {codingMode
                ? 'Coding agent is ready. Describe a task or paste code to analyze.'
                : 'Start a conversation with the agent…'}
            </div>
          ) : (
            history.map((turn, i) => {
              const isUser = turn.role === 'user';
              const isModel = turn.role === 'model';

              const texts = turn.parts?.map(p => p.text).filter(Boolean) || [];
              const toolCalls = turn.parts?.map(p => p.functionCall).filter(Boolean) || [];
              const toolResults = turn.parts?.map(p => p.functionResponse).filter(Boolean) || [];

              // Skip empty turns
              if (!texts.length && !toolCalls.length && !toolResults.length) return null;

              return (
                <div key={i} className={`agent-bubble-wrap ${isUser ? 'user' : 'model'}`}>
                  <div className="agent-role-label">{isUser ? 'You' : 'Agent'}</div>

                  {texts.length > 0 && (
                    <div className={`agent-bubble ${isUser ? 'user' : 'model'}`}>
                      {texts.map((t, j) =>
                        isModel ? renderMarkdown(t || '') : <span key={j}>{t}</span>,
                      )}
                    </div>
                  )}

                  {toolCalls.map((tc, j) => (
                    <div key={j} className="agent-tool-call">
                      🛠️ {tc.name}({JSON.stringify(tc.args).slice(0, 120)})
                    </div>
                  ))}

                  {toolResults.map((tr, j) => (
                    <div key={j} className="agent-tool-result">
                      ✅ {JSON.stringify(tr.response?.result ?? tr.response?.error).slice(0, 300)}
                    </div>
                  ))}
                </div>
              );
            })
          )}

          {/* Live streaming bubble */}
          {isGenerating && streamingText && (
            <div className="agent-bubble-wrap model">
              <div className="agent-role-label">Agent</div>
              <div className="agent-bubble model streaming">
                {renderMarkdown(streamingText)}
              </div>
            </div>
          )}

          {/* Waiting dots (before first chunk arrives) */}
          {isGenerating && !streamingText && (
            <div className="agent-bubble-wrap model">
              <div className="agent-dots">
                <div className="agent-dot" />
                <div className="agent-dot" />
                <div className="agent-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="agent-form" onSubmit={handleSubmit}>
          <textarea
            className="agent-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? 'Agent is working…' : 'Type a message… (Enter to send, Shift+Enter for newline)'}
            disabled={isGenerating}
            rows={1}
          />
          <button type="submit" disabled={isGenerating || !input.trim()} className="agent-send-btn">
            {isGenerating ? '…' : 'Send'}
          </button>
        </form>
        <div className="agent-hint">Powered by Gemini · Context auto-compacts at 40 turns</div>
      </div>
    </>
  );
};
