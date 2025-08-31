import { initCanvas } from './core/canvas.js';
import { initDraggablePanels, initCollapsiblePanels } from './core/ui.js';

// Import all component modules

import { init as initModelExplorer } from './components/modelExplorer.js';
import { init as initParameters } from './components/parameters.js';
import { init as initAreaCapture } from './components/areaCapture.js';
import { init as initMultiDetailer } from './components/multiDetailer.js';
import { init as initPrompt } from './components/prompt.js';
import { init as initLoraSelector } from './components/loraSelector.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 코어 기능 초기화 (캔버스, 드래그, 접기)
    const mainCanvas = initCanvas();
    initDraggablePanels();
    initCollapsiblePanels();

    // 2. 모든 UI 컴포넌트 생성
    // initGenerationExecutor();
    initModelExplorer();
    initParameters();
    initAreaCapture(mainCanvas);
    initMultiDetailer();
    initPrompt();
    initLoraSelector();
});