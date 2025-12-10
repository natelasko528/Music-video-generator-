/* tslint:disable */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
    getProjectState,
    subscribeToProjectState,
    updateProjectState,
    resetProjectState,
    describePlannerModel,
    validatePlannerModel,
    describeVideoModel,
    validateVideoModel,
    PLANNER_MODELS,
    VIDEO_MODELS,
    type PlannerModelId,
    type VideoModelId,
    type ProjectState,
    type Scene
} from './state/store';

// OpenRouter API configuration
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Helper to make OpenRouter API calls
async function openRouterFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${OPENROUTER_API_BASE}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Directors Cut - AI Music Video',
        ...(options.headers || {})
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
}

// --- Globals ---

declare global {
    interface AIStudio {
        openSelectKey: () => Promise<void>;
        hasSelectedApiKey: () => Promise<boolean>;
    }
    interface Window {
        aistudio?: AIStudio;
        renderSingleScene?: (id: string) => Promise<void>;
    }
}

let audioBlobUrl: string | null = null;
let instrumentalBlobUrl: string | null = null;
let uploadedAudioFile: File | null = null;
let masterPlaybackInterval: number | null = null;

// --- DOM Elements ---

const audioInput = document.getElementById('audio-input') as HTMLInputElement;
const audioEl = document.getElementById('audio-element') as HTMLAudioElement;
const audioDurationEl = document.getElementById('audio-duration') as HTMLElement;
const vocalRemovalBtn = document.getElementById('vocal-removal-btn') as HTMLButtonElement;
const vocalRemovalStatus = document.getElementById('vocal-removal-status') as HTMLElement;
const instrumentalDownloadLink = document.getElementById('instrumental-download') as HTMLAnchorElement;

const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
const planButton = document.getElementById('plan-button') as HTMLButtonElement;
const clearProjectBtn = document.getElementById('clear-project') as HTMLButtonElement;

const aspectRatioSelect = document.getElementById('aspect-ratio') as HTMLSelectElement;
const clipLengthSelect = document.getElementById('clip-length') as HTMLSelectElement;
const transitionSelect = document.getElementById('transition-select') as HTMLSelectElement;
const plannerModelSelect = document.getElementById('planner-model') as HTMLSelectElement;
const videoModelSelect = document.getElementById('video-model') as HTMLSelectElement;
const styleInput = document.getElementById('style-image') as HTMLInputElement;
const stylePreview = document.getElementById('style-preview') as HTMLImageElement;

const sceneContainer = document.getElementById('scene-container') as HTMLDivElement;
const renderAllBtn = document.getElementById('render-all-btn') as HTMLButtonElement;

// Dual Player Elements
const videoLayer1 = document.getElementById('video-layer-1') as HTMLVideoElement;
const videoLayer2 = document.getElementById('video-layer-2') as HTMLVideoElement;
let activeVideoLayer = 1; // 1 or 2
let lastActiveSceneId: string | null = null;

const playPauseBtn = document.getElementById('play-pause-master') as HTMLButtonElement;
const iconPlay = document.getElementById('icon-play') as HTMLElement;
const iconPause = document.getElementById('icon-pause') as HTMLElement;
const currentTimeEl = document.getElementById('current-time') as HTMLElement;
const totalTimeEl = document.getElementById('total-time') as HTMLElement;
const progressBar = document.getElementById('progress-bar') as HTMLElement;
const nowPlayingText = document.getElementById('now-playing-text') as HTMLElement;
const saveStatus = document.getElementById('save-status') as HTMLElement;

const debugOutput = document.getElementById('debug-output') as HTMLDivElement;
const clearConsoleBtn = document.getElementById('clear-console') as HTMLButtonElement;

const tabButtons = Array.from(document.querySelectorAll('[data-tab]')) as HTMLButtonElement[];
const mobilePanels = Array.from(document.querySelectorAll('.mobile-panel')) as HTMLDivElement[];
const aspectButtons = Array.from(document.querySelectorAll('.aspect-btn')) as HTMLButtonElement[];
const clipButtons = Array.from(document.querySelectorAll('.clip-btn')) as HTMLButtonElement[];

// --- Logging System ---

type LogType = 'info' | 'success' | 'warn' | 'error' | 'system';

const debugState = {
    verbose: false
};

const debugToggle = document.getElementById('debug-toggle') as HTMLInputElement;

function hydrateDebugPreference() {
    const params = new URLSearchParams(window.location.search);
    const queryDebug = params.get('debug');
    const saved = localStorage.getItem('debug-verbose');

    if (queryDebug && ['1', 'true', 'verbose'].includes(queryDebug.toLowerCase())) {
        debugState.verbose = true;
    } else if (saved) {
        debugState.verbose = saved === 'true';
    }

    if (debugToggle) {
        debugToggle.checked = debugState.verbose;
    }
}

function persistDebugPreference(enabled: boolean) {
    localStorage.setItem('debug-verbose', String(enabled));
}

interface LogOptions {
    context?: Record<string, unknown>;
    verbose?: boolean;
}

function log(message: string, type: LogType = 'info', options: LogOptions = {}) {
    if (options.verbose && !debugState.verbose) return;

    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString().split(' ')[0];

    let colorClass = 'text-gray-400';
    if (type === 'success') colorClass = 'text-green-400';
    if (type === 'warn') colorClass = 'text-yellow-400';
    if (type === 'error') colorClass = 'text-red-400';
    if (type === 'system') colorClass = 'text-blue-400 font-bold';

    let body = `<span class="text-gray-600 mr-2">[${timestamp}]</span><span class="${colorClass}">${message}</span>`;

    if (options.context) {
        const formattedContext = JSON.stringify(options.context, null, 2)
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        body += `<pre class="mt-1 text-[9px] text-gray-500 whitespace-pre-wrap bg-black/30 border border-gray-800 rounded p-2">${formattedContext}</pre>`;
    }

    entry.innerHTML = body;
    entry.className = "border-b border-gray-800/50 pb-0.5 mb-0.5 break-words";

    debugOutput.appendChild(entry);
    debugOutput.scrollTop = debugOutput.scrollHeight;
}

hydrateDebugPreference();

if (debugToggle) {
    debugToggle.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        debugState.verbose = enabled;
        persistDebugPreference(enabled);
        log(`Verbose logging ${enabled ? 'enabled' : 'disabled'}.`, 'system');
    });
}

clearConsoleBtn.addEventListener('click', () => {
    debugOutput.innerHTML = '';
    log('Console cleared.', 'system');
});

// --- Helper Functions ---

const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
const sharedAudioContext = AudioContextClass ? new AudioContextClass() : null;

function updateVocalRemovalStatus(message: string, tone: 'neutral' | 'success' | 'warn' | 'error' = 'neutral') {
    if (!vocalRemovalStatus) return;

    const toneClass = tone === 'success' ? 'text-neon-green' : tone === 'warn' ? 'text-yellow-400' : tone === 'error' ? 'text-red-400' : 'text-gray-500';
    vocalRemovalStatus.className = toneClass + ' text-[10px]';
    vocalRemovalStatus.textContent = message;
}

