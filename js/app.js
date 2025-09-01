import { initCanvas } from './core/canvas.js?v=20250901';
import { initDraggablePanels, initCollapsiblePanels } from './core/ui.js?v=20250901';

// Import all component modules

import { init as initModelExplorer } from './components/modelExplorer.js?v=20250901';
import { init as initParameters } from './components/parameters.js?v=20250901';
import { init as initAreaCapture } from './components/areaCapture.js?v=20250901';
import { init as initMultiDetailer } from './components/multiDetailer.js?v=20250901';
import { init as initPrompt } from './components/prompt.js?v=20250901';
import { init as initLoraSelector } from './components/loraSelector.js?v=20250901';

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
    const panelPositions = [
        { id: 'panel-model-explorer', classes: ['position-left', 'position-top'] },
        { id: 'panel-parameters', classes: ['position-left'] },
        { id: 'panel-area-capture', classes: ['position-right', 'position-top'] },
        { id: 'panel-multi-detailer', classes: ['position-right'] },
        { id: 'panel-lora-selector', classes: ['position-right', 'position-bottom'] },
        { id: 'panel-prompt', classes: ['position-bottom'] }
    ];
    
    panelPositions.forEach(({ id, classes }) => {
        const panel = document.getElementById(id);
        if (panel) {
            panel.classList.add(...classes);
        }
    });
}