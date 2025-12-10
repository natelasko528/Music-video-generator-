const STORAGE_KEY = 'music-video-project';
const STATE_VERSION = 3;

// OpenRouter planner models - one API key, many models
export const PLANNER_MODELS = {
  default: 'google/gemini-2.5-flash',
  pro: 'google/gemini-2.5-pro',
  claude: 'anthropic/claude-sonnet-4',
  gpt: 'openai/gpt-4o',
} as const;

// OpenRouter video/image models for video generation
// Note: OpenRouter provides image generation which we use frame-by-frame
// Some models also support native video understanding
export const VIDEO_MODELS = {
  geminiFlash: 'google/gemini-2.5-flash-image',
  geminiPro: 'google/gemini-3-pro-image-preview',
  gptImage: 'openai/gpt-5-image',
  gptImageMini: 'openai/gpt-5-image-mini',
} as const;

export type PlannerModelId = typeof PLANNER_MODELS[keyof typeof PLANNER_MODELS];
export type VideoModelId = typeof VIDEO_MODELS[keyof typeof VIDEO_MODELS];
export type TransitionType = 'cut' | 'crossfade' | 'fadeblack';
export type SceneStatus = 'pending' | 'generating' | 'done' | 'error' | 'sanitizing';
export type ActiveTab = 'setup' | 'timeline' | 'preview';

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  description: string;
  visualPrompt: string;
  status: SceneStatus;
  videoUri?: string;
  videoUrl?: string;
  errorMsg?: string;
}

export interface ProjectState {
  scenes: Scene[];
  lyrics: string;
  clipLength: number;
  aspectRatio: string;
  styleImageBase64: string;
  styleImageMime: string;
  audioDuration: number;
  transitionType: TransitionType;
  plannerModel: PlannerModelId;
  videoModel: VideoModelId;
  activeTab: ActiveTab;
  lastSavedAt: number | null;
  version: number;
}

type Subscriber = (next: ProjectState, prev: ProjectState) => void;
type ProjectStateUpdater = Partial<ProjectState> | ((draft: ProjectState) => void | Partial<ProjectState>);

const DEFAULT_STATE: ProjectState = {
  scenes: [],
  lyrics: '',
  clipLength: 5,
  aspectRatio: '16:9',
  styleImageBase64: '',
  styleImageMime: '',
  audioDuration: 0,
  transitionType: 'cut',
  plannerModel: PLANNER_MODELS.default,
  videoModel: VIDEO_MODELS.geminiFlash,
  activeTab: 'setup',
  lastSavedAt: null,
  version: STATE_VERSION,
};

let state: ProjectState = loadInitialState();
const subscribers = new Set<Subscriber>();

export function getProjectState(): ProjectState {
  return state;
}

export function subscribeToProjectState(listener: Subscriber): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function updateProjectState(
  updater: ProjectStateUpdater,
  options: { persist?: boolean } = {}
): ProjectState {
  const prev = state;
  let draft = cloneState(prev);

  if (typeof updater === 'function') {
    const possible = updater(draft);
    if (possible && typeof possible === 'object') {
      draft = { ...draft, ...possible };
    }
  } else if (updater && typeof updater === 'object') {
    draft = { ...draft, ...updater };
  }

  state = normalizeProjectState(draft);

  if (options.persist !== false) {
    state.lastSavedAt = Date.now();
    persistState(state);
  }

  notify(state, prev);
  return state;
}

export function resetProjectState() {
  const prev = state;
  state = cloneState(DEFAULT_STATE);
  persistState(state);
  notify(state, prev);
}

export function validatePlannerModel(modelId: string): PlannerModelId {
  const allowed = Object.values(PLANNER_MODELS) as string[];
  return allowed.includes(modelId) ? (modelId as PlannerModelId) : PLANNER_MODELS.default;
}