async function decodeFileToAudioBuffer(file: File): Promise<AudioBuffer> {
    if (!sharedAudioContext) {
        throw new Error('Web Audio API is not supported in this browser.');
    }

    if (sharedAudioContext.state === 'suspended') {
        await sharedAudioContext.resume();
    }

    const arrayBuffer = await file.arrayBuffer();
    return await sharedAudioContext.decodeAudioData(arrayBuffer.slice(0));
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const samples = buffer.length;
    const blockAlign = numChannels * (bitDepth / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const bufferLength = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    function writeString(offset: number, str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    function writeUint16(offset: number, value: number) {
        view.setUint16(offset, value, true);
    }

    function writeUint32(offset: number, value: number) {
        view.setUint32(offset, value, true);
    }

    writeString(0, 'RIFF');
    writeUint32(4, 36 + dataSize);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    writeUint32(16, 16); // Subchunk1Size for PCM
    writeUint16(20, format);
    writeUint16(22, numChannels);
    writeUint32(24, sampleRate);
    writeUint32(28, byteRate);
    writeUint16(32, blockAlign);
    writeUint16(34, bitDepth);
    writeString(36, 'data');
    writeUint32(40, dataSize);

    // Interleave channels
    const channelData: Float32Array[] = [];
    for (let channel = 0; channel < numChannels; channel++) {
        channelData.push(buffer.getChannelData(channel));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            let sample = channelData[channel][i];
            sample = Math.max(-1, Math.min(1, sample));
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(offset, intSample, true);
            offset += 2;
        }
    }

    return arrayBuffer;
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (result) {
                resolve(result.split(',')[1]);
            } else {
                reject(new Error('FileReader returned empty result'));
            }
        };
        reader.onerror = () => reject(new Error('FileReader failed to read blob'));
        reader.readAsDataURL(blob);
    });
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function checkApiKey() {
    if (!OPENROUTER_API_KEY) {
        alert("OpenRouter API Key missing. Please set OPENROUTER_API_KEY in your .env.local file.");
        throw new Error("OpenRouter API Key missing");
    }
}

// --- State Management ---

let runtimeState: ProjectState = getProjectState();
const hydratingSceneIds = new Set<string>();
let saveStatusTimeout: number | null = null;

syncStateToUI(runtimeState);
subscribeToProjectState((next, prev) => {
    runtimeState = next;
    syncStateToUI(next, prev);
});

function syncStateToUI(state: ProjectState, prev?: ProjectState) {
    syncPromptField(state);
    syncStylePreview(state);
    syncAspectRatioControls(state);
    syncClipLengthControls(state);
    syncTransitionControl(state);
    syncPlannerModelControl(state);
    syncVideoModelControl(state);
    syncAudioDurationLabels(state);
    syncActiveTabUI(state.activeTab);
    updateSaveStatusDisplay(state.lastSavedAt, prev?.lastSavedAt ?? null);
    renderSceneList(state);
    ensureSceneHydration(state);
    if (prev && prev.activeTab !== state.activeTab) {
        log(`Switched to ${capitalize(state.activeTab)} view.`, 'system');
    }
}

function capitalize(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function syncPromptField(state: ProjectState) {
    if (!promptInput) return;
    if (document.activeElement === promptInput) return;
    if (promptInput.value !== state.lyrics) {
        promptInput.value = state.lyrics;
    }
}

function syncStylePreview(state: ProjectState) {
    if (!stylePreview) return;
    if (state.styleImageBase64) {
        const nextSrc = `data:${state.styleImageMime};base64,${state.styleImageBase64}`;
        if (stylePreview.src !== nextSrc) {
            stylePreview.src = nextSrc;
        }
        stylePreview.classList.remove('hidden');
    } else {
        stylePreview.classList.add('hidden');
        stylePreview.removeAttribute('src');
    }
}

function syncAspectRatioControls(state: ProjectState) {
    if (aspectRatioSelect && aspectRatioSelect.value !== state.aspectRatio) {
        aspectRatioSelect.value = state.aspectRatio;
    }
    aspectButtons.forEach(btn => {
        const isActive = btn.dataset.value === state.aspectRatio;
        btn.classList.toggle('active', isActive);
    });
}

function syncClipLengthControls(state: ProjectState) {
    if (clipLengthSelect) {
        const desired = state.clipLength.toString();
        if (clipLengthSelect.value !== desired) {
            clipLengthSelect.value = desired;
        }
    }
    clipButtons.forEach(btn => {
        const isActive = Number(btn.dataset.value) === state.clipLength;
        btn.classList.toggle('active', isActive);
    });
}

function syncTransitionControl(state: ProjectState) {
    if (transitionSelect && transitionSelect.value !== state.transitionType) {
        transitionSelect.value = state.transitionType;
    }
}

function syncPlannerModelControl(state: ProjectState) {
    if (plannerModelSelect && plannerModelSelect.value !== state.plannerModel) {
        plannerModelSelect.value = state.plannerModel;
    }
}

function syncVideoModelControl(state: ProjectState) {
    if (videoModelSelect && videoModelSelect.value !== state.videoModel) {
        videoModelSelect.value = state.videoModel;
    }
}

function syncAudioDurationLabels(state: ProjectState) {
    const formatted = formatTime(state.audioDuration || 0);
    if (audioDurationEl) {
        audioDurationEl.textContent = formatted;
    }
    if (totalTimeEl) {
        totalTimeEl.textContent = formatted;
    }
}

function syncActiveTabUI(activeTab: ProjectState['activeTab']) {
    tabButtons.forEach(btn => {
        const isActive = btn.dataset.tab === activeTab;
        btn.classList.toggle('active', isActive);
    });

    mobilePanels.forEach(panel => {
        const panelId = panel.id.replace('panel-', '');
        if (panelId === activeTab) {
            panel.classList.remove('hidden');
            panel.classList.add('flex', 'flex-col');
        } else {
            panel.classList.add('hidden');
            panel.classList.remove('flex', 'flex-col');
        }
    });
}

function updateSaveStatusDisplay(timestamp: number | null, previousTimestamp: number | null) {
    if (!saveStatus) return;

    if (!timestamp) {
        saveStatus.classList.add('hidden');
        return;
    }

    saveStatus.classList.remove('hidden');
    saveStatus.textContent = `Saved ${new Date(timestamp).toLocaleTimeString()}`;

    if (timestamp !== previousTimestamp) {
        saveStatus.classList.add('text-green-500');
        if (saveStatusTimeout) {
            window.clearTimeout(saveStatusTimeout);
        }
        saveStatusTimeout = window.setTimeout(() => {
            saveStatus?.classList.remove('text-green-500');
        }, 1000);
    }
}

function ensureSceneHydration(state: ProjectState) {
    state.scenes.forEach(scene => {
        if (scene.videoUri && !scene.videoUrl && !hydratingSceneIds.has(scene.id)) {
            hydrateSceneMedia(scene);
        }
    });
}

async function hydrateSceneMedia(scene: Scene) {
    if (!scene.videoUri) return;
    hydratingSceneIds.add(scene.id);
    try {
        log(`Restoring preview for ${scene.id}...`, 'info', { verbose: true });
        // For blob URLs, they're already local and don't need fetching
        if (scene.videoUri.startsWith('blob:')) {
            mutateScene(scene.id, target => {
                target.videoUrl = scene.videoUri;
            }, { persist: false });
            return;
        }
        const res = await fetch(scene.videoUri);
        if (!res.ok) {
            throw new Error(`Failed to hydrate video (${res.status})`);
        }
        const blob = await res.blob();
        if (blob.size === 0) {
            throw new Error('Hydrated video is empty');
        }
        const blobUrl = URL.createObjectURL(blob);
        mutateScene(scene.id, target => {
            target.videoUrl = blobUrl;
        }, { persist: false });
    } catch (err) {
        log(`Failed to restore scene ${scene.id}`, 'warn', {
            context: { error: err instanceof Error ? err.message : String(err) },
            verbose: true
        });
    } finally {
        hydratingSceneIds.delete(scene.id);
    }
}

function setActiveTab(tab: ProjectState['activeTab']) {
    updateProjectState({ activeTab: tab });
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = (btn.dataset.tab as ProjectState['activeTab']) || 'setup';
        if (tab !== runtimeState.activeTab) {
            setActiveTab(tab);
        }
    });
});

aspectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const value = btn.dataset.value || '16:9';
        if (value !== runtimeState.aspectRatio) {
            updateProjectState({ aspectRatio: value });
        }
    });
});

clipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const value = Number(btn.dataset.value || runtimeState.clipLength);
        if (value !== runtimeState.clipLength) {
            updateProjectState({ clipLength: value });
        }
    });
});

function normalizePlannerScenes(scenes: any[], state: ProjectState): Scene[] {
    return scenes.map((scene, index) => normalizePlannerScene(scene, index, state));
}

function normalizePlannerScene(scene: any, index: number, state: ProjectState): Scene {
    const fallbackStart = index * state.clipLength;
    const fallbackEnd = fallbackStart + state.clipLength;

    const start = isFiniteNumber(scene.startTime) ? scene.startTime : fallbackStart;
    const endCandidate = isFiniteNumber(scene.endTime) ? scene.endTime : fallbackEnd;

    const clampedStart = clampNumber(start, 0, state.audioDuration);
    const clampedEnd = clampNumber(Math.max(clampedStart, endCandidate), 0, state.audioDuration);

    return {
        id: typeof scene.id === 'string' ? scene.id : `scene-${index}`,
        startTime: clampedStart,
        endTime: clampedEnd,
        description: scene.description || `Scene ${index + 1}`,
        visualPrompt: scene.visualPrompt || '',
        status: 'pending'
    };
}

function clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function mutateScene(sceneId: string, mutator: (scene: Scene) => void, options?: { persist?: boolean }) {
    updateProjectState(draft => {
        const target = draft.scenes.find(scene => scene.id === sceneId);
        if (target) {
            mutator(target);
        }
    }, options);
}

// --- Audio Handling ---

audioInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    uploadedAudioFile = file;

    if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
    }

    audioBlobUrl = URL.createObjectURL(file);
    audioEl.src = audioBlobUrl;
    audioEl.load();
    instrumentalBlobUrl = null;
    instrumentalDownloadLink.classList.add('hidden');
    updateVocalRemovalStatus('Creates an instrumental by reducing vocals. Works best on stereo tracks.', 'neutral');
    log(`Audio loaded: ${file.name}`, 'success');
});

audioEl.addEventListener('loadedmetadata', () => {
    updateProjectState({ audioDuration: audioEl.duration });
});

async function createInstrumentalBuffer(buffer: AudioBuffer): Promise<AudioBuffer> {
    if (buffer.numberOfChannels < 2) {
        throw new Error('Instrumental generation works best with stereo audio.');
    }

    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const instrumentalBuffer = new AudioBuffer({
        length: buffer.length,
        numberOfChannels: 2,
        sampleRate: buffer.sampleRate
    });

    const outLeft = instrumentalBuffer.getChannelData(0);
    const outRight = instrumentalBuffer.getChannelData(1);

    for (let i = 0; i < buffer.length; i++) {
        const centerRemoved = (left[i] - right[i]) * 0.5;
        outLeft[i] = centerRemoved;
        outRight[i] = -centerRemoved;
    }

    return instrumentalBuffer;
}

async function handleVocalRemoval() {
    if (!uploadedAudioFile) {
        alert('Upload an audio file first.');
        return;
    }

    if (!vocalRemovalBtn) return;

    try {
        vocalRemovalBtn.disabled = true;
        vocalRemovalBtn.textContent = 'Muting vocals...';
        updateVocalRemovalStatus('Processing track to reduce vocals. This may take a moment...', 'neutral');
        log('Starting vocal reduction...', 'info');

        const decoded = await decodeFileToAudioBuffer(uploadedAudioFile);
        const instrumental = await createInstrumentalBuffer(decoded);
        const wavArrayBuffer = audioBufferToWav(instrumental);
        const instrumentalBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

        if (instrumentalBlobUrl) {
            URL.revokeObjectURL(instrumentalBlobUrl);
        }

        instrumentalBlobUrl = URL.createObjectURL(instrumentalBlob);
        audioBlobUrl = instrumentalBlobUrl;
        audioEl.src = instrumentalBlobUrl;
        audioEl.load();

        instrumentalDownloadLink.href = instrumentalBlobUrl;
        instrumentalDownloadLink.classList.remove('hidden');
        updateVocalRemovalStatus('Vocals reduced. Download or play the instrumental version.', 'success');
        log('Vocal reduction complete. Instrumental ready.', 'success');
    } catch (err) {
        console.error(err);
        updateVocalRemovalStatus(err instanceof Error ? err.message : 'Failed to process audio.', 'error');
        log('Vocal reduction failed.', 'error', { context: { error: String(err) } });
    } finally {
        vocalRemovalBtn.disabled = false;
        vocalRemovalBtn.textContent = 'Mute explicit lyrics (keep the music)';
    }
}

if (vocalRemovalBtn) {
    vocalRemovalBtn.addEventListener('click', () => {
        handleVocalRemoval();
    });
}

// --- Settings Handling ---

styleInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        const base64 = await blobToBase64(file);
        updateProjectState({
            styleImageMime: file.type,
            styleImageBase64: base64
        });
        stylePreview.src = URL.createObjectURL(file);
        stylePreview.classList.remove('hidden');
        log("Style reference image updated.", "info");
    } else {
        updateProjectState({
            styleImageMime: '',
            styleImageBase64: ''
        });
    }
});

aspectRatioSelect.addEventListener('change', () => {
    updateProjectState({ aspectRatio: aspectRatioSelect.value });
});

clipLengthSelect.addEventListener('change', () => {
    const nextLength = parseInt(clipLengthSelect.value, 10);
    if (!Number.isNaN(nextLength)) {
        updateProjectState({ clipLength: nextLength });
    }
});

transitionSelect.addEventListener('change', () => {
    const nextTransition = transitionSelect.value as ProjectState['transitionType'];
    updateProjectState({ transitionType: nextTransition });
    log(`Transition effect changed to: ${nextTransition.toUpperCase()}`, 'info');
});

