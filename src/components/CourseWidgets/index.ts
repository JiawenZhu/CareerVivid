import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { CourseWidgetProps } from './types';

export type { CourseWidgetProps } from './types';

/**
 * Registry of interactive course widgets. Course JSON references these by id
 * (`widgetId` on an `interactive` lesson). To add a widget: build the
 * component, register it here, then use its id from any course file.
 *
 * Lazy-loaded so widget code doesn't weigh down the main bundle.
 */
export const courseWidgetRegistry: Record<string, LazyExoticComponent<ComponentType<CourseWidgetProps>>> = {
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
};

export const getCourseWidget = (widgetId: string | undefined) =>
  widgetId ? courseWidgetRegistry[widgetId] : undefined;
