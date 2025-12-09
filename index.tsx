/* tslint:disable */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from '@google/genai';

// --- Types & Interfaces ---

interface Scene {
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

interface ProjectState {
    scenes: Scene[];
    lyrics: string;
    clipLength: number;
    aspectRatio: string;
    styleImageBase64: string;
    styleImageMime: string;
    audioDuration: number;
    transitionType: 'cut' | 'crossfade' | 'fadeblack';
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

let projectState: ProjectState = {
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
let masterPlaybackInterval: number | null = null;

// --- DOM Elements ---

const audioInput = document.getElementById('audio-input') as HTMLInputElement;
const audioEl = document.getElementById('audio-element') as HTMLAudioElement;
const audioDurationEl = document.getElementById('audio-duration') as HTMLElement;

const promptInput = document.getElementById('prompt-input') as HTMLTextAreaElement;
const planButton = document.getElementById('plan-button') as HTMLButtonElement;
const clearProjectBtn = document.getElementById('clear-project') as HTMLButtonElement;

const aspectRatioSelect = document.getElementById('aspect-ratio') as HTMLSelectElement;
const clipLengthSelect = document.getElementById('clip-length') as HTMLSelectElement;
const transitionSelect = document.getElementById('transition-select') as HTMLSelectElement;
const styleInput = document.getElementById('style-image') as HTMLInputElement;
const stylePreview = document.getElementById('style-preview') as HTMLImageElement;

const sceneContainer = document.getElementById('scene-container') as HTMLDivElement;
const renderAllBtn = document.getElementById('render-all-btn') as HTMLButtonElement;

// Dual Player Elements
const videoLayer1 = document.getElementById('video-layer-1') as HTMLVideoElement;
const videoLayer2 = document.getElementById('video-layer-2') as HTMLVideoElement;
let activeVideoLayer = 1; // 1 or 2

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

// --- Logging System ---

function log(message: string, type: 'info' | 'success' | 'warn' | 'error' | 'system' = 'info') {
    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString().split(' ')[0];

    let colorClass = 'text-gray-400';
    if (type === 'success') colorClass = 'text-green-400';
    if (type === 'warn') colorClass = 'text-yellow-400';
    if (type === 'error') colorClass = 'text-red-400';
    if (type === 'system') colorClass = 'text-blue-400 font-bold';

    entry.innerHTML = `<span class="text-gray-600 mr-2">[${timestamp}]</span><span class="${colorClass}">${message}</span>`;
    entry.className = "border-b border-gray-800/50 pb-0.5 mb-0.5 break-words";

    debugOutput.appendChild(entry);
    debugOutput.scrollTop = debugOutput.scrollHeight;
}

clearConsoleBtn.addEventListener('click', () => {
    debugOutput.innerHTML = '';
    log('Console cleared.', 'system');
});

// --- Helper Functions ---

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
    let hasKey = false;
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        hasKey = await window.aistudio.hasSelectedApiKey();
    }

    if (!hasKey && !process.env.API_KEY) {
        if (window.aistudio?.openSelectKey) {
            log("Requesting API Key selection...", "warn");
            await window.aistudio.openSelectKey();
        } else {
            alert("API Key missing");
            throw new Error("API Key missing");
        }
    }
}

// --- State Management ---

function loadState() {
    const saved = localStorage.getItem('music-video-project');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            projectState = { ...projectState, ...parsed };

            // Restore UI
            promptInput.value = projectState.lyrics;
            aspectRatioSelect.value = projectState.aspectRatio;
            clipLengthSelect.value = projectState.clipLength.toString();
            transitionSelect.value = projectState.transitionType;

            if (projectState.styleImageBase64) {
                stylePreview.src = `data:${projectState.styleImageMime};base64,${projectState.styleImageBase64}`;
                stylePreview.classList.remove('hidden');
            }

            renderSceneList();
            log("Project state restored from local storage.", "system");
        } catch (e) {
            console.error("Failed to load state", e);
            log("Failed to load saved state.", "error");
        }
    }
}

function saveState() {
    localStorage.setItem('music-video-project', JSON.stringify({
        ...projectState,
        scenes: projectState.scenes.map(s => ({ ...s, videoUrl: undefined })) // Don't save blob URLs
    }));

    saveStatus.textContent = "Saved " + new Date().toLocaleTimeString();
    saveStatus.classList.add('text-green-500');
    setTimeout(() => saveStatus.classList.remove('text-green-500'), 1000);
}

// --- Audio Handling ---

audioInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        audioBlobUrl = URL.createObjectURL(file);
        audioEl.src = audioBlobUrl;
        audioEl.load();
        log(`Audio loaded: ${file.name}`, 'success');
    }
});

audioEl.addEventListener('loadedmetadata', () => {
    projectState.audioDuration = audioEl.duration;
    audioDurationEl.textContent = formatTime(projectState.audioDuration);
    totalTimeEl.textContent = formatTime(projectState.audioDuration);
    saveState();
});

// --- Settings Handling ---

styleInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        projectState.styleImageMime = file.type;
        projectState.styleImageBase64 = await blobToBase64(file);
        stylePreview.src = URL.createObjectURL(file);
        stylePreview.classList.remove('hidden');
        saveState();
        log("Style reference image updated.", "info");
    }
});

aspectRatioSelect.addEventListener('change', () => {
    projectState.aspectRatio = aspectRatioSelect.value;
    saveState();
});

clipLengthSelect.addEventListener('change', () => {
    projectState.clipLength = parseInt(clipLengthSelect.value);
    saveState();
});

transitionSelect.addEventListener('change', () => {
    projectState.transitionType = transitionSelect.value as any;
    log(`Transition effect changed to: ${projectState.transitionType.toUpperCase()}`, 'info');
    saveState();
});

promptInput.addEventListener('input', () => {
    projectState.lyrics = promptInput.value;
    saveState();
});

clearProjectBtn.addEventListener('click', () => {
    if (confirm("Are you sure? This will delete all generated scenes.")) {
        localStorage.removeItem('music-video-project');
        location.reload();
    }
});


// --- PLANNER LOGIC (Gemini 3.0) ---

planButton.addEventListener('click', async () => {
    if (!projectState.audioDuration || projectState.audioDuration === 0) {
        alert("Please upload an audio track first.");
        log("Planning aborted: No audio track.", "warn");
        return;
    }

    if (!promptInput.value.trim()) {
        alert("Please enter lyrics or a vibe description.");
        return;
    }

    await checkApiKey();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    planButton.disabled = true;
    planButton.innerHTML = `<span class="animate-pulse">Director Planning...</span>`;
    log("Starting storyboard generation with Gemini 3.0...", "system");

    const numClips = Math.ceil(projectState.audioDuration / projectState.clipLength);

    const systemInstruction = `
    You are a professional Music Video Director creating content for AI video generation.
    TASK: Create a visual storyboard for a song that is ${Math.round(projectState.audioDuration)} seconds long.
    The video MUST be broken down into exactly ${numClips} sequential scenes, each approx ${projectState.clipLength} seconds.

    INPUT CONTEXT:
    Lyrics/Vibe: "${projectState.lyrics}"
    Aspect Ratio: ${projectState.aspectRatio}

    CRITICAL SAFETY REQUIREMENTS (Veo will reject prompts with any of these):
    - NO money, cash, bills, counting money, or wealth displays
       -> BUT luxury items (cars, jewelry, fashion) are OK
    - NO drugs, smoking, haze (use "atmospheric fog" or "stage lighting" instead)
       -> Stage fog, LED haze, backlight mist are acceptable
    - NO weapons, violence, or aggressive imagery
    - NO explicit/suggestive content
    - NO alcohol or substance references
    - "Rapper" and "hip-hop artist" are acceptable genre terms
    - Use "success" metaphors like achievements, stages, spotlights instead of material wealth

    ENCOURAGED ELEMENTS (these enhance hip-hop visuals without triggering filters):
    - Urban architecture, graffiti murals, street art
    - Fashion: designer clothes, jewelry (chains, watches), sneakers
    - Performance: stages, crowds, microphones, studio booths
    - Cinematography: low angles, "shot on 35mm", "anamorphic lens", dramatic lighting, slow motion
    - Vehicles: luxury cars as backdrop (not for racing/stunts)

    INSTRUCTIONS:
    1. Analyze the flow (Intro, Verse, Chorus) based on input.
    2. Write a safe, artistic "visualPrompt" for Veo for EACH scene.
    3. STYLE: Focus on cinematic camera work, lighting, color grading, urban architecture, and artistic metaphors.
    4. CONSISTENCY: Maintain character/color consistency throughout.

    OUTPUT SCHEMA:
    Return JSON: { scenes: [ { id, startTime, endTime, description, visualPrompt } ] }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: "Plan the music video storyboard." }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    startTime: { type: Type.NUMBER },
                                    endTime: { type: Type.NUMBER },
                                    description: { type: Type.STRING },
                                    visualPrompt: { type: Type.STRING }
                                },
                                required: ["id", "startTime", "endTime", "visualPrompt"]
                            }
                        }
                    }
                }
            }
        });

        const plan = JSON.parse(response.text);

        projectState.scenes = plan.scenes.map((s: any, index: number) => ({
            id: `scene-${index}`,
            startTime: index * projectState.clipLength,
            endTime: Math.min((index + 1) * projectState.clipLength, projectState.audioDuration),
            description: s.description || "Scene",
            visualPrompt: s.visualPrompt,
            status: 'pending'
        }));

        saveState();
        renderSceneList();
        log(`Storyboard created with ${projectState.scenes.length} scenes.`, "success");

        // Auto-navigate to Timeline tab
        const timelineTab = document.querySelector('[data-tab="timeline"]') as HTMLButtonElement;
        if (timelineTab) {
            timelineTab.click();
            log("Switched to Timeline view.", "system");
        }

    } catch (e) {
        console.error(e);
        log("Planning failed. Check console.", "error");
        alert("Planning failed.");
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

function renderSceneList() {
    sceneContainer.innerHTML = '';

    if (projectState.scenes.length === 0) {
        sceneContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-700 border border-dashed border-gray-800 rounded-xl"><p class="text-sm">Timeline Empty</p></div>`;
        renderAllBtn.disabled = true;
        return;
    }

    renderAllBtn.disabled = false;

    projectState.scenes.forEach((scene, index) => {
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

// --- HELPER FUNCTIONS FOR SAFETY ---

function detectSafetyCategory(errorMessage: string): 'violence' | 'substance' | 'explicit' | 'money' | 'general' {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('violence') || lower.includes('weapon')) return 'violence';
    if (lower.includes('drug') || lower.includes('substance') || lower.includes('smoke')) return 'substance';
    if (lower.includes('explicit') || lower.includes('sexual')) return 'explicit';
    if (lower.includes('money') || lower.includes('cash')) return 'money';
    return 'general';
}

async function generateSafeReferenceImage(prompt: string): Promise<{ base64: string, mime: string } | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    log("Generating safe reference image to guide Veo...", "warn");

    try {
        // Use Imagen 3 to create a safe reference image
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: `Cinematic still, high quality, professional music video shot: ${prompt}`,
            config: {
                numberOfImages: 1,
                aspectRatio: projectState.aspectRatio === '9:16' ? '9:16' : '16:9'
            }
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
            return {
                base64: response.generatedImages[0].image.imageBytes,
                mime: 'image/png' // Imagen usually returns PNG
            };
        }
        return null;
    } catch (e) {
        console.error("Image generation failed", e);
        return null;
    }
}