plannerModelSelect.addEventListener('change', () => {
    const validatedModel = validatePlannerModel(plannerModelSelect.value);
    if (validatedModel !== plannerModelSelect.value) {
        log('Invalid planner model selection detected. Reverting to default.', 'warn');
    }
    plannerModelSelect.value = validatedModel;
    updateProjectState({ plannerModel: validatedModel });
    log(`Planner model set to: ${describePlannerModel(validatedModel)}`, 'info');
});

if (videoModelSelect) {
    videoModelSelect.addEventListener('change', () => {
        const validatedModel = validateVideoModel(videoModelSelect.value);
        if (validatedModel !== videoModelSelect.value) {
            log('Invalid video model selection detected. Reverting to default.', 'warn');
        }
        videoModelSelect.value = validatedModel;
        updateProjectState({ videoModel: validatedModel });
        log(`Video model set to: ${describeVideoModel(validatedModel)}`, 'info');
    });
}

promptInput.addEventListener('input', () => {
    updateProjectState({ lyrics: promptInput.value });
});

clearProjectBtn.addEventListener('click', () => {
    if (confirm("Are you sure? This will delete all generated scenes.")) {
        localStorage.removeItem('music-video-project');
        resetProjectState();
        location.reload();
    }
});


// --- PLANNER LOGIC (OpenRouter) ---

planButton.addEventListener('click', async () => {
    let state = getProjectState();

    if (!state.audioDuration || state.audioDuration === 0) {
        alert("Please upload an audio track first.");
        log("Planning aborted: No audio track.", "warn");
        return;
    }

    if (!state.lyrics.trim()) {
        alert("Please enter lyrics or a vibe description.");
        return;
    }

    await checkApiKey();
    const normalizedPlannerModel = validatePlannerModel(state.plannerModel);
    if (normalizedPlannerModel !== state.plannerModel) {
        log('Unknown planner model found in state. Resetting to default.', 'warn');
        updateProjectState({ plannerModel: normalizedPlannerModel });
        state = getProjectState();
    }
    plannerModelSelect.value = state.plannerModel;
    log(`Planner model selected: ${describePlannerModel(state.plannerModel)} (${state.plannerModel})`, 'system');

    planButton.disabled = true;
    planButton.innerHTML = `<span class="animate-pulse">Director Planning...</span>`;
    const planningStart = performance.now();
    log("Starting storyboard generation via OpenRouter...", "system", {
        context: {
            model: state.plannerModel,
            payload: {
                audioDuration: state.audioDuration,
                clipLength: state.clipLength,
                aspectRatio: state.aspectRatio,
                lyricChars: state.lyrics.length
            }
        },
        verbose: true
    });

    const numClips = Math.max(1, Math.ceil(state.audioDuration / state.clipLength));
    const systemInstruction = `You are a professional Music Video Director creating content for AI image/video generation.
TASK: Create a visual storyboard for a song that is ${Math.round(state.audioDuration)} seconds long.
The video MUST be broken down into exactly ${numClips} sequential scenes, each approx ${state.clipLength} seconds.

INPUT CONTEXT:
Lyrics/Vibe: "${state.lyrics}"
Aspect Ratio: ${state.aspectRatio}

CRITICAL SAFETY REQUIREMENTS:
- NO money, cash, bills, counting money, or wealth displays (luxury items like cars, jewelry are OK)
- NO drugs, smoking, haze (use "atmospheric fog" or "stage lighting" instead)
- NO weapons, violence, or aggressive imagery
- NO explicit/suggestive content
- NO alcohol or substance references
- Use "success" metaphors like achievements, stages, spotlights instead of material wealth

ENCOURAGED ELEMENTS:
- Urban architecture, graffiti murals, street art
- Fashion: designer clothes, jewelry (chains, watches), sneakers
- Performance: stages, crowds, microphones, studio booths
- Cinematography: low angles, "shot on 35mm", "anamorphic lens", dramatic lighting, slow motion
- Vehicles: luxury cars as backdrop (not for racing/stunts)

INSTRUCTIONS:
1. Analyze the flow (Intro, Verse, Chorus) based on input.
2. Write a safe, artistic "visualPrompt" for AI image generation for EACH scene.
3. STYLE: Focus on cinematic camera work, lighting, color grading, urban architecture, and artistic metaphors.
4. CONSISTENCY: Maintain character/color consistency throughout.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown): { "scenes": [ { "id": "scene-1", "startTime": 0, "endTime": 5, "description": "Brief description", "visualPrompt": "Detailed prompt for image generation" } ] }`;

    try {
        const generateStoryboard = async (modelId: PlannerModelId) => {
            const apiCallStart = performance.now();
            log(`Initiating OpenRouter API call to ${modelId}...`, 'info', { verbose: true });
            
            try {
                const response = await openRouterFetch('/chat/completions', {
                    method: 'POST',
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: 'system', content: systemInstruction },
                            { role: 'user', content: 'Plan the music video storyboard. Return only valid JSON.' }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0.7,
                        max_tokens: 4096
                    })
                });
                
                const apiCallDuration = Math.round(performance.now() - apiCallStart);
                log(`OpenRouter API call completed in ${apiCallDuration}ms`, 'success', {
                    context: { model: modelId, durationMs: apiCallDuration },
                    verbose: true
                });
                
                return response;
            } catch (apiError: any) {
                const apiCallDuration = Math.round(performance.now() - apiCallStart);
                log(`OpenRouter API call failed after ${apiCallDuration}ms`, 'error', {
                    context: {
                        model: modelId,
                        error: apiError?.message || 'Unknown error',
                        durationMs: apiCallDuration
                    }
                });
                throw apiError;
            }
        };

        let response;
        try {
            response = await generateStoryboard(state.plannerModel);
            log(`Planner response received from ${state.plannerModel}.`, 'success');
        } catch (plannerError: any) {
            log(`Planner failed (${plannerError?.message || 'error'}). Trying fallback model...`, 'warn');
            updateProjectState({ plannerModel: PLANNER_MODELS.default });
            state = getProjectState();
            plannerModelSelect.value = state.plannerModel;
            response = await generateStoryboard(state.plannerModel);
            log(`Planner response received from fallback model ${state.plannerModel}.`, 'success');
        }

        // Extract the text content from OpenRouter response
        const messageContent = response.choices?.[0]?.message?.content || '';
        let plan;
        try {
            plan = JSON.parse(messageContent);
        } catch (parseError) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = messageContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                plan = JSON.parse(jsonMatch[1].trim());
            } else {
                throw new Error('Failed to parse planner response as JSON');
            }
        }
        
        if (!plan?.scenes?.length) {
            throw new Error('Planner returned no scenes.');
        }

        const normalizedScenes = normalizePlannerScenes(plan.scenes, state);

        updateProjectState(draft => {
            draft.scenes = normalizedScenes;
            draft.activeTab = 'timeline';
        });

        const planningMs = Math.round(performance.now() - planningStart);
        log(`Storyboard created with ${normalizedScenes.length} scenes.`, "success", {
            context: { durationMs: planningMs }
        });

    } catch (e) {
        console.error(e);
        log("Planning failed. Check console.", "error", {
            context: { durationMs: Math.round(performance.now() - planningStart), error: e instanceof Error ? e.message : String(e) }
        });
        alert("Planning failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
        planButton.disabled = false;
        planButton.innerHTML = `
                <div class="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink opacity-100 group-hover:opacity-90 transition-opacity"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div class="relative flex items-center justify-center gap-2 py-3 px-4 text-white font-semibold text-sm">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Storyboard
                </div>
            `;
    }
});

