// Logging System

import type { LogType } from '../types';

let debugOutput: HTMLDivElement | null = null;

export function initLogger(outputElement: HTMLDivElement) {
    debugOutput = outputElement;
}

export function log(message: string, type: LogType = 'info') {
    if (!debugOutput) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        return;
    }

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

export function clearLogs() {
    if (debugOutput) {
        debugOutput.innerHTML = '';
        log('Console cleared.', 'system');
    }
}

