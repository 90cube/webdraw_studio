import state from '../core/stateManager.js?v=20250901';

const panelId = 'panel-parameters';
let panel;

const resolutionPresets = {
  sd15: {
    '1:1': { width: 768, height: 768 },
    '4:3': { width: 768, height: 576 },
    '3:2': { width: 768, height: 512 },
    '16:9': { width: 912, height: 512 },
    '2:1': { width: 1024, height: 512 },
  },
  sdxl: {
    '1:1': { width: 1024, height: 1024 },
    '5:4': { width: 1088, height: 896 },
    '4:3': { width: 1152, height: 864 },
    '3:2': { width: 1152, height: 768 },
    '16:9': { width: 1344, height: 768 },
    '2:1': { width: 1448, height: 720 },
    '21:9': { width: 1536, height: 640 },
  }
};

function render() {
    return `
        <div class="panel-header"><h2 class="panel-title">파라미터</h2><button class="collapse-toggle"></button></div>
        <div class="panel-content">
            <div>모델 상태: <span id="model-status">[N/A]</span></div>
            <div class="tool-group">
                <h4>해상도 프리셋</h4>
                <div id="resolution-presets"></div>
            </div>
            <div class="tool-group">
                <h4>해상도</h4>
                <div class="resolution-inputs">
                    <label>W: <input type="number" id="param-width" step="8" max="9999"></label>
                    <label>H: <input type="number" id="param-height" step="8" max="9999"></label>
                </div>
            </div>
            <div class="tool-group">
                <div class="sampler-scheduler-inputs">
                    <div>
                        <label for="param-sampler">샘플러</label>
                        <input type="text" id="param-sampler" value="Euler a">
                    </div>
                    <div>
                        <label for="param-scheduler">스케쥴러</label>
                        <input type="text" id="param-scheduler" value="normal">
                    </div>
                </div>
            </div>
            <div class="tool-group">
                <h4>스텝 & 노이즈</h4>
                <div class="step-noise-controls">
                    <label>Step: <input type="number" id="param-steps" value="25"></label>
                    <label><input type="checkbox" id="param-add-noise"> Add Noise</label>
                </div>
            </div>
            <div class="tool-group">
                <h4>시드</h4>
                <div class="seed-controls">
                    <label>Seed: <input type="number" id="param-seed" value="-1"></label>
                    <label><input type="checkbox" id="param-fixed-seed"> Fix</label>
                </div>
            </div>
        </div>
    `;
}

function renderPresets(baseModel) {
    const presets = resolutionPresets[baseModel] || {};
    const container = panel.querySelector('#resolution-presets');
    container.innerHTML = '';

    // 1. '1:1' 버튼을 찾아 먼저 추가
    if (presets['1:1']) {
        const button = document.createElement('button');
        button.className = 'btn ratio-1-1';
        button.textContent = '1:1';
        button.dataset.ratio = '1:1';
        button.dataset.orientation = 'landscape';
        container.appendChild(button);
    }

    // 2. 나머지 버튼들을 정렬하여 추가
    const otherRatios = Object.keys(presets).filter(r => r !== '1:1');
    const remainingCount = otherRatios.length;
    const columns = remainingCount % 2 === 0 ? 2 : 3;
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

    otherRatios.forEach(ratio => {
        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = ratio;
        button.dataset.ratio = ratio;
        button.dataset.orientation = 'landscape';
        container.appendChild(button);
    });
}

function updateResolutionFields(width, height) {
    const widthInput = panel.querySelector('#param-width');
    const heightInput = panel.querySelector('#param-height');
    widthInput.value = width;
    heightInput.value = height;
    state.setState('currentResolution', { width, height });
}

function attachEventListeners() {
    panel.querySelector('#resolution-presets').addEventListener('click', e => {
        if (e.target.tagName !== 'BUTTON') return;

        const button = e.target;
        const ratio = button.dataset.ratio;
        const baseModel = state.getState('currentBaseModel') || 'sdxl';
        const preset = resolutionPresets[baseModel][ratio];
        if (!preset) return;

        if (ratio === '1:1') {
            updateResolutionFields(preset.width, preset.height);
        } else {
            if (button.dataset.orientation === 'landscape') {
                updateResolutionFields(preset.width, preset.height);
                button.dataset.orientation = 'portrait';
            } else {
                updateResolutionFields(preset.height, preset.width);
                button.dataset.orientation = 'landscape';
            }
        }
        
        panel.querySelectorAll('#resolution-presets button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });

    panel.querySelector('#param-steps').addEventListener('change', e => {
        state.setState('currentSteps', parseInt(e.target.value));
    });

    panel.querySelector('#param-add-noise').addEventListener('change', e => {
        state.setState('addNoise', e.target.checked);
    });

    // Seed controls
    const seedInput = panel.querySelector('#param-seed');
    const fixedSeedCheckbox = panel.querySelector('#param-fixed-seed');

    seedInput.addEventListener('change', e => {
        state.setState('currentSeed', parseInt(e.target.value));
    });

    fixedSeedCheckbox.addEventListener('change', e => {
        const isFixed = e.target.checked;
        state.setState('fixedSeed', isFixed);
        seedInput.disabled = !isFixed; // Disable seed input if NOT fixed
    });
}

function updateUI(baseModel) {
    if (!panel) return;
    panel.querySelector('#model-status').textContent = `[${(baseModel || 'N/A').toUpperCase()}]`;
    renderPresets(baseModel || 'sdxl');

    panel.querySelector('#param-steps').value = state.getState('currentSteps');
    panel.querySelector('#param-add-noise').checked = state.getState('addNoise');

    const seedInput = panel.querySelector('#param-seed');
    const fixedSeedCheckbox = panel.querySelector('#param-fixed-seed');

    seedInput.value = state.getState('currentSeed');
    fixedSeedCheckbox.checked = state.getState('fixedSeed');
    seedInput.disabled = !state.getState('fixedSeed'); // Set initial disabled state
}

export function init() {
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-left');
    panel.innerHTML = render();
    attachEventListeners();

    updateUI(state.getState('currentBaseModel'));
    state.listen('currentBaseModel', newBaseModel => {
        updateUI(newBaseModel);
    });
}