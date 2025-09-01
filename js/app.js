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
    console.log('🌟 [DEBUG] App initialization started');
    
    // 1. 코어 기능 초기화 (캔버스, 드래그, 접기)
    console.log('🎨 [DEBUG] Initializing canvas...');
    const mainCanvas = initCanvas();
    
    // 2. 모든 UI 컴포넌트 생성
    console.log('🔧 [DEBUG] Initializing UI components...');
    // initGenerationExecutor();
    initModelExplorer();
    initParameters();
    initAreaCapture(mainCanvas);
    initMultiDetailer();
    initPrompt();
    initLoraSelector();
    
    // 3. 패널 시스템 초기화 (컴포넌트 생성 후)
    console.log('🖱️ [DEBUG] Initializing panel systems...');
    initDraggablePanels();
    initCollapsiblePanels();
    
    // 4. 초기 위치 클래스 설정
    console.log('📍 [DEBUG] Setting initial panel positions...');
    setInitialPanelPositions();
    
    console.log('✅ [DEBUG] App initialization complete');
});

function setInitialPanelPositions() {
    // 초기 패널 위치에 따른 클래스 설정
    console.log('🏷️ [DEBUG] Setting position classes for panels...');
    
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
            console.log('📍 [DEBUG] Panel', id, 'position classes:', classes);
        } else {
            console.log('🚨 [DEBUG] Panel not found:', id);
        }
    });
    
    console.log('✅ [DEBUG] Panel positions set complete');
}