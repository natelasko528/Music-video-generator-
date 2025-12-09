// Storyboard Planning Logic

import { projectState, saveState } from '../state/state';
import { checkApiKey, generateStoryboard, setApiKey } from '../api/client';
import { log } from '../logging/logger';
import { renderSceneList } from '../ui/timeline';
import type { UIElements } from '../ui/elements';

export async function planStoryboard(elements: UIElements) {
    if (!projectState.audioDuration || projectState.audioDuration === 0) {
        alert("Please upload an audio track first.");
        log("Planning aborted: No audio track.", "warn");
        return;
    }

    if (!elements.promptInput.value.trim()) {
        alert("Please enter lyrics or a vibe description.");
        return;
    }

    await checkApiKey();
    
    // Initialize API key from environment if available
    if (process.env.API_KEY) {
        setApiKey(process.env.API_KEY);
    }

    elements.planButton.disabled = true;
    elements.planButton.innerHTML = `<span class="animate-pulse">Director Planning...</span>`;
    log("Starting storyboard generation with Gemini 3.0...", "system");

    try {
        const plan = await generateStoryboard(projectState);

        projectState.scenes = plan.scenes.map((s: any, index: number) => ({
            id: `scene-${index}`,
            startTime: index * projectState.clipLength,
            endTime: Math.min((index + 1) * projectState.clipLength, projectState.audioDuration),
            description: s.description || "Scene",
            visualPrompt: s.visualPrompt,
            status: 'pending' as const
        }));

        saveState();
        renderSceneList(elements);
        log(`Storyboard created with ${projectState.scenes.length} scenes.`, "success");

        // Auto-navigate to Timeline tab
        const timelineTab = document.querySelector('[data-tab="timeline"]') as HTMLButtonElement;
        if (timelineTab) {
            timelineTab.click();
            log("Switched to Timeline view.", "system");
        }

    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        log(`Planning failed: ${errorMessage}`, "error");
        
        // Provide user-friendly error messages
        if (errorMessage.includes('API Key') || errorMessage.includes('authentication')) {
            alert("API authentication failed. Please check your API key settings.");
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            alert("Network error. Please check your connection and try again.");
        } else {
            alert(`Planning failed: ${errorMessage}`);
        }
    } finally {
        elements.planButton.disabled = false;
        elements.planButton.innerHTML = `
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
}

