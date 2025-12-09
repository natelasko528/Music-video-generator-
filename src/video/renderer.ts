// Video Rendering Logic with Safety Recovery

import { projectState, updateScene, getScene } from '../state/state';
import { log } from '../logging/logger';
import { renderSceneList } from '../ui/timeline';
import type { UIElements } from '../ui/elements';
import {
    checkApiKey,
    generateVideo,
    pollVideoOperation,
    downloadVideo,
    detectSafetyCategory,
    generateSafeReferenceImage,
    sanitizePrompt,
    setApiKey
} from '../api/client';

const MAX_ATTEMPTS = 3;

export async function renderSingleScene(elements: UIElements, sceneId: string) {
    await checkApiKey();
    
    // Initialize API key from environment if available
    if (process.env.API_KEY) {
        setApiKey(process.env.API_KEY);
    }

    const sceneIndex = projectState.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) {
        log(`ERROR: Scene ${sceneId} not found in project state.`, "error");
        return;
    }

    // Update State
    updateScene(sceneId, { status: 'generating', errorMsg: undefined });
    renderSceneList(elements);

    log(`========== RENDER START: Scene #${sceneIndex + 1} ==========`, "system");
    log(`Scene ID: ${sceneId}`, "info");

    const scene = getScene(sceneId);
    if (!scene) {
        log(`Scene not found: ${sceneId}`, "error");
        return;
    }

    let currentPrompt = scene.visualPrompt;
    log(`Original Prompt: "${currentPrompt.substring(0, 100)}..."`, "info");

    let attempts = 0;

    // Check if we have a global style image
    let styleImage = projectState.styleImageBase64 ? {
        imageBytes: projectState.styleImageBase64,
        mimeType: projectState.styleImageMime
    } : undefined;

    log(`Style Image Present: ${styleImage ? 'YES (' + projectState.styleImageMime + ')' : 'NO'}`, "info");
    log(`Aspect Ratio: ${projectState.aspectRatio}`, "info");

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        log(`--- Attempt ${attempts}/${MAX_ATTEMPTS} ---`, "system");

        try {
            log(`Sending prompt to Veo: "${currentPrompt.substring(0, 80)}..."`, "info");

            const veoOperation = await generateVideo(currentPrompt, projectState.aspectRatio, styleImage);
            log(`Veo API call successful. Operation created.`, "success");
            log(`Operation Name: ${veoOperation.name || 'N/A'}`, "info");
            log(`Polling for completion...`, "info");

            const completedOperation = await pollVideoOperation(veoOperation);
            log(`Polling complete.`, "success");

            // Check Result
            if (completedOperation.response?.generatedVideos?.[0]?.video?.uri) {
                const uri = completedOperation.response.generatedVideos[0].video.uri;
                log(`Video URI received: ${uri.substring(0, 50)}...`, "success");
                log("Downloading video...", "info");

                const blob = await downloadVideo(uri);
                log(`Downloaded blob size: ${blob.size} bytes`, "info");

                const blobUrl = URL.createObjectURL(blob);

                updateScene(sceneId, {
                    status: 'done',
                    videoUri: uri,
                    videoUrl: blobUrl,
                    visualPrompt: currentPrompt
                });
                renderSceneList(elements);
                log(`========== RENDER SUCCESS: Scene #${sceneIndex + 1} ==========`, "success");
                return; // Success, exit function
            } else {
                log(`ERROR: No video URI in response.`, "error");
                throw new Error("Veo returned no video (Possible Safety Block)");
            }

        } catch (e: any) {
            console.error("Veo Error:", e);
            log(`CATCH: ${e.message}`, "error");

            if (attempts < MAX_ATTEMPTS && (e.message.includes("Safety") || e.message.includes("no video"))) {
                const category = detectSafetyCategory(e.message);
                log(`Safety Block Detected (${category}): ${e.message}`, "warn");

                updateScene(sceneId, { status: 'sanitizing' });
                renderSceneList(elements);

                // STRATEGY SWITCHING
                if (attempts === 1) {
                    log(`=== STRATEGY 1: Drop Image + Generate Safe Reference ===`, "system");

                    if (styleImage) {
                        log("Dropping previous style image (potential safety trigger).", "warn");
                        styleImage = undefined;
                    }

                    log("Generating Safe Reference Image via Imagen...", "system");
                    const safeImage = await generateSafeReferenceImage(currentPrompt, projectState.aspectRatio);

                    if (safeImage) {
                        styleImage = {
                            imageBytes: safeImage.base64,
                            mimeType: safeImage.mime
                        };
                        log("Safe reference image created successfully.", "success");
                    } else {
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

                updateScene(sceneId, { status: 'generating' });
                renderSceneList(elements);
                // Loop continues
            } else {
                updateScene(sceneId, {
                    status: 'error',
                    errorMsg: e.message || "Unknown error"
                });
                renderSceneList(elements);
                log(`========== RENDER FAILED: Scene #${sceneIndex + 1} ==========`, "error");
                log(`Final Error: ${e.message}`, "error");
                return;
            }
        }
    }

    // If we exit the loop without returning, all attempts failed
    log(`All ${MAX_ATTEMPTS} attempts exhausted. Scene render failed.`, "error");
    updateScene(sceneId, {
        status: 'error',
        errorMsg: "Max retry attempts reached"
    });
    renderSceneList(elements);
}

export async function renderAllScenes(elements: UIElements) {
    if (!confirm("Start rendering all pending scenes? This will run 4 videos in parallel.")) return;

    log("Batch rendering initiated (Parallel Mode: 4 threads).", "system");

    const pendingScenes = projectState.scenes.filter(s => s.status !== 'done');
    if (pendingScenes.length === 0) {
        log("No pending scenes to render.", "info");
        return;
    }

    // Concurrency Control
    const CONCURRENCY_LIMIT = 4;
    let activeGenerations = 0;
    let currentIndex = 0;

    // Helper to process the queue
    const processQueue = async () => {
        const promises: Promise<void>[] = [];

        while (currentIndex < pendingScenes.length) {
            if (activeGenerations < CONCURRENCY_LIMIT) {
                const scene = pendingScenes[currentIndex];
                currentIndex++;
                activeGenerations++;

                const p = renderSingleScene(elements, scene.id)
                    .then(() => {
                        activeGenerations--;
                    })
                    .catch((e: any) => {
                        console.error(`Batch render error for scene ${scene.id}:`, e);
                        activeGenerations--;
                    });

                promises.push(p);

                // Brief stagger to avoid hitting instant rate limits
                await new Promise(r => setTimeout(r, 500));
            } else {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        await Promise.all(promises);
    };

    try {
        await processQueue();
        while (activeGenerations > 0) {
            await new Promise(r => setTimeout(r, 1000));
        }
        log("Batch rendering complete.", "success");
    } catch (e) {
        console.error("Batch Queue Error", e);
        log("Batch rendering stopped due to error.", "error");
    }
}

