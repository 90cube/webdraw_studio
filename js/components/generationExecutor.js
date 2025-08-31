const panelId = 'panel-generation-executor';

function render() {
    return `
        <div class="panel-header"><h2>생성 실행기</h2><button class="collapse-toggle">−</button></div>
        <div class="panel-content">
            <button id="generate-btn">GENERATE</button>
            <button id="stop-btn" style="display:none;">STOP</button>
            <input type="number" id="generate-count" value="1" min="1" title="Batch Count">
            <label><input type="checkbox" id="infinite-toggle"> ∞</label>
            <div id="pipeline-display">Pipeline: Idle</div>
        </div>
    `;
}

export function init() {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-top');
    panel.innerHTML = render();
    // Add event listeners here
}