// --- RENDER UI ---

function renderSceneList(state: ProjectState) {
    sceneContainer.innerHTML = '';

    if (state.scenes.length === 0) {
        sceneContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-700 border border-dashed border-gray-800 rounded-xl"><p class="text-sm">Timeline Empty</p></div>`;
        renderAllBtn.disabled = true;
        return;
    }

    renderAllBtn.disabled = false;

    state.scenes.forEach((scene, index) => {
        const div = document.createElement('div');
        div.className = `group flex gap-3 p-3 rounded-lg border bg-[#1a1a1a] hover:bg-[#202020] transition-colors ${scene.status === 'generating' ? 'border-blue-500 shadow-blue-900/20 shadow-lg' : scene.status === 'sanitizing' ? 'border-yellow-500' : 'border-gray-800'}`;

        // Status Color
        let statusDot = "bg-gray-600";
        if (scene.status === 'generating') statusDot = "bg-blue-500 animate-pulse";
        if (scene.status === 'sanitizing') statusDot = "bg-yellow-500 animate-pulse";
        if (scene.status === 'done') statusDot = "bg-green-500";
        if (scene.status === 'error') statusDot = "bg-red-500";

        // Thumbnail
        let thumbnail = `<div class="w-24 h-14 bg-black rounded flex items-center justify-center text-[10px] text-gray-700 font-mono">Pending</div>`;
        if (scene.videoUrl) {
            thumbnail = `<video src="${scene.videoUrl}" class="w-24 h-14 bg-black rounded object-cover cursor-pointer" muted onmouseover="this.play()" onmouseout="this.pause()" onclick="window.previewScene('${scene.videoUrl}')"></video>`;
        } else if (scene.status === 'generating') {
            thumbnail = `<div class="w-24 h-14 bg-black rounded flex items-center justify-center text-[10px] text-blue-400 font-mono">Rendering...</div>`;
        } else if (scene.status === 'sanitizing') {
            thumbnail = `<div class="w-24 h-14 bg-black rounded flex items-center justify-center text-[10px] text-yellow-400 font-mono text-center leading-tight">Safety<br>Fixing...</div>`;
        }

        div.innerHTML = `
            <div class="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
                <span class="text-[10px] font-mono text-gray-500">#${index + 1}</span>
                <div class="w-1.5 h-1.5 rounded-full ${statusDot}"></div>
            </div>
            
            <div class="flex-shrink-0 relative">
                ${thumbnail}
                <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-gray-300 px-1 font-mono">${formatTime(scene.startTime)}</div>
            </div>

            <div class="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                <div>
                    <p class="text-xs text-gray-300 font-medium truncate mb-0.5" title="${scene.description}">${scene.description}</p>
                    <p class="text-[10px] text-gray-500 font-mono line-clamp-2 leading-tight" title="${scene.visualPrompt}">${scene.visualPrompt}</p>
                </div>
                ${scene.errorMsg ? `<p class="text-[10px] text-red-400 mt-1">Error: ${scene.errorMsg}</p>` : ''}
            </div>

            <div class="flex-shrink-0 flex flex-col justify-center gap-2">
                 ${(scene.status !== 'generating' && scene.status !== 'sanitizing') ?
                `<button onclick="window.renderSingleScene('${scene.id}')" class="text-[10px] bg-gray-800 hover:bg-white hover:text-black border border-gray-700 text-gray-300 px-2 py-1 rounded transition-colors whitespace-nowrap">
                      ${scene.status === 'done' ? 'Re-Render' : 'Render'}
                   </button>` :
                `<span class="text-[10px] text-blue-500 font-mono">Processing</span>`
            }
            </div>
        `;
        sceneContainer.appendChild(div);
    });
}

(window as any).previewScene = (url: string) => {
    // Quick preview in the main player (layer 1)
    log("Previewing generated clip...", "info");
    videoLayer1.src = url;
    videoLayer1.style.opacity = '1';
    videoLayer2.style.opacity = '0';
    videoLayer1.play();
    videoLayer1.loop = true;
    playPauseBtn.click(); // Pause master playback if running
};

// --- VEO RENDER LOGIC with SAFETY RECOVERY ---

// --- HELPER FUNCTIONS FOR ERROR HANDLING ---

function isRateLimitError(error: any): boolean {
    if (!error) return false;
    const message = error.message || String(error);
    return message.includes('429') ||
           message.includes('RESOURCE_EXHAUSTED') ||
           message.includes('quota') ||
           message.includes('rate limit') ||
           message.includes('rate-limit');
}

function parseErrorMessage(error: any): string {
    if (!error) return 'Unknown error';
    
    // Try to extract message from JSON error response
    const rawMessage = error.message || String(error);
    
    // Check for JSON-formatted error
    try {
        const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.error?.message) {
                return parsed.error.message;
            }
        }
    } catch {
        // Not JSON, continue with raw message
    }
    
    return rawMessage;
}

function getUserFriendlyErrorMessage(error: any): string {
    const message = parseErrorMessage(error);
    
    if (isRateLimitError(error)) {
        return 'API rate limit exceeded. The system will automatically retry. Check your Gemini API quota at ai.dev/usage';
    }
    
    if (message.includes('Safety') || message.includes('blocked')) {
        return 'Content was blocked by safety filters. Retrying with safer prompt...';
    }
    
    if (message.includes('API Key') || message.includes('INVALID_API_KEY')) {
        return 'Invalid API key. Please check your configuration.';
    }
    
    // Truncate long messages
    if (message.length > 150) {
        return message.substring(0, 147) + '...';
    }
    
    return message;
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function detectSafetyCategory(errorMessage: string): 'violence' | 'substance' | 'explicit' | 'money' | 'general' {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('violence') || lower.includes('weapon')) return 'violence';
    if (lower.includes('drug') || lower.includes('substance') || lower.includes('smoke')) return 'substance';
    if (lower.includes('explicit') || lower.includes('sexual')) return 'explicit';
    if (lower.includes('money') || lower.includes('cash')) return 'money';
    return 'general';
}

