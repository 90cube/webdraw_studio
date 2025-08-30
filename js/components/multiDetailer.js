const panelId = 'panel-multi-detailer';

function render() {
    return `
        <div class="panel-header"><h2>다중 디테일러</h2><button class="collapse-toggle">></button></div>
        <div class="panel-content">
            <button>+ Add Detailer Stage</button>
        </div>
    `;
}

export function init() {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-right');
    panel.innerHTML = render();
}
