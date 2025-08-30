import api from '../core/mockApi.js';
import state from '../core/stateManager.js';

const panelId = 'panel-lora-selector';
let panel;
let fileList = [];

function buildTree(files) { /* ... buildTree logic ... */ }
function renderTree(node) { /* ... renderTree logic ... */ }

async function renderLoras() {
    const currentBaseModel = state.getState('currentBaseModel');
    const loras = fileList.filter(f => f.type === 'loras' && (!currentBaseModel || f.baseModel === currentBaseModel));
    const tree = buildTree(loras);
    panel.querySelector('.panel-content').innerHTML = renderTree(tree);
}

export async function init() {
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-right');
    panel.innerHTML = `<div class="panel-header"><h2>LoRA 선택기</h2><button class="collapse-toggle">></button></div><div class="panel-content"></div>`;

    const { files } = await api.fetchFileList();
    fileList = files;

    await renderLoras();

    state.listen('currentBaseModel', renderLoras);
}
