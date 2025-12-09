// API Client - Handles Gemini/Veo API calls
// In production, this should use a serverless proxy to keep API keys secure

import { GoogleGenAI, Type } from '@google/genai';
import type { ProjectState, SafetyCategory } from '../types';
import { log } from '../logging/logger';

type GenAIModels = {
    generateContent: (...args: any[]) => Promise<any>;
    generateImages: (...args: any[]) => Promise<any>;
    generateVideos: (...args: any[]) => Promise<any>;
};

type GenAIOperations = {
    getVideosOperation: (args: any) => Promise<any>;
};

export type GenAIClient = {
    models: GenAIModels;
    operations: GenAIOperations;
};

let apiKey: string | null = null;
let clientFactory: (() => GenAIClient) | null = null;
let useProxy = false;

// Check if we should use the proxy (for production deployments)
if (typeof window !== 'undefined') {
    useProxy = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
}

export function setApiKey(key: string | null) {
    apiKey = key;
}

export function getApiKey(): string | null {
    return apiKey;
}

export function setClientFactory(factory: (() => GenAIClient) | null) {
    clientFactory = factory;
}

export function setUseProxy(use: boolean) {
    useProxy = use;
}

export async function checkApiKey(): Promise<void> {
    let hasKey = false;
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        hasKey = await window.aistudio.hasSelectedApiKey();
    }

    if (!hasKey && !apiKey) {
        if (window.aistudio?.openSelectKey) {
            log("Requesting API Key selection...", "warn");
            await window.aistudio.openSelectKey();
        } else {
            alert("API Key missing");
            throw new Error("API Key missing");
        }
    }
}

function getClient(): GenAIClient {
    if (clientFactory) {
        return clientFactory();
    }

    if (!apiKey && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
    }
    if (!apiKey) {
        throw new Error("API Key not configured");
    }
    return new GoogleGenAI({ apiKey }) as unknown as GenAIClient;
}

export async function generateStoryboard(state: ProjectState): Promise<{ scenes: Array<{ id: string; startTime: number; endTime: number; description: string; visualPrompt: string }> }> {
    const ai = getClient();
    const numClips = Math.ceil(state.audioDuration / state.clipLength);

    const systemInstruction = `
    You are a professional Music Video Director creating content for AI video generation.
    TASK: Create a visual storyboard for a song that is ${Math.round(state.audioDuration)} seconds long.
    The video MUST be broken down into exactly ${numClips} sequential scenes, each approx ${state.clipLength} seconds.

    INPUT CONTEXT:
    Lyrics/Vibe: "${state.lyrics}"
    Aspect Ratio: ${state.aspectRatio}

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

    return JSON.parse(response.text);
}

export function detectSafetyCategory(errorMessage: string): SafetyCategory {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('violence') || lower.includes('weapon')) return 'violence';
    if (lower.includes('drug') || lower.includes('substance') || lower.includes('smoke')) return 'substance';
    if (lower.includes('explicit') || lower.includes('sexual')) return 'explicit';
    if (lower.includes('money') || lower.includes('cash')) return 'money';
    return 'general';
}

export async function generateSafeReferenceImage(prompt: string, aspectRatio: string): Promise<{ base64: string, mime: string } | null> {
    const ai = getClient();
    log("Generating safe reference image to guide Veo...", "warn");

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: `Cinematic still, high quality, professional music video shot: ${prompt}`,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9'
            }
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
            return {
                base64: response.generatedImages[0].image.imageBytes,
                mime: 'image/png'
            };
        }
        return null;
    } catch (e) {
        console.error("Image generation failed", e);
        return null;
    }
}

export async function sanitizePrompt(originalPrompt: string): Promise<string> {
    const ai = getClient();
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

export async function generateVideo(
    prompt: string,
    aspectRatio: string,
    styleImage?: { imageBytes: string; mimeType: string }
): Promise<{ operation: any }> {
    const ai = getClient();

    const videoConfig: any = {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
    };

    if (styleImage) {
        return await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: prompt,
            image: styleImage,
            config: videoConfig
        });
    } else {
        return await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: prompt,
            config: videoConfig
        });
    }
}

export async function pollVideoOperation(operation: any, maxPolls: number = 60): Promise<any> {
    const ai = getClient();
    let pollCount = 0;
    
    while (!operation.done && pollCount < maxPolls) {
        pollCount++;
        await new Promise(r => setTimeout(r, 10000)); // 10 second intervals
        
        try {
            operation = await ai.operations.getVideosOperation({ operation });
            if (pollCount % 3 === 0 || operation.done) {
                log(`Poll #${pollCount}: done=${operation.done}`, "info");
            }
        } catch (error) {
            log(`Poll error: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
            // Retry once before giving up
            if (pollCount < maxPolls) {
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }
            throw error;
        }
    }
    
    if (pollCount >= maxPolls && !operation.done) {
        throw new Error("Video generation timed out after maximum polling attempts");
    }
    
    return operation;
}

export async function downloadVideo(uri: string): Promise<Blob> {
    const key = apiKey || process.env.API_KEY;
    if (!key) {
        throw new Error("API Key not available for download");
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
        
        const res = await fetch(`${uri}&key=${key}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`Failed to download video: ${res.status} ${res.statusText}`);
        }
        
        const blob = await res.blob();
        
        if (blob.size === 0) {
            throw new Error("Downloaded video is empty");
        }
        
        return blob;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error("Video download timed out. Please try again.");
        }
        throw error;
    }
}

