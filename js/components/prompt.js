import state from '../core/stateManager.js?v=20250901';

const panelId = 'panel-prompt';
let panel;
let presetNavigation = {
    'positive-presets': { currentIndex: 0, presets: [], itemsPerPage: 6 },
    'negative-presets': { currentIndex: 0, presets: [], itemsPerPage: 6 }
};

function render() {
    return `
        <div class="panel-header"><h2>프롬프트</h2><button class="collapse-toggle" data-collapsed="false">⌄</button></div>
        <div class="panel-content prompt-panel-layout">
            <div class="prompt-content-wrapper">
                <div class="prompt-inputs-section">
                    <div class="tab-nav">
                        <button class="tab-btn active" data-tab="positive">긍정 프롬프트</button>
                        <button class="tab-btn" data-tab="negative">부정 프롬프트</button>
                    </div>
                    <div class="tab-contents">
                        <div id="positive-tab" class="tab-content active">
                            <div class="prompt-group">
                                <div class="prompt-header">
                                    <div class="preset-buttons">
                                        <div class="preset-nav-header">
                                            <h5>긍정 프리셋</h5>
                                            <div class="preset-navigation">
                                                <button class="nav-btn nav-prev" data-target="positive-presets">◀</button>
                                                <span class="preset-indicator" data-target="positive-presets">1/1</span>
                                                <button class="nav-btn nav-next" data-target="positive-presets">▶</button>
                                            </div>
                                        </div>
                                        <div class="preset-viewport">
                                            <div id="positive-presets-container" class="presets-container"></div>
                                        </div>
                                    </div>
                                </div>
                                <textarea id="positive-prompt" rows="4" placeholder="여기에 긍정 프롬프트를 입력하세요."></textarea>
                            </div>
                        </div>
                        <div id="negative-tab" class="tab-content">
                            <div class="prompt-group">
                                <div class="prompt-header">
                                    <div class="preset-buttons">
                                        <div class="preset-nav-header">
                                            <h5>부정 프리셋</h5>
                                            <div class="preset-navigation">
                                                <button class="nav-btn nav-prev" data-target="negative-presets">◀</button>
                                                <span class="preset-indicator" data-target="negative-presets">1/1</span>
                                                <button class="nav-btn nav-next" data-target="negative-presets">▶</button>
                                            </div>
                                        </div>
                                        <div class="preset-viewport">
                                            <div id="negative-presets-container" class="presets-container"></div>
                                        </div>
                                    </div>
                                </div>
                                <textarea id="negative-prompt" rows="4" placeholder="여기에 부정 프롬프트를 입력하세요."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="execution-controls-section">
                    <div class="controls-grid">
                        <div class="control-group">
                            <label for="param-cfg">CFG</label>
                            <div class="slider-container">
                                <input type="range" id="param-cfg" min="0" max="20" value="5">
                                <span id="cfg-value" class="value-display">5</span>
                            </div>
                        </div>
                        <div class="control-group">
                            <label for="param-denoise">Denoise</label>
                            <div class="slider-container">
                                <input type="range" id="param-denoise" min="0" max="1" value="1" step="0.01">
                                <span id="denoise-value" class="value-display">1</span>
                            </div>
                        </div>
                        <div class="control-group">
                            <label for="param-repeat-count">반복생성 회수</label>
                            <div class="slider-container">
                                <input type="range" id="param-repeat-count" min="1" max="1000" value="1">
                                <span id="repeat-count-value" class="value-display">1</span>
                            </div>
                        </div>
                        <div class="control-group">
                            <label for="param-batch-size">배치 수</label>
                            <div class="slider-container">
                                <input type="range" id="param-batch-size" min="1" max="8" value="1">
                                <span id="batch-size-value" class="value-display">1</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="generate-section">
                <button id="infinity-toggle" class="btn-infinity" data-active="false">∞ INFINITY</button>
                <button id="generate-btn" class="btn-generate">GENERATE</button>
            </div>
            <div class="collapsed-expand-btn">
                <button class="expand-toggle">⌃</button>
            </div>
        </div>
    `;
}

