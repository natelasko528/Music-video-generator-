// DOM Elements - Centralized element references

export interface UIElements {
    // Audio
    audioInput: HTMLInputElement;
    audioEl: HTMLAudioElement;
    audioDurationEl: HTMLElement;
    
    // Inputs
    promptInput: HTMLTextAreaElement;
    planButton: HTMLButtonElement;
    clearProjectBtn: HTMLButtonElement;
    
    // Settings
    aspectRatioSelect: HTMLSelectElement;
    clipLengthSelect: HTMLSelectElement;
    transitionSelect: HTMLSelectElement;
    styleInput: HTMLInputElement;
    stylePreview: HTMLImageElement;
    
    // Timeline
    sceneContainer: HTMLDivElement;
    renderAllBtn: HTMLButtonElement;
    
    // Playback
    videoLayer1: HTMLVideoElement;
    videoLayer2: HTMLVideoElement;
    playPauseBtn: HTMLButtonElement;
    iconPlay: HTMLElement;
    iconPause: HTMLElement;
    currentTimeEl: HTMLElement;
    totalTimeEl: HTMLElement;
    progressBar: HTMLElement;
    nowPlayingText: HTMLElement;
    
    // Status
    saveStatus: HTMLElement;
    debugOutput: HTMLDivElement;
    clearConsoleBtn: HTMLButtonElement;
}

export function getElements(): UIElements {
    return {
        audioInput: document.getElementById('audio-input') as HTMLInputElement,
        audioEl: document.getElementById('audio-element') as HTMLAudioElement,
        audioDurationEl: document.getElementById('audio-duration') as HTMLElement,
        promptInput: document.getElementById('prompt-input') as HTMLTextAreaElement,
        planButton: document.getElementById('plan-button') as HTMLButtonElement,
        clearProjectBtn: document.getElementById('clear-project') as HTMLButtonElement,
        aspectRatioSelect: document.getElementById('aspect-ratio') as HTMLSelectElement,
        clipLengthSelect: document.getElementById('clip-length') as HTMLSelectElement,
        transitionSelect: document.getElementById('transition-select') as HTMLSelectElement,
        styleInput: document.getElementById('style-image') as HTMLInputElement,
        stylePreview: document.getElementById('style-preview') as HTMLImageElement,
        sceneContainer: document.getElementById('scene-container') as HTMLDivElement,
        renderAllBtn: document.getElementById('render-all-btn') as HTMLButtonElement,
        videoLayer1: document.getElementById('video-layer-1') as HTMLVideoElement,
        videoLayer2: document.getElementById('video-layer-2') as HTMLVideoElement,
        playPauseBtn: document.getElementById('play-pause-master') as HTMLButtonElement,
        iconPlay: document.getElementById('icon-play') as HTMLElement,
        iconPause: document.getElementById('icon-pause') as HTMLElement,
        currentTimeEl: document.getElementById('current-time') as HTMLElement,
        totalTimeEl: document.getElementById('total-time') as HTMLElement,
        progressBar: document.getElementById('progress-bar') as HTMLElement,
        nowPlayingText: document.getElementById('now-playing-text') as HTMLElement,
        saveStatus: document.getElementById('save-status') as HTMLElement,
        debugOutput: document.getElementById('debug-output') as HTMLDivElement,
        clearConsoleBtn: document.getElementById('clear-console') as HTMLButtonElement,
    };
}

