// UI Event Handlers

import { projectState, saveState, setAudioBlobUrl, clearProject } from '../state/state';
import { blobToBase64, formatTime } from '../utils/helpers';
import { log } from '../logging/logger';
import type { UIElements } from './elements';

export function setupAudioHandlers(elements: UIElements) {
    elements.audioInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            try {
                const blobUrl = URL.createObjectURL(file);
                setAudioBlobUrl(blobUrl);
                elements.audioEl.src = blobUrl;
                elements.audioEl.load();
                log(`Audio loaded: ${file.name}`, 'success');
            } catch (error) {
                log(`Failed to load audio: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                alert('Failed to load audio file. Please try again.');
            }
        }
    });

    elements.audioEl.addEventListener('loadedmetadata', () => {
        if (elements.audioEl.duration && !isNaN(elements.audioEl.duration)) {
            projectState.audioDuration = elements.audioEl.duration;
            elements.audioDurationEl.textContent = formatTime(projectState.audioDuration);
            elements.totalTimeEl.textContent = formatTime(projectState.audioDuration);
            saveState();
        } else {
            log('Audio metadata invalid', 'error');
        }
    });

    elements.audioEl.addEventListener('error', (e) => {
        log('Audio load error', 'error');
        alert('Failed to load audio. Please check the file format.');
    });
}

export function setupSettingsHandlers(elements: UIElements) {
    elements.styleInput.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            try {
                projectState.styleImageMime = file.type;
                projectState.styleImageBase64 = await blobToBase64(file);
                elements.stylePreview.src = URL.createObjectURL(file);
                elements.stylePreview.classList.remove('hidden');
                saveState();
                log("Style reference image updated.", "info");
            } catch (error) {
                log(`Failed to load style image: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                alert('Failed to load style image. Please try again.');
            }
        }
    });

    elements.aspectRatioSelect.addEventListener('change', () => {
        projectState.aspectRatio = elements.aspectRatioSelect.value;
        saveState();
    });

    elements.clipLengthSelect.addEventListener('change', () => {
        const value = parseInt(elements.clipLengthSelect.value);
        if (!isNaN(value) && value > 0) {
            projectState.clipLength = value;
            saveState();
        }
    });

    elements.transitionSelect.addEventListener('change', () => {
        projectState.transitionType = elements.transitionSelect.value as any;
        log(`Transition effect changed to: ${projectState.transitionType.toUpperCase()}`, 'info');
        saveState();
    });

    elements.promptInput.addEventListener('input', () => {
        projectState.lyrics = elements.promptInput.value;
        saveState();
    });

    elements.clearProjectBtn.addEventListener('click', () => {
        clearProject();
    });
}

export function restoreUIState(elements: UIElements) {
    elements.promptInput.value = projectState.lyrics;
    elements.aspectRatioSelect.value = projectState.aspectRatio;
    elements.clipLengthSelect.value = projectState.clipLength.toString();
    elements.transitionSelect.value = projectState.transitionType;

    if (projectState.styleImageBase64) {
        elements.stylePreview.src = `data:${projectState.styleImageMime};base64,${projectState.styleImageBase64}`;
        elements.stylePreview.classList.remove('hidden');
    }
}

