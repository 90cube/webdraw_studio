import state from '../core/stateManager.js';

const panelId = 'panel-prompt';
let panel;

function render() {
    return `
        <div class="panel-header"><h2>프롬프트</h2><button class="collapse-toggle">v</button></div>
        <div class="panel-content prompt-panel-layout">
            <div class="prompt-inputs-section">
                <div class="tool-group">
                    <h4>긍정 프롬프트</h4>
                    <textarea id="positive-prompt" rows="4" placeholder="여기에 긍정 프롬프트를 입력하세요."></textarea>
                    <div class="tool-group">
                        <h5>긍정 프리셋</h5>
                        <div id="positive-presets-container" class="presets-container"></div>
                    </div>
                </div>
                <div class="tool-group">
                    <h4>부정 프롬프트</h4>
                    <textarea id="negative-prompt" rows="4" placeholder="여기에 부정 프롬프트를 입력하세요."></textarea>
                    <div class="tool-group">
                        <h5>부정 프리셋</h5>
                        <div id="negative-presets-container" class="presets-container"></div>
                    </div>
                </div>
            </div>
            <div class="execution-controls-section">
                <div class="tool-group vertical-slider-group">
                    <h4>CFG</h4>
                    <input type="range" id="param-cfg" min="0" max="20" value="5">
                    <span id="cfg-value">5</span>
                </div>
                <div class="tool-group vertical-slider-group">
                    <h4>Denoise</h4>
                    <input type="range" id="param-denoise" min="0" max="1" value="1" step="0.01">
                    <span id="denoise-value">1</span>
                </div>
            </div>
        </div>
    `;
}

function renderPresets(presets, container) {
    container.innerHTML = presets.map(p => `<button class="btn preset-btn" data-prompt="${p.prompt}">${p.name}</button>`).join('');
}

function attachEventListeners() {
    const cfgSlider = panel.querySelector('#param-cfg');
    const cfgValueSpan = panel.querySelector('#cfg-value');
    const denoiseSlider = panel.querySelector('#param-denoise');
    const denoiseValueSpan = panel.querySelector('#denoise-value');

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

    // Preset Buttons Event Listener (using event delegation)
    panel.addEventListener('click', e => {
        if (!e.target.classList.contains('preset-btn')) return;

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