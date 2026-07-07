export interface CourseModule {
  id: string;
  order: number;
  title: string;
  objective: string;
  topics: string[];
  exercise: string | null;
  project: string | null;
  sourceIds: string[];
  referenceOnly?: { sourceId: string; reason: string }[];
}

export interface LearningSource {
  id: string;
  title: string;
  org: string | null;
  repoUrl: string | null;
  license: string;
  commercialUse: boolean;
  downloadable: boolean;
  localPath: string | null;
  moduleIds: string[];
  notes?: string;
}

const moduleFiles = import.meta.glob('../../data/learning/modules/*.json', { eager: true }) as Record<
  string,
  { default: CourseModule }
>;

const MODULES: CourseModule[] = Object.values(moduleFiles)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order);

const sourcesFile = import.meta.glob('../../data/learning/sources.json', { eager: true }) as Record<
  string,
  { default: { sources: LearningSource[] } }
>;
const SOURCES: LearningSource[] = Object.values(sourcesFile)[0]?.default.sources ?? [];
const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

/** Ordered list of the curriculum's 10 modules. */
export const getCourseModules = (): CourseModule[] => MODULES;

export const getCourseModuleById = (id: string): CourseModule | undefined =>
  MODULES.find((m) => m.id === id);

export const getLearningSourceById = (id: string): LearningSource | undefined => SOURCE_BY_ID.get(id);

export type CourseModuleState = 'completed' | 'available' | 'locked';

/**
 * Sequential unlock: a module is available once the module directly before it
 * (by curriculum order) is completed. The first module is always available.
 */
export const getCourseModuleState = (
  module: CourseModule,
  completedIds: ReadonlySet<string>,
): CourseModuleState => {
  if (completedIds.has(module.id)) return 'completed';
  if (module.order <= 1) return 'available';
  const previous = MODULES.find((m) => m.order === module.order - 1);
  return !previous || completedIds.has(previous.id) ? 'available' : 'locked';
};

export interface CourseModuleWithState extends CourseModule {
  state: CourseModuleState;
}

export const getCourseModulesWithState = (completedIds: Iterable<string>): CourseModuleWithState[] => {
  const completed = new Set(completedIds);
  return MODULES.map((module) => ({ ...module, state: getCourseModuleState(module, completed) }));
};

export const getCourseTotalCount = (): number => MODULES.length;
