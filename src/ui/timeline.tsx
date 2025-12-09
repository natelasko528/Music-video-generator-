// Timeline UI Rendering

import { projectState, updateScene } from '../state/state';
import { formatTime } from '../utils/helpers';
import { log } from '../logging/logger';
import type { UIElements } from './elements';
import type { Scene } from '../types';

export function renderSceneList(elements: UIElements) {
    elements.sceneContainer.innerHTML = '';

    if (projectState.scenes.length === 0) {
        elements.sceneContainer.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-700 border border-dashed border-gray-800 rounded-xl"><p class="text-sm">Timeline Empty</p></div>`;
        elements.renderAllBtn.disabled = true;
        return;
    }

    elements.renderAllBtn.disabled = false;

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
        elements.sceneContainer.appendChild(div);
    });
}

export function setupPreviewHandler(elements: UIElements) {
    (window as any).previewScene = (url: string) => {
        log("Previewing generated clip...", "info");
        elements.videoLayer1.src = url;
        elements.videoLayer1.style.opacity = '1';
        elements.videoLayer2.style.opacity = '0';
        elements.videoLayer1.play().catch(() => {
            log("Autoplay prevented", "warn");
        });
        elements.videoLayer1.loop = true;
        elements.playPauseBtn.click(); // Pause master playback if running
    };
}