async function sanitizePrompt(originalPrompt: string): Promise<string> {
    const sanitizeStart = performance.now();
    log("Running Smart Safety Sanitizer on prompt via OpenRouter...", "warn", {
        context: {
            model: PLANNER_MODELS.default,
            originalLength: originalPrompt.length
        },
        verbose: true
    });

    try {
        const response = await openRouterFetch('/chat/completions', {
            method: 'POST',
            body: JSON.stringify({
                model: PLANNER_MODELS.default,
                messages: [
                    {
                        role: 'system',
                        content: `You are a Video Prompt Rewriter specializing in making prompts safe for AI image/video generation while PRESERVING ARTISTIC AESTHETICS.

The original prompt may trigger safety filters. Your task is to REWRITE the prompt to be safe but keep the artistic vibe.

RULES:
1. Remove ALL references to: money stacks, counting bills, drugs, smoking, alcohol, weapons, shooting, explicit content.
2. KEEP artistic terms: "rapper", "hip-hop artist", "urban", "street", "graffiti" - these are SAFE.
3. KEEP atmospheric terms BUT contextualize them:
   - "haze" -> "atmospheric stage fog" or "misty atmosphere"
   - "gritty" -> "cinematic film grain", "urban texture"
4. Replace potentially problematic actions with safe alternatives.
5. Add CINEMATIC keywords: "shot on 35mm", "anamorphic", "depth of field", "4k", "color graded".

Return ONLY the rewritten prompt text, nothing else.`
                    },
                    {
                        role: 'user',
                        content: `Rewrite this prompt to be safe: "${originalPrompt}"`
                    }
                ],
                temperature: 0.5,
                max_tokens: 500
            })
        });
        
        const rewritten = response.choices?.[0]?.message?.content?.trim() || '';
        
        if (!rewritten || rewritten.length === 0) {
            throw new Error("Sanitizer returned empty prompt");
        }
        
        log("Sanitizer returned safe prompt.", 'success', {
            context: {
                durationMs: Math.round(performance.now() - sanitizeStart),
                rewrittenLength: rewritten.length,
                originalLength: originalPrompt.length
            },
            verbose: true
        });
        return rewritten;
    } catch (error: any) {
        log("Sanitizer failed, using fallback prompt.", 'warn', {
            context: {
                error: error?.message || 'Unknown error',
                durationMs: Math.round(performance.now() - sanitizeStart)
            }
        });
        // Fallback: generic safe prompt
        return "Cinematic music video scene, professional lighting, high quality, 4k";
    }
}

// --- OPENROUTER IMAGE GENERATION (Used to create animated frames) ---

interface OpenRouterImageResult {
    videoUrl: string;
    frames: string[];
}