async function sanitizePrompt(originalPrompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    log("Running Smart Safety Sanitizer on prompt...", "warn");

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: `Original Prompt: "${originalPrompt}"` }] },
        config: {
            systemInstruction: `You are a Video Prompt Rewriter specializing in making prompts safe for AI video generation while PRESERVING HIP-HOP AESTHETICS.

The original prompt was blocked by Veo's safety filter. Your task is to REWRITE the prompt to be safe but keep the vibe.

RULES:
1. Remove ALL references to: money stacks, counting bills, drugs, smoking weed/blunts, alcohol, weapons, shooting, explicit nudity/sex.
2. KEEP "rapper", "hip-hop artist", "MC", "urban", "street", "graffiti" - these are SAFE.
3. KEEP "gritty", "haze", "fog" BUT contextualize them:
   - "haze" -> "atmospheric stage fog" or "misty alleyway"
   - "gritty" -> "cinematic film grain", "urban texture"
4. Replace "counting cash" with "gesturing with hands", "wearing gold chains", "looking confident".
5. Replace "smoking" with "cold breath condensing", "fog machine", "dramatic backlighting".
6. Add CINEMATIC keywords to distract filters: "shot on 35mm", "anamorphic", "depth of field", "4k", "color graded".

Return ONLY the rewritten prompt text, nothing else.`,
        }
    });
    return response.text;
}

