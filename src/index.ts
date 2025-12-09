// Main Entry Point

import { getElements } from './ui/elements';
import { initLogger, clearLogs } from './logging/logger';
import { initState, restoreUIState } from './state/state';
import { setupAudioHandlers, setupSettingsHandlers } from './ui/handlers';
import { renderSceneList, setupPreviewHandler } from './ui/timeline';
import { setupPlaybackHandlers } from './playback/engine';
import { planStoryboard } from './planner/planner';
import { renderSingleScene, renderAllScenes } from './video/renderer';
import { projectState } from './state/state';

// Initialize
const elements = getElements();

// Initialize subsystems
initLogger(elements.debugOutput);
initState(elements.saveStatus);

// Setup event handlers
elements.clearConsoleBtn.addEventListener('click', clearLogs);
setupAudioHandlers(elements);
setupSettingsHandlers(elements);
setupPlaybackHandlers(elements);
setupPreviewHandler(elements);

// Restore UI state from saved project
restoreUIState(elements);
renderSceneList(elements);

// Setup planning button
elements.planButton.addEventListener('click', () => planStoryboard(elements));

// Setup render all button
elements.renderAllBtn.addEventListener('click', () => renderAllScenes(elements));

// Expose render function globally for onclick handlers
(window as any).renderSingleScene = (sceneId: string) => renderSingleScene(elements, sceneId);

log("System initialized. Waiting for input...", "system");