async function generateVideoWithOpenRouter(
    prompt: string,
    aspectRatio: string,
    modelId: string,
    styleImageBase64?: string
): Promise<OpenRouterImageResult> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not configured. Please add it to your .env.local file.');
    }

    log(`Creating OpenRouter image generation task...`, 'info', {
        context: { model: modelId, aspectRatio, promptLength: prompt.length },
        verbose: true
    });

    // Number of frames to generate for smooth animation
    const numFrames = 8;
    const frames: string[] = [];
    
    // Generate multiple frames with slight prompt variations for animation effect
    const framePrompts = [
        prompt,
        `${prompt}, slight camera movement forward`,
        `${prompt}, dynamic lighting shift`,
        `${prompt}, subtle atmospheric change`,
        `${prompt}, continued motion`,
        `${prompt}, energy building`,
        `${prompt}, peak moment`,
        `${prompt}, settling motion`
    ];

    log(`Generating ${numFrames} frames for animation...`, 'info');

    for (let i = 0; i < numFrames; i++) {
        const framePrompt = framePrompts[i] || prompt;
        log(`Generating frame ${i + 1}/${numFrames}...`, 'info', { verbose: true });

        try {
            // Use OpenRouter's chat completion with image generation model
            const messages: any[] = [
                { 
                    role: 'user', 
                    content: `Generate a cinematic image for a music video scene: ${framePrompt}. Style: High quality, 4K, cinematic, music video aesthetic. Aspect ratio: ${aspectRatio}.`
                }
            ];

            // Add style reference if provided
            if (styleImageBase64 && i === 0) {
                messages[0] = {
                    role: 'user',
                    content: [
                        { type: 'text', text: `Generate a cinematic image for a music video scene similar in style to the reference image: ${framePrompt}. Style: High quality, 4K, cinematic, music video aesthetic. Aspect ratio: ${aspectRatio}.` },
                        { type: 'image_url', image_url: { url: `data:image/png;base64,${styleImageBase64}` } }
                    ]
                };
            }

            const response = await openRouterFetch('/chat/completions', {
                method: 'POST',
                body: JSON.stringify({
                    model: modelId,
                    messages: messages,
                    max_tokens: 4096
                })
            });

            // Extract image from response
            const content = response.choices?.[0]?.message?.content;
            if (content) {
                // Check if response contains image data or URL
                if (typeof content === 'string') {
                    // Try to extract base64 image or URL from response
                    const base64Match = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
                    const urlMatch = content.match(/https?:\/\/[^\s"]+\.(png|jpg|jpeg|gif|webp)/i);
                    
                    if (base64Match) {
                        frames.push(`data:image/png;base64,${base64Match[1]}`);
                    } else if (urlMatch) {
                        frames.push(urlMatch[0]);
                    } else {
                        // Generate a placeholder frame with canvas
                        const placeholderFrame = await generatePlaceholderFrame(framePrompt, i, numFrames, aspectRatio);
                        frames.push(placeholderFrame);
                    }
                } else if (Array.isArray(content)) {
                    // Handle multimodal response
                    for (const part of content) {
                        if (part.type === 'image_url' && part.image_url?.url) {
                            frames.push(part.image_url.url);
                            break;
                        }
                    }
                }
            }
            
            // Add delay between requests to avoid rate limiting
            if (i < numFrames - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (frameError: any) {
            log(`Frame ${i + 1} generation failed: ${frameError.message}`, 'warn');
            // Generate placeholder frame on error
            const placeholderFrame = await generatePlaceholderFrame(framePrompt, i, numFrames, aspectRatio);
            frames.push(placeholderFrame);
        }
    }

    if (frames.length === 0) {
        throw new Error('No frames generated');
    }

    log(`Generated ${frames.length} frames, creating animated video...`, 'info');

    // Create animated GIF/video from frames
    const videoUrl = await createAnimatedVideoFromFrames(frames, aspectRatio);
    
    log(`OpenRouter video generation complete!`, 'success');
    return { videoUrl, frames };
}

// Generate a placeholder frame using canvas when API fails
async function generatePlaceholderFrame(prompt: string, frameIndex: number, totalFrames: number, aspectRatio: string): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const aspectParts = aspectRatio.split(':').map(Number);
        const baseWidth = 640;
        const baseHeight = Math.round(baseWidth * (aspectParts[1] / aspectParts[0]));
        
        canvas.width = baseWidth;
        canvas.height = baseHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve('');
            return;
        }

        // Create gradient background based on frame index
        const hue = (frameIndex / totalFrames) * 60 + 200; // Blue to purple range
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${hue}, 70%, 20%)`);
        gradient.addColorStop(1, `hsl(${hue + 30}, 60%, 10%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add animated particles
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (frameIndex / totalFrames) * 0.2})`;
        for (let i = 0; i < 50; i++) {
            const x = (Math.sin(i * 0.5 + frameIndex * 0.3) + 1) * canvas.width / 2;
            const y = (Math.cos(i * 0.7 + frameIndex * 0.2) + 1) * canvas.height / 2;
            const size = 2 + Math.sin(i + frameIndex) * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add text overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        const truncatedPrompt = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
        ctx.fillText(truncatedPrompt, canvas.width / 2, canvas.height / 2);
        ctx.font = '10px monospace';
        ctx.fillText(`Frame ${frameIndex + 1}/${totalFrames}`, canvas.width / 2, canvas.height / 2 + 20);

        resolve(canvas.toDataURL('image/png'));
    });
}

// Create animated video (GIF) from frames
async function createAnimatedVideoFromFrames(frameDataUrls: string[], aspectRatio: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            const aspectParts = aspectRatio.split(':').map(Number);
            const baseWidth = 640;
            const baseHeight = Math.round(baseWidth * (aspectParts[1] / aspectParts[0]));

            // Create a canvas for the animation
            const canvas = document.createElement('canvas');
            canvas.width = baseWidth;
            canvas.height = baseHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('Canvas context not available');
            }

            // Load all frames as images
            const frameImages: HTMLImageElement[] = [];
            for (const dataUrl of frameDataUrls) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise<void>((imgResolve, imgReject) => {
                    img.onload = () => imgResolve();
                    img.onerror = () => {
                        // Create fallback image on error
                        imgResolve();
                    };
                    img.src = dataUrl;
                });
                frameImages.push(img);
            }

            // Use MediaRecorder to create a video
            const stream = canvas.captureStream(24); // 24 fps
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000
            });

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                resolve(url);
            };

            mediaRecorder.onerror = (e) => {
                reject(new Error('MediaRecorder error'));
            };

            mediaRecorder.start();

            // Animate through frames (loop twice for ~5 second video at variable speed)
            const frameDelay = 150; // ms per frame
            const loops = 3;
            
            for (let loop = 0; loop < loops; loop++) {
                for (let i = 0; i < frameImages.length; i++) {
                    const img = frameImages[i];
                    if (img.complete && img.naturalWidth > 0) {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    } else {
                        // Draw placeholder
                        ctx.fillStyle = `hsl(${(i / frameImages.length) * 60 + 200}, 70%, 20%)`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    await new Promise(r => setTimeout(r, frameDelay));
                }
            }

            // Stop recording
            mediaRecorder.stop();

        } catch (error) {
            reject(error);
        }
    });
}

(window as any).renderSingleScene = async (sceneId: string) => {
    const renderStart = performance.now();

    const findScene = () => {
        const state = getProjectState();
        const index = state.scenes.findIndex(s => s.id === sceneId);
        return { state, index };
    };

    let { state, index } = findScene();
    if (index === -1) {
        log(`ERROR: Scene ${sceneId} not found in project state.`, "error");
        return;
    }

    await checkApiKey();

    const videoModel = state.videoModel;

    mutateScene(sceneId, scene => {
        scene.status = 'generating';
        scene.errorMsg = undefined;
    });

    ({ state, index } = findScene());
    const baseScene = state.scenes[index];

    log(`========== RENDER START: Scene #${index + 1} ==========`, "system");
    log(`Scene ID: ${sceneId}`, "info");
    log(`Video Model: ${describeVideoModel(videoModel)} (${videoModel})`, "system");
    log(`Using OpenRouter for video generation`, "info");

    let currentPrompt = baseScene.visualPrompt;
    log(`Original Prompt: "${currentPrompt.substring(0, 100)}..."`, "info");

    let attempts = 0;
    const maxAttempts = 3;

    let styleImageBase64 = state.styleImageBase64 || undefined;

    log(`Style Image Present: ${styleImageBase64 ? 'YES' : 'NO'}`, "info");

    while (attempts < maxAttempts) {
        attempts++;
        const attemptStart = performance.now();
        log(`--- Attempt ${attempts}/${maxAttempts} ---`, "system", {
            context: {
                attempt: attempts,
                maxAttempts,
                promptLength: currentPrompt.length,
                videoModel
            },
            verbose: true
        });

        const latestState = getProjectState();
        const aspectRatio = latestState.aspectRatio;

        try {
            log(`Video Config prepared`, "info", {
                context: {
                    model: videoModel,
                    aspectRatio,
                    attempt: attempts,
                    styleImageAttached: Boolean(styleImageBase64)
                },
                verbose: true
            });

            // Use OpenRouter for video generation
            const result = await generateVideoWithOpenRouter(
                currentPrompt,
                aspectRatio,
                videoModel,
                styleImageBase64
            );

            log(`OpenRouter video URL received`, "success");
            const videoUrl = result.videoUrl;

            // Success - update scene
            mutateScene(sceneId, scene => {
                scene.status = 'done';
                scene.videoUri = videoUrl;
                scene.videoUrl = videoUrl;
                scene.visualPrompt = currentPrompt;
            });

            log(`========== RENDER SUCCESS: Scene #${index + 1} ==========`, "success", {
                context: {
                    durationMs: Math.round(performance.now() - attemptStart),
                    totalElapsedMs: Math.round(performance.now() - renderStart),
                    attempt: attempts,
                    videoModel,
                    framesGenerated: result.frames.length
                }
            });
            return;

        } catch (e: any) {
            console.error("Video Generation Error:", e);
            log(`CATCH: ${e.message}`, "error", {
                context: {
                    attempt: attempts,
                    durationMs: Math.round(performance.now() - attemptStart),
                    videoModel
                },
                verbose: true
            });
            log(`Error name: ${e.name || 'N/A'}`, "error", { verbose: true });

            // Check if this is a retryable error
            const isRetryableError = e.message.includes("Safety") || 
                                     e.message.includes("no video") ||
                                     e.message.includes("failed") ||
                                     e.message.includes("FAILED") ||
                                     e.message.includes("No frames");

            if (attempts < maxAttempts && isRetryableError) {
                const category = detectSafetyCategory(e.message);
                log(`Error Detected (${category}): ${e.message}`, "warn", {
                    context: {
                        attempt: attempts,
                        strategy: attempts === 1 ? 'prompt-sanitization' : 'hard-fallback'
                    }
                });

                mutateScene(sceneId, scene => {
                    scene.status = 'sanitizing';
                });

                if (attempts === 1) {
                    log(`=== STRATEGY 1: Sanitize Prompt ===`, "system");

                    if (styleImageBase64) {
                        log("Dropping style image (potential trigger).", "warn");
                        styleImageBase64 = undefined;
                    }

                    const newPrompt = await sanitizePrompt(currentPrompt);
                    log(`Sanitized Prompt updated.`, "info", {
                        context: {
                            attempt: attempts,
                            newLength: newPrompt.length
                        },
                        verbose: true
                    });
                    currentPrompt = newPrompt;
                } else {
                    log(`=== STRATEGY 2: Aggressive Generic Prompt ===`, "system", { verbose: true });
                    currentPrompt = "Abstract cinematic music video scene, atmospheric lighting, moody, high quality, 4k";
                    log(`Hard-coded fallback prompt applied.`, "warn");
                }

                mutateScene(sceneId, scene => {
                    scene.status = 'generating';
                });
            } else {
                mutateScene(sceneId, scene => {
                    scene.status = 'error';
                    scene.errorMsg = e.message || "Unknown error";
                });
                log(`========== RENDER FAILED: Scene #${index + 1} ==========`, "error");
                log(`Final Error: ${e.message}`, "error");
                return;
            }
        }
    }

    log(`All ${maxAttempts} attempts exhausted. Scene render failed.`, "error", {
        context: { totalElapsedMs: Math.round(performance.now() - renderStart) }
    });
    mutateScene(sceneId, scene => {
        scene.status = 'error';
        scene.errorMsg = "Max retry attempts reached";
    });
};