function renderPresets(presets, container) {
    const containerId = container.id;
    const navKey = containerId.replace('-container', '');
    const nav = presetNavigation[navKey];
    
    // 프리셋 데이터 저장
    nav.presets = presets;
    nav.currentIndex = Math.min(nav.currentIndex, Math.max(0, Math.ceil(presets.length / nav.itemsPerPage) - 1));
    
    // 현재 페이지의 프리셋들만 표시
    const startIndex = nav.currentIndex * nav.itemsPerPage;
    const endIndex = Math.min(startIndex + nav.itemsPerPage, presets.length);
    const currentPagePresets = presets.slice(startIndex, endIndex);
    
    container.innerHTML = currentPagePresets.map(p => 
        `<button class="btn preset-btn" data-prompt="${p.prompt}">${p.name}</button>`
    ).join('');
    
    // 페이지 인디케이터 업데이트
    updatePresetIndicator(navKey);
    updateNavigationButtons(navKey);
}

function updatePresetIndicator(navKey) {
    const nav = presetNavigation[navKey];
    const indicator = panel.querySelector(`.preset-indicator[data-target="${navKey}"]`);
    if (indicator) {
        const totalPages = Math.max(1, Math.ceil(nav.presets.length / nav.itemsPerPage));
        indicator.textContent = `${nav.currentIndex + 1}/${totalPages}`;
    }
}

function updateNavigationButtons(navKey) {
    const nav = presetNavigation[navKey];
    const totalPages = Math.max(1, Math.ceil(nav.presets.length / nav.itemsPerPage));
    
    const prevBtn = panel.querySelector(`.nav-prev[data-target="${navKey}"]`);
    const nextBtn = panel.querySelector(`.nav-next[data-target="${navKey}"]`);
    
    if (prevBtn) prevBtn.disabled = nav.currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = nav.currentIndex >= totalPages - 1;
}

function navigatePresets(navKey, direction) {
    const nav = presetNavigation[navKey];
    const totalPages = Math.max(1, Math.ceil(nav.presets.length / nav.itemsPerPage));
    
    if (direction === 'prev' && nav.currentIndex > 0) {
        nav.currentIndex--;
    } else if (direction === 'next' && nav.currentIndex < totalPages - 1) {
        nav.currentIndex++;
    }
    
    // 컨테이너 다시 렌더링
    const container = panel.querySelector(`#${navKey}-container`);
    if (container) {
        renderPresets(nav.presets, container);
    }
}

