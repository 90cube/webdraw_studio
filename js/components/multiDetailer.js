const panelId = 'panel-multi-detailer';
let panel;

// Generates the HTML for a single detailer tab pane's parameters
function getParametersHtml(index) {
    return `
        <fieldset id="detailer-${index}-fieldset" disabled>
            <div class="tool-group">
                <h4>탐지 (Detection)</h4>
                <div class="detailer-param-row">
                    <label for="detailer-${index}-detection-model">Detection Model</label>
                    <select id="detailer-${index}-detection-model">
                        <option>Loading models...</option>
                    </select>
                </div>
                <div class="detailer-param-row slider-row">
                    <label for="detailer-${index}-confidence">Confidence</label>
                    <input type="range" id="detailer-${index}-confidence" min="0" max="1" step="0.01" value="0.3">
                    <span class="slider-value" id="detailer-${index}-confidence-value">0.30</span>
                </div>
            </div>

            <div class="tool-group">
                <h4>마스크 처리 (Mask Preprocessing)</h4>
                <div class="detailer-param-row-split">
                    <div class="detailer-param-row">
                        <label for="detailer-${index}-mask-padding">Mask Padding</label>
                        <input type="number" id="detailer-${index}-mask-padding" value="32">
                    </div>
                    <div class="detailer-param-row">
                        <label for="detailer-${index}-mask-blur">Mask Blur</label>
                        <input type="number" id="detailer-${index}-mask-blur" value="4">
                    </div>
                </div>
            </div>

            <div class="tool-group">
                <h4>인페인팅 (Inpainting)</h4>
                <div class="detailer-param-row">
                    <label for="detailer-${index}-prompt">Prompt</label>
                    <textarea id="detailer-${index}-prompt" rows="2" placeholder="a beautiful detailed face, masterpiece"></textarea>
                </div>
                <div class="detailer-param-row">
                    <label for="detailer-${index}-negative-prompt">Negative Prompt</label>
                    <textarea id="detailer-${index}-negative-prompt" rows="2" placeholder="blurry, ugly, deformed"></textarea>
                </div>
                <div class="detailer-param-row slider-row">
                    <label for="detailer-${index}-denoising-strength">Denoising Strength</label>
                    <input type="range" id="detailer-${index}-denoising-strength" min="0" max="1" step="0.01" value="0.4">
                    <span class="slider-value" id="detailer-${index}-denoising-strength-value">0.40</span>
                </div>
                 <div class="detailer-param-row">
                    <label for="detailer-${index}-sampler">Sampler</label>
                    <input type="text" id="detailer-${index}-sampler" value="Euler a">
                </div>
                <div class="detailer-param-row-split">
                    <div>
                        <label for="detailer-${index}-steps">Steps</label>
                        <input type="number" id="detailer-${index}-steps" value="25">
                    </div>
                    <div>
                        <label for="detailer-${index}-cfg-scale">CFG Scale</label>
                        <input type="number" id="detailer-${index}-cfg-scale" value="7.0" step="0.1">
                    </div>
                </div>
            </div>
        </fieldset>
    `;
}

function render() {
    let tabButtons = '';
    let tabPanes = '';

    for (let i = 1; i <= 4; i++) {
        const isActive = i === 1 ? 'active' : '';
        tabButtons += `<button class="tab-btn ${isActive}" data-tab="detailer-tab-${i}">Detailer ${i}</button>`;
        
        tabPanes += `
            <div class="tab-pane ${isActive}" id="detailer-tab-${i}">
                <div class="detailer-activation-row">
                    <input type="checkbox" class="detailer-active-toggle" id="detailer-${i}-active" data-fieldset="detailer-${i}-fieldset">
                    <label for="detailer-${i}-active">디테일러 ${i} 활성</label>
                </div>
                ${getParametersHtml(i)}
            </div>
        `;
    }

    return `
        <div class="panel-header"><h2 class="panel-title">다중 디테일러</h2><button class="collapse-toggle"></button></div>
        <div class="panel-content">
            <div class="tab-nav">${tabButtons}</div>
            <div class="tab-content">${tabPanes}</div>
        </div>
    `;
}

async function populateDetectionModels(index) {
    const selectElement = panel.querySelector(`#detailer-${index}-detection-model`);
    if (!selectElement) return;

    try {
        const response = await fetch('http://localhost:8001/api/models/detection');
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const models = await response.json();

        selectElement.innerHTML = ''; // Clear existing options
        if (models.length === 0) {
            selectElement.innerHTML = '<option value="">No models found</option>';
            return;
        }
        models.forEach(modelName => {
            const option = document.createElement('option');
            option.value = modelName;
            option.textContent = modelName;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error(`Failed to fetch detection models for tab ${index}:`, error);
        selectElement.innerHTML = '<option value="">Error loading models</option>';
    }
}

function attachEventListeners() {
    const tabContainer = panel.querySelector('.tab-nav');
    tabContainer.addEventListener('click', e => {
        if (e.target.matches('.tab-btn')) {
            const tabId = e.target.dataset.tab;
            
            // Update button active state
            tabContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Update pane active state
            panel.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            panel.querySelector(`#${tabId}`).classList.add('active');
        }
    });

    for (let i = 1; i <= 4; i++) {
        // Slider value displays
        panel.querySelector(`#detailer-${i}-confidence`).addEventListener('input', e => {
            panel.querySelector(`#detailer-${i}-confidence-value`).textContent = parseFloat(e.target.value).toFixed(2);
        });
        panel.querySelector(`#detailer-${i}-denoising-strength`).addEventListener('input', e => {
            panel.querySelector(`#detailer-${i}-denoising-strength-value`).textContent = parseFloat(e.target.value).toFixed(2);
        });

        // Activation checkbox
        const checkbox = panel.querySelector(`#detailer-${i}-active`);
        checkbox.addEventListener('change', e => {
            const fieldset = panel.querySelector(`#${e.target.dataset.fieldset}`);
            if (fieldset) {
                fieldset.disabled = !e.target.checked;
            }
        });
    }
}

export function init() {
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-right');
    panel.innerHTML = render();
    attachEventListeners();
    for (let i = 1; i <= 4; i++) {
        populateDetectionModels(i); // Fetch and populate models for each tab
    }
}

export default {
    init
};