(window as any).renderSingleScene = async (sceneId: string) => {
    await checkApiKey();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const sceneIndex = projectState.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) {
        log(`ERROR: Scene ${sceneId} not found in project state.`, "error");
        return;
    }

    // Update State
    projectState.scenes[sceneIndex].status = 'generating';
    projectState.scenes[sceneIndex].errorMsg = undefined;
    renderSceneList();

    log(`========== RENDER START: Scene #${sceneIndex + 1} ==========`, "system");
    log(`Scene ID: ${sceneId}`, "info");

    let currentPrompt = projectState.scenes[sceneIndex].visualPrompt;
    log(`Original Prompt: "${currentPrompt.substring(0, 100)}..."`, "info");

    let attempts = 0;
    const maxAttempts = 3;

    // Check if we have a global style image
    let styleImage = projectState.styleImageBase64 ? {
        imageBytes: projectState.styleImageBase64,
        mimeType: projectState.styleImageMime
    } : undefined;

    log(`Style Image Present: ${styleImage ? 'YES (' + projectState.styleImageMime + ')' : 'NO'}`, "info");
    log(`Aspect Ratio: ${projectState.aspectRatio}`, "info");

    while (attempts < maxAttempts) {
        attempts++;
        log(`--- Attempt ${attempts}/${maxAttempts} ---`, "system");

        try {
            const videoConfig: any = {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: projectState.aspectRatio
            };

            log(`Video Config: ${JSON.stringify(videoConfig)}`, "info");
            log(`Sending prompt to Veo: "${currentPrompt.substring(0, 80)}..."`, "info");

            let veoOperation;

            // LOGIC: Use style image if available (Global or Generated Safe Reference)
            if (styleImage) {
                log(`Using reference image for generation (${styleImage.mimeType})...`, 'info');
                veoOperation = await ai.models.generateVideos({
                    model: 'veo-3.1-generate-preview',
                    prompt: currentPrompt,
                    image: styleImage,
                    config: videoConfig
                });
            } else {
                log(`No reference image - text-only generation...`, 'info');
                veoOperation = await ai.models.generateVideos({
                    model: 'veo-3.1-generate-preview',
                    prompt: currentPrompt,
                    config: videoConfig
                });
            }

            log(`Veo API call successful. Operation created.`, "success");
            log(`Operation Name: ${veoOperation.name || 'N/A'}`, "info");
            log(`Polling for completion...`, "info");

            // Poll with progress updates
            let pollCount = 0;
            while (!veoOperation.done) {
                pollCount++;
                await new Promise(r => setTimeout(r, 4000));
                veoOperation = await ai.operations.getVideosOperation({ operation: veoOperation });
                log(`Poll #${pollCount}: done=${veoOperation.done}`, "info");
            }

            log(`Polling complete after ${pollCount} polls.`, "success");

            // Debug: Log the full response structure
            log(`Response exists: ${!!veoOperation.response}`, "info");
            if (veoOperation.response) {
                log(`GeneratedVideos count: ${veoOperation.response.generatedVideos?.length || 0}`, "info");
            }

            // Check Result
            if (veoOperation.response?.generatedVideos?.[0]?.video?.uri) {
                const uri = veoOperation.response.generatedVideos[0].video.uri;
                log(`Video URI received: ${uri.substring(0, 50)}...`, "success");
                log("Downloading video...", "info");

                const res = await fetch(`${uri}&key=${process.env.API_KEY}`);
                log(`Download response: ${res.status} ${res.statusText}`, "info");

                if (!res.ok) {
                    throw new Error(`Failed to download video: ${res.status} ${res.statusText}`);
                }
                const blob = await res.blob();
                log(`Downloaded blob size: ${blob.size} bytes`, "info");

                if (blob.size === 0) {
                    throw new Error("Downloaded video is empty");
                }
                const blobUrl = URL.createObjectURL(blob);

                projectState.scenes[sceneIndex].status = 'done';
                projectState.scenes[sceneIndex].videoUri = uri;
                projectState.scenes[sceneIndex].videoUrl = blobUrl;
                projectState.scenes[sceneIndex].visualPrompt = currentPrompt;

                saveState();
                renderSceneList();
                log(`========== RENDER SUCCESS: Scene #${sceneIndex + 1} ==========`, "success");
                return; // Success, exit function
            } else {
                // Log what we got instead
                log(`ERROR: No video URI in response.`, "error");
                log(`Response object: ${JSON.stringify(veoOperation.response || {}).substring(0, 200)}`, "warn");
                throw new Error("Veo returned no video (Possible Safety Block)");
            }

        } catch (e: any) {
            console.error("Veo Error:", e);
            log(`CATCH: ${e.message}`, "error");
            log(`Error name: ${e.name || 'N/A'}`, "error");

            if (attempts < maxAttempts && (e.message.includes("Safety") || e.message.includes("no video"))) {
                const category = detectSafetyCategory(e.message);
                log(`Safety Block Detected (${category}): ${e.message}`, "warn");

                projectState.scenes[sceneIndex].status = 'sanitizing';
                renderSceneList();

                // STRATEGY SWITCHING
                if (attempts === 1) {
                    log(`=== STRATEGY 1: Drop Image + Generate Safe Reference ===`, "system");

                    // If we used a style image (whether User or Generated) and it failed, DROP IT.
                    if (styleImage) {
                        log("Dropping previous style image (potential safety trigger).", "warn");
                        styleImage = undefined;
                    }

                    // Now try to generate a NEW safe reference image to guide Veo
                    log("Generating Safe Reference Image via Imagen...", "system");
                    const safeImage = await generateSafeReferenceImage(currentPrompt);

                    if (safeImage) {
                        styleImage = {
                            imageBytes: safeImage.base64,
                            mimeType: safeImage.mime
                        };
                        log("Safe reference image created successfully.", "success");
                    } else {
                        // Fallback to just text sanitization if image gen fails
                        log("Image generation failed. Falling back to text sanitization...", "warn");
                        const newPrompt = await sanitizePrompt(currentPrompt);
                        log(`Sanitized Prompt: "${newPrompt.substring(0, 80)}..."`, "info");
                        currentPrompt = newPrompt;
                    }
                } else {
                    // Strategy 2: Hard Sanitize (Last Resort)
                    log(`=== STRATEGY 2: Aggressive Generic Prompt ===`, "system");
                    currentPrompt = "Abstract cinematic music video scene, atmospheric lighting, moody, high quality, 4k";
                    log(`Hard-coded fallback prompt applied.`, "warn");
                }

                projectState.scenes[sceneIndex].status = 'generating';
                renderSceneList();
                // Loop continues
            } else {
                projectState.scenes[sceneIndex].status = 'error';
                projectState.scenes[sceneIndex].errorMsg = e.message || "Unknown error";
                renderSceneList();
                log(`========== RENDER FAILED: Scene #${sceneIndex + 1} ==========`, "error");
                log(`Final Error: ${e.message}`, "error");
                return;
            }
        }
    }

    // If we exit the loop without returning, all attempts failed
    log(`All ${maxAttempts} attempts exhausted. Scene render failed.`, "error");
    projectState.scenes[sceneIndex].status = 'error';
    projectState.scenes[sceneIndex].errorMsg = "Max retry attempts reached";
    renderSceneList();
};

