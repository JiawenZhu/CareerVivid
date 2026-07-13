import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { CourseWidgetProps } from './types';
import { createSystemDesignSimulationWidget } from './SystemDesignSimulationWidget';
import { SystemDesignAnswerDrillWidget, SystemDesignDecisionWidget } from './SystemDesignPracticeWidgets';

const traceWidget = (scenarioId: string) => lazy(() => import('./PatternTraceViz').then(({ createPatternTraceWidget }) => ({
  default: createPatternTraceWidget(scenarioId),
})));

const caseDrill = (caseId: string) => lazy(() => import('./sysViz/CaseDrillWidget').then(({ createCaseDrill }) => ({
  default: createCaseDrill(caseId),
})));

const orderingDrill = (setId: string) => lazy(() => import('./sysViz/OrderingWidget').then(({ createOrderingWidget }) => ({
  default: createOrderingWidget(setId),
})));

export type { CourseWidgetProps } from './types';

/**
 * Registry of interactive course widgets. Course JSON references these by id
 * (`widgetId` on an `interactive` lesson). To add a widget: build the
 * component, register it here, then use its id from any course file.
 *
 * Lazy-loaded so widget code doesn't weigh down the main bundle.
 */
export const courseWidgetRegistry: Record<string, ComponentType<CourseWidgetProps> | LazyExoticComponent<ComponentType<CourseWidgetProps>>> = {
  'token-predictor': lazy(() => import('./TokenPredictorWidget')),
  'ai-stack-sorter': lazy(() => import('./StackSorterWidget')),
  'temperature-playground': lazy(() => import('./TemperatureWidget')),
  'tokenizer-playground': lazy(() => import('./TokenizerWidget')),
  'context-window-visualizer': lazy(() => import('./ContextWindowWidget')),
  'prompt-builder': lazy(() => import('./PromptBuilderWidget')),
  'few-shot-trainer': lazy(() => import('./FewShotWidget')),
  'rag-pipeline': lazy(() => import('./RagPipelineWidget')),
  'agent-loop-simulator': lazy(() => import('./AgentLoopWidget')),
  'multi-agent-mission': lazy(() => import('./MultiAgentWidget')),
  'eval-grader': lazy(() => import('./EvalGraderWidget')),
  'injection-defender': lazy(() => import('./InjectionDefenderWidget')),
  'traffic-control': lazy(() => import('./TrafficControlWidget')),
  // Coding Interview Patterns — every algorithm gets its own animation.
  'sliding-window-viz': lazy(() => import('./SlidingWindowViz')),
  'monotonic-stack-viz': lazy(() => import('./MonotonicStackViz')),
  'backtracking-viz': lazy(() => import('./BacktrackingViz')),
  'two-pointers-viz': lazy(() => import('./TwoPointersViz')),
  'binary-search-viz': lazy(() => import('./BinarySearchViz')),
  'bfs-grid-viz': lazy(() => import('./BfsGridViz')),
  'dp-grid-viz': lazy(() => import('./DpGridViz')),
  'fast-slow-viz': lazy(() => import('./FastSlowViz')),
  'merge-intervals-viz': lazy(() => import('./MergeIntervalsViz')),
  'dfs-tree-viz': lazy(() => import('./DfsTreeViz')),
  'merge-sort-viz': traceWidget('merge-sort'),
  'quickselect-viz': traceWidget('quickselect'),
  'sweep-line-viz': traceWidget('sweep-line'),
  'monotonic-queue-viz': traceWidget('monotonic-queue'),
  'string-matching-viz': traceWidget('string-matching'),
  'union-find-viz': traceWidget('union-find'),
  'range-tree-viz': traceWidget('range-tree'),
  'mst-viz': traceWidget('mst'),
  'shortest-paths-viz': traceWidget('shortest-paths'),
  'network-flow-viz': traceWidget('network-flow'),
  // System Design Interview — every concept gets its own bespoke animation
  // (same design language as the Coding Interview Patterns course).
  'system-design-framework-viz': lazy(() => import('./sysViz/SdTimelineViz')),
  'system-design-capacity-viz': lazy(() => import('./sysViz/SdCapacityViz')),
  'system-design-api-data-viz': lazy(() => import('./sysViz/SdRequestFlowViz')),
  'system-design-building-blocks-viz': lazy(() => import('./sysViz/SdLoadBalancerViz')),
  'system-design-cache-rate-viz': lazy(() => import('./sysViz/SdCacheViz')),
  'system-design-data-scale-viz': lazy(() => import('./sysViz/SdShardingViz')),
  'system-design-async-viz': lazy(() => import('./sysViz/SdQueueViz')),
  'system-design-reliability-viz': lazy(() => import('./sysViz/SdCircuitBreakerViz')),
  'system-design-realtime-viz': lazy(() => import('./sysViz/SdFanoutViz')),
  'system-design-feeds-search-viz': lazy(() => import('./sysViz/SdFeedViz')),
  'system-design-kv-viz': lazy(() => import('./sysViz/SdHashRingViz')),
  'system-design-capstone-viz': lazy(() => import('./sysViz/SdSchedulerViz')),
  // Slider-driven what-if simulator kept as an extra exercise widget.
  'system-design-simulator': createSystemDesignSimulationWidget('interview-framework'),
  // System design practice banks (content basis: system-design-primer, CC BY 4.0).
  'sd-case-url-shortener': caseDrill('url-shortener'),
  'sd-case-twitter-timeline': caseDrill('twitter-timeline'),
  'sd-case-web-crawler': caseDrill('web-crawler'),
  'sd-case-chat-app': caseDrill('chat-app'),
  'sd-case-rate-limiter': caseDrill('rate-limiter'),
  'sd-case-file-sync': caseDrill('file-sync'),
  'sd-ordering-interview-phases': orderingDrill('interview-phases'),
  'sd-ordering-read-path': orderingDrill('read-path'),
  'sd-ordering-safe-deploy': orderingDrill('safe-deploy'),
  'sd-spot-the-flaw': lazy(() => import('./sysViz/SpotTheFlawWidget')),
  'sd-latency-flashcards': lazy(() => import('./sysViz/LatencyFlashcardsWidget')),
  'sd-capacity-quickfire': lazy(() => import('./sysViz/CapacityQuizWidget')),
  'system-design-decision': SystemDesignDecisionWidget,
  'system-design-answer-drill': SystemDesignAnswerDrillWidget,
};

export const getCourseWidget = (widgetId: string | undefined) =>
  widgetId ? courseWidgetRegistry[widgetId] : undefined;