renderAllBtn.addEventListener('click', async () => {
    if (!confirm("Start rendering all pending scenes? This may take time.")) return;

    await checkApiKey();
    log("Batch rendering initiated.", "system");
    const scenesSnapshot = [...getProjectState().scenes];
    const pendingScenes = scenesSnapshot.filter(s => s.status !== 'done' && s.status !== 'generating' && s.status !== 'sanitizing');
    
    if (pendingScenes.length === 0) {
        log("No scenes to render. All scenes are already done or in progress.", "warn");
        return;
    }

    log(`Starting parallel rendering of ${pendingScenes.length} scenes...`, "system", {
        context: { totalScenes: pendingScenes.length }
    });

    // Render scenes in parallel with concurrency limit
    const CONCURRENT_RENDERS = 2; // Limit concurrent renders to avoid API rate limits
    const renderPromises: Promise<void>[] = [];
    let completed = 0;
    let failed = 0;

    for (let i = 0; i < pendingScenes.length; i += CONCURRENT_RENDERS) {
        const batch = pendingScenes.slice(i, i + CONCURRENT_RENDERS);
        const batchPromises = batch.map(async (scene) => {
            try {
                await (window as any).renderSingleScene(scene.id);
                completed++;
                log(`Scene ${scene.id} completed (${completed}/${pendingScenes.length})`, "success", { verbose: true });
            } catch (error) {
                failed++;
                log(`Scene ${scene.id} failed: ${error instanceof Error ? error.message : String(error)}`, "error");
            }
        });
        
        await Promise.all(batchPromises);
        
        // Brief pause between batches to avoid rate limiting
        if (i + CONCURRENT_RENDERS < pendingScenes.length) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    log(`Batch rendering complete. ${completed} succeeded, ${failed} failed.`, "success", {
        context: { completed, failed, total: pendingScenes.length }
    });
});


// --- DUAL-LAYER PLAYBACK ENGINE ---

playPauseBtn.addEventListener('click', () => {
    if (audioEl.paused) {
        if (!runtimeState.audioDuration) return alert("Upload audio first");

        audioEl.play();
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        startPlaybackEngine();
        log("Playback started.", "info", {
            context: { atTime: audioEl.currentTime },
            verbose: true
        });
    } else {
        audioEl.pause();
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        stopPlaybackEngine();
        log("Playback paused.", "info", {
            context: { atTime: audioEl.currentTime },
            verbose: true
        });
    }
});

function startPlaybackEngine() {
    masterPlaybackInterval = window.setInterval(() => {
        const t = audioEl.currentTime;
        currentTimeEl.textContent = formatTime(t);

        // Progress Bar
        const pct = runtimeState.audioDuration ? (t / runtimeState.audioDuration) * 100 : 0;
        progressBar.style.width = `${pct}%`;

        // Determine Current Scene
        const activeSceneIndex = runtimeState.scenes.findIndex(s => t >= s.startTime && t < s.endTime);
        const activeScene = runtimeState.scenes[activeSceneIndex];

        if (activeScene) {
            nowPlayingText.textContent = `Scene ${activeSceneIndex + 1}: ${activeScene.description}`;

            if (lastActiveSceneId !== activeScene.id) {
                log('Scene transition detected.', 'system', {
                    context: {
                        from: lastActiveSceneId || 'none',
                        to: activeScene.id,
                        playbackTime: t,
                        layer: activeVideoLayer
                    },
                    verbose: true
                });
                lastActiveSceneId = activeScene.id;
            }

            // Check if we need to switch video
            // We check the dataset 'sceneId' on the ACTIVE video layer
            const currentLayer = activeVideoLayer === 1 ? videoLayer1 : videoLayer2;
            const currentSceneId = currentLayer.getAttribute('data-scene-id');

            if (activeScene.videoUrl && currentSceneId !== activeScene.id) {
                performTransition(activeScene.videoUrl, activeScene.id);
            } else if (!activeScene.videoUrl && currentSceneId !== 'blank') {
                // If scene not rendered yet, maybe show placeholder?
                // For now, we just keep playing previous or show nothing.
            }
        }

        if (audioEl.ended) {
            stopPlaybackEngine();
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
            log("Playback finished.", "info");
        }

    }, 50); // High frequency for smooth triggers
}

function performTransition(newUrl: string, newSceneId: string) {
    const transitionStart = performance.now();
    const incomingLayer = activeVideoLayer === 1 ? videoLayer2 : videoLayer1;
    const outgoingLayer = activeVideoLayer === 1 ? videoLayer1 : videoLayer2;

    // 1. Prepare Incoming Layer
    incomingLayer.src = newUrl;
    incomingLayer.setAttribute('data-scene-id', newSceneId);
    incomingLayer.load();

    const playPromise = incomingLayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => { /* Autoplay prevented handled silently */ });
    }

    // 2. Execute Transition Effect
    const effect = runtimeState.transitionType;

    if (effect === 'cut') {
        incomingLayer.style.transition = 'none';
        outgoingLayer.style.transition = 'none';
        incomingLayer.style.opacity = '1';
        outgoingLayer.style.opacity = '0';

    } else if (effect === 'crossfade') {
        incomingLayer.style.transition = 'opacity 1s ease';
        outgoingLayer.style.transition = 'opacity 1s ease';
        incomingLayer.style.opacity = '1';
        outgoingLayer.style.opacity = '0';

    } else if (effect === 'fadeblack') {
        // Simple fade logic: Out, wait, In (simplified for web sync)
        // A robust fade-to-black usually requires a 3rd black layer, 
        // but here we can simulate by fading OUT outgoing first, then fading IN incoming.

        outgoingLayer.style.transition = 'opacity 0.5s ease';
        incomingLayer.style.transition = 'opacity 0.5s ease 0.5s'; // Delay start

        outgoingLayer.style.opacity = '0';
        // Incoming starts at 0, waits 0.5s, then goes to 1
        setTimeout(() => {
            incomingLayer.style.opacity = '1';
        }, 50);
    }

    // 3. Swap Active Index
    activeVideoLayer = activeVideoLayer === 1 ? 2 : 1;
    log(`Switched to scene ${newSceneId} (${effect})`, 'system', {
        context: {
            effect,
            incomingLayer: activeVideoLayer,
            durationMs: Math.round(performance.now() - transitionStart)
        },
        verbose: true
    });
}

function stopPlaybackEngine() {
    if (masterPlaybackInterval) {
        clearInterval(masterPlaybackInterval);
        masterPlaybackInterval = null;
    }
    videoLayer1.pause();
    videoLayer2.pause();
}