export function describePlannerModel(modelId: PlannerModelId): string {
  if (modelId === PLANNER_MODELS.pro) return 'Gemini 2.5 Pro (Best)';
  if (modelId === PLANNER_MODELS.claude) return 'Claude Sonnet 4';
  if (modelId === PLANNER_MODELS.gpt) return 'GPT-4o';
  return 'Gemini 2.5 Flash (Fast)';
}

export function validateVideoModel(modelId: string): VideoModelId {
  const allowed = Object.values(VIDEO_MODELS) as string[];
  return allowed.includes(modelId) ? (modelId as VideoModelId) : VIDEO_MODELS.geminiFlash;
}

export function describeVideoModel(modelId: VideoModelId): string {
  if (modelId === VIDEO_MODELS.geminiPro) return 'Gemini 3 Pro Image (Best)';
  if (modelId === VIDEO_MODELS.gptImage) return 'GPT-5 Image';
  if (modelId === VIDEO_MODELS.gptImageMini) return 'GPT-5 Image Mini (Fast)';
  return 'Gemini 2.5 Flash Image (Default)';
}

function notify(next: ProjectState, prev: ProjectState) {
  subscribers.forEach((listener) => listener(next, prev));
}

function persistState(next: ProjectState) {
  if (typeof window === 'undefined') return;
  const payload: ProjectState = {
    ...next,
    scenes: next.scenes.map(({ videoUrl, ...rest }) => rest),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota/storage errors silently
  }
}

function loadInitialState(): ProjectState {
  if (typeof window === 'undefined') {
    return cloneState(DEFAULT_STATE);
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return cloneState(DEFAULT_STATE);
    }
    const parsed = JSON.parse(stored);
    return normalizeProjectState({ ...DEFAULT_STATE, ...parsed });
  } catch {
    return cloneState(DEFAULT_STATE);
  }
}

function normalizeProjectState(candidate: ProjectState): ProjectState {
  const aspectRatio = candidate.aspectRatio || DEFAULT_STATE.aspectRatio;
  const clipLength = Number(candidate.clipLength) || DEFAULT_STATE.clipLength;
  const audioDuration = Number(candidate.audioDuration) || 0;
  const transitionType = isTransition(candidate.transitionType) ? candidate.transitionType : DEFAULT_STATE.transitionType;
  const activeTab = isActiveTab(candidate.activeTab) ? candidate.activeTab : DEFAULT_STATE.activeTab;

  return {
    ...DEFAULT_STATE,
    ...candidate,
    aspectRatio,
    clipLength,
    audioDuration,
    transitionType,
    activeTab,
    plannerModel: validatePlannerModel(candidate.plannerModel),
    videoModel: validateVideoModel(candidate.videoModel),
    scenes: Array.isArray(candidate.scenes) ? candidate.scenes.map(normalizeScene) : [],
    version: STATE_VERSION,
  };
}

function normalizeScene(scene: Scene): Scene {
  return {
    id: typeof scene.id === 'string' ? scene.id : cryptoRandomId(),
    startTime: Number(scene.startTime) || 0,
    endTime: Number(scene.endTime) || 0,
    description: scene.description || 'Scene',
    visualPrompt: scene.visualPrompt || '',
    status: isSceneStatus(scene.status) ? scene.status : 'pending',
    videoUri: scene.videoUri,
    videoUrl: undefined,
    errorMsg: scene.errorMsg,
  };
}

function cloneState(source: ProjectState): ProjectState {
  return {
    ...source,
    scenes: source.scenes.map((scene) => ({ ...scene })),
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `scene-${Math.random().toString(36).slice(2, 10)}`;
}

function isSceneStatus(value: any): value is SceneStatus {
  return value === 'pending'
    || value === 'generating'
    || value === 'done'
    || value === 'error'
    || value === 'sanitizing';
}

function isTransition(value: any): value is TransitionType {
  return value === 'cut' || value === 'crossfade' || value === 'fadeblack';
}

function isActiveTab(value: any): value is ActiveTab {
  return value === 'setup' || value === 'timeline' || value === 'preview';
}