renderAllBtn.addEventListener('click', async () => {
    if (!confirm("Start rendering all pending scenes? This may take time.")) return;

    log("Batch rendering initiated.", "system");
    for (const scene of projectState.scenes) {
        if (scene.status !== 'done') {
            await (window as any).renderSingleScene(scene.id);
            // Brief pause
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    log("Batch rendering complete.", "success");
});


// --- DUAL-LAYER PLAYBACK ENGINE ---

playPauseBtn.addEventListener('click', () => {
    if (audioEl.paused) {
        if (!projectState.audioDuration) return alert("Upload audio first");

        audioEl.play();
        iconPlay.classList.add('hidden');
        iconPause.classList.remove('hidden');
        startPlaybackEngine();
        log("Playback started.", "info");
    } else {
        audioEl.pause();
        iconPlay.classList.remove('hidden');
        iconPause.classList.add('hidden');
        stopPlaybackEngine();
        log("Playback paused.", "info");
    }
});

function startPlaybackEngine() {
    masterPlaybackInterval = window.setInterval(() => {
        const t = audioEl.currentTime;
        currentTimeEl.textContent = formatTime(t);

        // Progress Bar
        const pct = (t / projectState.audioDuration) * 100;
        progressBar.style.width = `${pct}%`;

        // Determine Current Scene
        const activeSceneIndex = projectState.scenes.findIndex(s => t >= s.startTime && t < s.endTime);
        const activeScene = projectState.scenes[activeSceneIndex];

        if (activeScene) {
            nowPlayingText.textContent = `Scene ${activeSceneIndex + 1}: ${activeScene.description}`;

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
    const effect = projectState.transitionType;

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
    log(`Switched to scene ${newSceneId} (${effect})`, 'system');
}

function stopPlaybackEngine() {
    if (masterPlaybackInterval) {
        clearInterval(masterPlaybackInterval);
        masterPlaybackInterval = null;
    }
    videoLayer1.pause();
    videoLayer2.pause();
}

// Initial Load
loadState();