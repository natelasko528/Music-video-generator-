// Dual-Layer Playback Engine

import { projectState } from '../state/state';
import { formatTime } from '../utils/helpers';
import { log } from '../logging/logger';
import type { UIElements } from '../ui/elements';

let masterPlaybackInterval: number | null = null;
let activeVideoLayer = 1; // 1 or 2

export function startPlaybackEngine(elements: UIElements) {
    if (masterPlaybackInterval) {
        stopPlaybackEngine(elements);
    }

    // Validate audio element state
    if (!elements.audioEl.src || elements.audioEl.readyState === 0) {
        log("Audio not ready for playback", "warn");
        return;
    }

    masterPlaybackInterval = window.setInterval(() => {
        try {
            const t = elements.audioEl.currentTime;
            
            if (isNaN(t) || !isFinite(t) || t < 0) {
                return;
            }

            elements.currentTimeEl.textContent = formatTime(t);

            // Progress Bar
            if (projectState.audioDuration > 0 && isFinite(projectState.audioDuration)) {
                const pct = (t / projectState.audioDuration) * 100;
                elements.progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
            }

            // Determine Current Scene
            const activeSceneIndex = projectState.scenes.findIndex(s => t >= s.startTime && t < s.endTime);
            const activeScene = projectState.scenes[activeSceneIndex];

            if (activeScene) {
                elements.nowPlayingText.textContent = `Scene ${activeSceneIndex + 1}: ${activeScene.description}`;

                // Check if we need to switch video
                const currentLayer = activeVideoLayer === 1 ? elements.videoLayer1 : elements.videoLayer2;
                const currentSceneId = currentLayer.getAttribute('data-scene-id');

                if (activeScene.videoUrl && currentSceneId !== activeScene.id) {
                    performTransition(elements, activeScene.videoUrl, activeScene.id);
                } else if (!activeScene.videoUrl && currentSceneId !== 'blank') {
                    // If scene not rendered yet, maybe show placeholder?
                }
            }

            if (elements.audioEl.ended) {
                stopPlaybackEngine(elements);
                elements.iconPlay.classList.remove('hidden');
                elements.iconPause.classList.add('hidden');
                log("Playback finished.", "info");
            }
        } catch (error) {
            console.error("Playback engine error:", error);
            // Don't spam logs, but handle gracefully
        }

    }, 50); // High frequency for smooth triggers
}

export function stopPlaybackEngine(elements: UIElements) {
    if (masterPlaybackInterval) {
        clearInterval(masterPlaybackInterval);
        masterPlaybackInterval = null;
    }
    elements.videoLayer1.pause();
    elements.videoLayer2.pause();
}

export function performTransition(elements: UIElements, newUrl: string, newSceneId: string) {
    const incomingLayer = activeVideoLayer === 1 ? elements.videoLayer2 : elements.videoLayer1;
    const outgoingLayer = activeVideoLayer === 1 ? elements.videoLayer1 : elements.videoLayer2;

    // 1. Prepare Incoming Layer
    incomingLayer.src = newUrl;
    incomingLayer.setAttribute('data-scene-id', newSceneId);
    incomingLayer.load();

    const playPromise = incomingLayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            log("Autoplay prevented during transition", "warn");
        });
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
        outgoingLayer.style.transition = 'opacity 0.5s ease';
        incomingLayer.style.transition = 'opacity 0.5s ease 0.5s'; // Delay start

        outgoingLayer.style.opacity = '0';
        setTimeout(() => {
            incomingLayer.style.opacity = '1';
        }, 50);
    }

    // 3. Swap Active Index
    activeVideoLayer = activeVideoLayer === 1 ? 2 : 1;
    log(`Switched to scene ${newSceneId} (${effect})`, 'system');
}

export function setupPlaybackHandlers(elements: UIElements) {
    elements.playPauseBtn.addEventListener('click', () => {
        if (elements.audioEl.paused) {
            if (!projectState.audioDuration || projectState.audioDuration === 0) {
                alert("Upload audio first");
                return;
            }

            elements.audioEl.play().catch((error) => {
                log(`Playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                alert('Failed to start playback. Please check your audio file.');
            });
            elements.iconPlay.classList.add('hidden');
            elements.iconPause.classList.remove('hidden');
            startPlaybackEngine(elements);
            log("Playback started.", "info");
        } else {
            elements.audioEl.pause();
            elements.iconPlay.classList.remove('hidden');
            elements.iconPause.classList.add('hidden');
            stopPlaybackEngine(elements);
            log("Playback paused.", "info");
        }
    });
}

