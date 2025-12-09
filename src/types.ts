// Types & Interfaces

export interface Scene {
    id: string;
    startTime: number;
    endTime: number;
    description: string;
    visualPrompt: string; // The optimized prompt for Veo
    status: 'pending' | 'generating' | 'done' | 'error' | 'sanitizing';
    videoUri?: string;
    videoUrl?: string; // Blob URL
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
    transitionType: 'cut' | 'crossfade' | 'fadeblack';
}

export type LogType = 'info' | 'success' | 'warn' | 'error' | 'system';

export type SafetyCategory = 'violence' | 'substance' | 'explicit' | 'money' | 'general';

declare global {
    interface AIStudio {
        openSelectKey: () => Promise<void>;
        hasSelectedApiKey: () => Promise<boolean>;
    }
    interface Window {
        aistudio?: AIStudio;
        renderSingleScene?: (id: string) => Promise<void>;
        previewScene?: (url: string) => void;
    }
}

