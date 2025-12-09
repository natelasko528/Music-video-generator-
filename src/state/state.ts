// State Management

import type { ProjectState, Scene } from '../types';
import { log } from '../logging/logger';

export let projectState: ProjectState = {
    scenes: [],
    lyrics: '',
    clipLength: 5,
    aspectRatio: '16:9',
    styleImageBase64: '',
    styleImageMime: '',
    audioDuration: 0,
    transitionType: 'cut'
};

let audioBlobUrl: string | null = null;
let saveStatusElement: HTMLElement | null = null;

export function initState(saveStatusEl: HTMLElement) {
    saveStatusElement = saveStatusEl;
    loadState();
}

export function getAudioBlobUrl(): string | null {
    return audioBlobUrl;
}

export function setAudioBlobUrl(url: string | null) {
    audioBlobUrl = url;
}

export function loadState() {
    const saved = localStorage.getItem('music-video-project');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            projectState = { ...projectState, ...parsed };

            // VALIDATION: Ensure aspectRatio is valid (Veo 3.1 only supports 16:9 and 9:16)
            const validAspectRatios = ['16:9', '9:16'];
            if (!validAspectRatios.includes(projectState.aspectRatio)) {
                log(`Invalid aspect ratio "${projectState.aspectRatio}" found. Auto-correcting to 16:9.`, "warn");
                projectState.aspectRatio = '16:9';
            }

            log("Project state restored from local storage.", "system");
        } catch (e) {
            console.error("Failed to load state", e);
            log("Failed to load saved state.", "error");
        }
    }
}

export function saveState() {
    localStorage.setItem('music-video-project', JSON.stringify({
        ...projectState,
        scenes: projectState.scenes.map(s => ({ ...s, videoUrl: undefined })) // Don't save blob URLs
    }));

    if (saveStatusElement) {
        saveStatusElement.textContent = "Saved " + new Date().toLocaleTimeString();
        saveStatusElement.classList.add('text-green-500');
        setTimeout(() => saveStatusElement?.classList.remove('text-green-500'), 1000);
    }
}

export function updateScene(sceneId: string, updates: Partial<Scene>) {
    const index = projectState.scenes.findIndex(s => s.id === sceneId);
    if (index !== -1) {
        projectState.scenes[index] = { ...projectState.scenes[index], ...updates };
        saveState();
    }
}

export function getScene(sceneId: string): Scene | undefined {
    return projectState.scenes.find(s => s.id === sceneId);
}

export function clearProject() {
    if (confirm("Are you sure? This will delete all generated scenes.")) {
        localStorage.removeItem('music-video-project');
        location.reload();
    }
}

