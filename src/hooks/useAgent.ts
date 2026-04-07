import { useState, useCallback, useRef, useEffect } from 'react';
import { Content } from '@google/genai';
import { QueryEngine, QueryEngineOptions } from '../agent/QueryEngine';
import { Tool } from '../agent/Tool';

export interface UseAgentOptions {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  tools?: Tool[];
  thinkingBudget?: number;
  maxHistoryLength?: number;
}

export interface UseAgentReturn {
  /** Send a prompt; uses streaming if onChunk is provided */
  ask: (prompt: string) => Promise<void>;
  /** Ask with live streaming — updates streamingText as tokens arrive */
  askStreaming: (prompt: string) => Promise<void>;
  /** Full conversation history (for replaying tool calls etc.) */
  history: Content[];
  /** Whether the engine is currently generating */
  isGenerating: boolean;
  /** Whether context is being compacted */
  isCompacting: boolean;
  /** In-progress streaming text (cleared when generation finishes) */
  streamingText: string;
  /** Clear all conversation history */
  clearHistory: () => void;
}

export function useAgent(options: UseAgentOptions): UseAgentReturn {
  const [history, setHistory] = useState<Content[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const engineRef = useRef<QueryEngine | null>(null);

  // Build / rebuild engine when options change
  useEffect(() => {
    if (options.apiKey) {
      engineRef.current = new QueryEngine({
        apiKey: options.apiKey,
        model: options.model,
        systemInstruction: options.systemInstruction,
        tools: options.tools,
        thinkingBudget: options.thinkingBudget,
        maxHistoryLength: options.maxHistoryLength,
      } as QueryEngineOptions);
    }
  }, [
    options.apiKey,
    options.model,
    options.systemInstruction,
    options.tools,
    options.thinkingBudget,
    options.maxHistoryLength,
  ]);

  /** Sync React state from the engine's history */
  const syncHistory = useCallback(() => {
    if (engineRef.current) {
      setHistory([...engineRef.current.getHistory()]);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Non-streaming ask
  // -------------------------------------------------------------------------
  const ask = useCallback(async (prompt: string) => {
    if (!engineRef.current) {
      console.error('Agent not initialized — ensure an apiKey is provided.');
      return;
    }

    setIsGenerating(true);

    try {
      await engineRef.current.runLoop(prompt, {
        onResponse: syncHistory,
        onToolResult: syncHistory,
        onCompacting: () => {
          setIsCompacting(true);
          syncHistory();
        },
        onError: (err) => {
          console.error('QueryEngine error:', err);
        },
      });
      setIsCompacting(false);
      syncHistory();
    } catch (err) {
      console.error('Agent error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [syncHistory]);

  // -------------------------------------------------------------------------
  // Streaming ask — onChunk fires per token
  // -------------------------------------------------------------------------
  const askStreaming = useCallback(async (prompt: string) => {
    if (!engineRef.current) {
      console.error('Agent not initialized — ensure an apiKey is provided.');
      return;
    }

    setIsGenerating(true);
    setStreamingText('');

    try {
      await engineRef.current.runLoopStreaming(prompt, {
        onChunk: (text) => {
          setStreamingText(prev => prev + text);
        },
        onToolResult: syncHistory,
        onCompacting: () => {
          setIsCompacting(true);
          syncHistory();
        },
        onError: (err) => {
          console.error('QueryEngine streaming error:', err);
        },
      });
      setIsCompacting(false);
      syncHistory();
    } catch (err) {
      console.error('Agent streaming error:', err);
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  }, [syncHistory]);

  // -------------------------------------------------------------------------
  // Clear history
  // -------------------------------------------------------------------------
  const clearHistory = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setHistory([]);
      setHistory([]);
      setStreamingText('');
    }
  }, []);

  return {
    ask,
    askStreaming,
    history,
    isGenerating,
    isCompacting,
    streamingText,
    clearHistory,
  };
}
