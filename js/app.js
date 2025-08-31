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
    
    // 2. 모든 UI 컴포넌트 생성
    // initGenerationExecutor();
    initModelExplorer();
    initParameters();
    initAreaCapture(mainCanvas);
    initMultiDetailer();
    initPrompt();
    initLoraSelector();
    
    // 3. 패널 시스템 초기화 (컴포넌트 생성 후)
    initDraggablePanels();
    initCollapsiblePanels();
    
    // 4. 초기 위치 클래스 설정
    setInitialPanelPositions();
});

function setInitialPanelPositions() {
    // 초기 패널 위치에 따른 클래스 설정
    document.getElementById('panel-model-explorer').classList.add('position-left', 'position-top');
    document.getElementById('panel-parameters').classList.add('position-left');
    document.getElementById('panel-area-capture').classList.add('position-right', 'position-top');
    document.getElementById('panel-multi-detailer').classList.add('position-right');
    document.getElementById('panel-lora-selector').classList.add('position-right', 'position-bottom');
    document.getElementById('panel-prompt').classList.add('position-bottom');
}