function attachEventListeners() {
    const cfgSlider = panel.querySelector('#param-cfg');
    const cfgValueSpan = panel.querySelector('#cfg-value');
    const denoiseSlider = panel.querySelector('#param-denoise');
    const denoiseValueSpan = panel.querySelector('#denoise-value');
    const repeatCountSlider = panel.querySelector('#param-repeat-count');
    const repeatCountValueSpan = panel.querySelector('#repeat-count-value');
    const batchSizeSlider = panel.querySelector('#param-batch-size');
    const batchSizeValueSpan = panel.querySelector('#batch-size-value');
    const infinityToggle = panel.querySelector('#infinity-toggle');
    const generateBtn = panel.querySelector('#generate-btn');

    // CFG Slider Event Listener
    cfgSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        cfgValueSpan.textContent = value;
        state.setState('currentCFG', value);
    });

    // Denoise Slider Event Listener
    denoiseSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        denoiseValueSpan.textContent = value.toFixed(2);
        state.setState('currentDenoise', value);
    });

    // Repeat Count Slider Event Listener
    repeatCountSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        repeatCountValueSpan.textContent = value;
        state.setState('currentRepeatCount', value);
    });

    // Batch Size Slider Event Listener
    batchSizeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        batchSizeValueSpan.textContent = value;
        state.setState('currentBatchSize', value);
    });

    // Infinity Toggle Event Listener
    infinityToggle.addEventListener('click', () => {
        const isActive = infinityToggle.dataset.active === 'true';
        const newActive = !isActive;
        infinityToggle.dataset.active = newActive;
        infinityToggle.classList.toggle('active', newActive);
        state.setState('infinityMode', newActive);
    });

    // Generate Button Event Listener
    generateBtn.addEventListener('click', () => {
        const isGenerating = generateBtn.dataset.state === 'generating';
        const infinityActive = infinityToggle.dataset.active === 'true';
        
        if (!isGenerating) {
            // Start generating
            generateBtn.dataset.state = 'generating';
            generateBtn.textContent = 'STOP';
            generateBtn.classList.add('generating');
            
            if (infinityActive) {
                infinityToggle.classList.add('generating');
            }
            
            state.setState('isGenerating', true);
        } else {
            // Stop generating
            generateBtn.dataset.state = 'idle';
            generateBtn.textContent = 'GENERATE';
            generateBtn.classList.remove('generating');
            infinityToggle.classList.remove('generating');
            
            state.setState('isGenerating', false);
        }
    });


    // Event delegation for all panel clicks
    panel.addEventListener('click', e => {
        // Handle tab switching
        if (e.target.classList.contains('tab-btn')) {
            const targetTab = e.target.dataset.tab;
            
            // Remove active class from all tabs and contents
            panel.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            panel.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            e.target.classList.add('active');
            panel.querySelector(`#${targetTab}-tab`).classList.add('active');
            return;
        }

        // Handle preset navigation
        if (e.target.classList.contains('nav-btn')) {
            const navKey = e.target.dataset.target;
            const direction = e.target.classList.contains('nav-prev') ? 'prev' : 'next';
            navigatePresets(navKey, direction);
            return;
        }

        // Handle preset buttons
        if (e.target.classList.contains('preset-btn')) {
            const presetPrompt = e.target.dataset.prompt;
            const container = e.target.closest('.presets-container');
            let targetTextarea;

            if (container.id === 'positive-presets-container') {
                targetTextarea = panel.querySelector('#positive-prompt');
            } else if (container.id === 'negative-presets-container') {
                targetTextarea = panel.querySelector('#negative-prompt');
            }

            if (targetTextarea) {
                targetTextarea.value += presetPrompt;
            }
        }
    });

    // 펼치기 버튼 이벤트 리스너 추가 (기존 ui.js 시스템과 연동)
    const expandToggle = panel.querySelector('.expand-toggle');
    expandToggle.addEventListener('click', () => {
        panel.classList.remove('collapsed');
        // ui.js의 updatePanelCollapseIcon 함수를 통해 아이콘 업데이트
        const collapseBtn = panel.querySelector('.collapse-toggle');
        if (collapseBtn) {
            collapseBtn.textContent = 'v';
        }
    });
}

export async function init() {
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-bottom');
    panel.innerHTML = render();
    attachEventListeners();

    try {
        const positivePresetsRes = await fetch('http://localhost:8001/api/presets/positive');
        const negativePresetsRes = await fetch('http://localhost:8001/api/presets/negative');

        if (!positivePresetsRes.ok) throw new Error(`Failed to fetch positive presets: ${positivePresetsRes.status}`);
        if (!negativePresetsRes.ok) throw new Error(`Failed to fetch negative presets: ${negativePresetsRes.status}`);

        const positivePresets = await positivePresetsRes.json();
        const negativePresets = await negativePresetsRes.json();

        renderPresets(positivePresets, panel.querySelector('#positive-presets-container'));
        renderPresets(negativePresets, panel.querySelector('#negative-presets-container'));
    } catch (error) {
        console.error("Failed to fetch presets:", error);
        panel.querySelector('#positive-presets-container').innerHTML = `<p style="color: red;">프리셋을 불러오는 데 실패했습니다.</p>`;
        panel.querySelector('#negative-presets-container').innerHTML = `<p style="color: red;">프리셋을 불러오는 데 실패했습니다.</p>`;
    }
}