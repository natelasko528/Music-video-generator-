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
    } catch(e) {
        console.error("Failed to load state", e);
        log("Failed to load saved state.", "error");
    }
  }
}

function saveState() {
  localStorage.setItem('music-video-project', JSON.stringify({
      ...projectState,
      scenes: projectState.scenes.map(s => ({...s, videoUrl: undefined})) // Don't save blob URLs
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
    if(confirm("Are you sure? This will delete all generated scenes.")) {
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
    - NO drugs, smoking, haze (use "atmospheric fog" or "stage lighting" instead)
    - NO weapons, violence, or aggressive imagery
    - NO explicit/suggestive content
    - NO alcohol or substance references
    - Use "musician" or "artist" instead of "rapper"
    - Use "success" metaphors like achievements, stages, spotlights instead of material wealth

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

async function sanitizePrompt(originalPrompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    log("Running Safety Sanitizer on prompt...", "warn");

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: `Original Prompt: "${originalPrompt}"` }] },
        config: {
            systemInstruction: `You are a Video Prompt Rewriter specializing in making prompts safe for AI video generation.

The original prompt was blocked by Veo's safety filter. Your task is to COMPLETELY REWRITE the prompt to be 100% safe while keeping the visual aesthetics.

RULES:
1. Remove ALL references to: money, cash, drugs, smoking, alcohol, weapons, violence, explicit content
2. Replace "rapper" with "musician" or "artist"
3. Replace "counting cash/money" with "working at desk" or "creating music"
4. Replace "smoking/haze" with "atmospheric fog" or "stage lighting"
5. Replace "club scene" with "concert venue" or "performance space"
6. Keep camera angles, lighting descriptions, and color grading
7. Focus on artistic, cinematic, professional music video aesthetics
8. Use neutral, professional language throughout

Return ONLY the rewritten prompt text, nothing else.`,
        }
    });
    return response.text;
}

(window as any).renderSingleScene = async (sceneId: string) => {
    await checkApiKey();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const sceneIndex = projectState.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    
    // Update State
    projectState.scenes[sceneIndex].status = 'generating';
    projectState.scenes[sceneIndex].errorMsg = undefined;
    renderSceneList();
    log(`Starting render for Scene #${sceneIndex + 1}...`, "info");
    
    let currentPrompt = projectState.scenes[sceneIndex].visualPrompt;
    let attempts = 0;
    const maxAttempts = 3; // Original + 2 Retries with progressive sanitization

    while (attempts < maxAttempts) {
        attempts++;
        
        try {
            const videoConfig: any = {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: projectState.aspectRatio
            };

            let veoOperation;
            
            // First scene gets style image reference if available
            if (sceneIndex === 0 && projectState.styleImageBase64) {
                 veoOperation = await ai.models.generateVideos({
                    model: 'veo-3.1-generate-preview',
                    prompt: currentPrompt,
                    image: {
                        imageBytes: projectState.styleImageBase64,
                        mimeType: projectState.styleImageMime
                    },
                    config: videoConfig
                });
            } else {
                 veoOperation = await ai.models.generateVideos({
                    model: 'veo-3.1-generate-preview',
                    prompt: currentPrompt,
                    config: videoConfig
                });
            }

            log(`Veo job started. Polling... (Attempt ${attempts})`, "info");

            // Poll
            while (!veoOperation.done) {
                await new Promise(r => setTimeout(r, 4000));
                veoOperation = await ai.operations.getVideosOperation({ operation: veoOperation });
            }

            // Check Result
            if (veoOperation.response?.generatedVideos?.[0]?.video?.uri) {
                const uri = veoOperation.response.generatedVideos[0].video.uri;
                log("Video generated successfully. Downloading...", "success");

                const res = await fetch(`${uri}&key=${process.env.API_KEY}`);
                if (!res.ok) {
                    throw new Error(`Failed to download video: ${res.status} ${res.statusText}`);
                }
                const blob = await res.blob();
                if (blob.size === 0) {
                    throw new Error("Downloaded video is empty");
                }
                const blobUrl = URL.createObjectURL(blob);
                
                projectState.scenes[sceneIndex].status = 'done';
                projectState.scenes[sceneIndex].videoUri = uri;
                projectState.scenes[sceneIndex].videoUrl = blobUrl;
                projectState.scenes[sceneIndex].visualPrompt = currentPrompt; // Save the potentially sanitized prompt
                
                saveState();
                renderSceneList();
                return; // Success, exit function
            } else {
                // If done but no video, assume safety block
                throw new Error("Veo returned no video (Possible Safety Block)");
            }

        } catch (e: any) {
            console.error(e);
            
            if (attempts < maxAttempts && (e.message.includes("Safety") || e.message.includes("no video"))) {
                log(`Veo blocked request: ${e.message}`, "warn");
                
                // Trigger Auto-Sanitize
                projectState.scenes[sceneIndex].status = 'sanitizing';
                renderSceneList();
                
                try {
                    const newPrompt = await sanitizePrompt(currentPrompt);
                    log(`Prompt rewritten: "${newPrompt.substring(0, 50)}..."`, "system");
                    currentPrompt = newPrompt;
                    projectState.scenes[sceneIndex].status = 'generating'; // Go back to generating state
                    renderSceneList();
                    // Loop continues to next attempt
                } catch (sanErr) {
                    log("Sanitization failed.", "error");
                    break;
                }
            } else {
                projectState.scenes[sceneIndex].status = 'error';
                projectState.scenes[sceneIndex].errorMsg = e.message || "Unknown error";
                renderSceneList();
                log(`Render failed: ${e.message}`, "error");
                return;
            }
        }
    }
};

renderAllBtn.addEventListener('click', async () => {
    if(!confirm("Start rendering all pending scenes? This may take time.")) return;
    
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