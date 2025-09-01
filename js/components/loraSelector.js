import state from '../core/stateManager.js';

const panelId = 'panel-lora-selector';
let panel;
let fileList = [];

function buildTree(files) {
    const tree = {};
    files.forEach(file => {
        let currentLevel = tree;
        const pathParts = file.subfolder.split(/[\/]/).filter(p => p);
        
        pathParts.forEach(part => {
            if (!currentLevel[part]) currentLevel[part] = {};
            currentLevel = currentLevel[part];
        });
        if (!currentLevel._files) currentLevel._files = [];
        currentLevel._files.push(file);
    });
    return tree;
}

function renderTree(node, selectedPaths = []) {
    let html = '';
    const folders = Object.keys(node).filter(key => key !== '_files').sort();

    if (folders.length > 0) {
        html += '<ul class="folder-content active">';
        folders.forEach(key => {
            html += `<li><span class="folder"><span class="toggle-arrow">▼</span> ${key}</span>`;
            html += renderTree(node[key], selectedPaths); // Pass selectedPaths recursively
            html += '</li>';
        });
        html += '</ul>';
    }

    if (node._files && node._files.length > 0) {
        const files = node._files.sort((a, b) => b.name.localeCompare(a.name)); // Sort files descending
        html += '<ul class="folder-content active">';
        files.forEach(file => {
            const previewData = file.preview_image ? `data-preview="${file.preview_image}"` : '';
            const isSelected = selectedPaths.includes(file.path) ? ' selected' : ''; // Check if selected
            html += `<li><span class="file${isSelected}" data-path="${file.path}" data-subfolder="${file.subfolder}" ${previewData}>${file.name}</span></li>`;
        });
        html += '</ul>';
    }
    return html;
}

async function renderLoras() {
    const selectedLoras = state.getState('selectedLoras') || [];
    const tree = buildTree(fileList, selectedLoras);
    panel.querySelector('.panel-content').innerHTML = renderTree(tree, selectedLoras);
}

export async function init() {
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-right');
    panel.innerHTML = `<div class="panel-header"><h2 class="panel-title">LoRA 선택기</h2><button class="collapse-toggle"></button></div><div class="panel-content"></div>`;

    try {
        const response = await fetch('http://localhost:8001/api/models/loras');
        if (!response.ok) {
            throw new Error(`Failed to fetch LoRAs: ${response.status}`);
        }
        fileList = await response.json();
        await renderLoras();
        state.listen('selectedLoras', renderLoras);
    } catch (error) {
        console.error("Failed to fetch LoRAs:", error);
        panel.querySelector('.panel-content').innerHTML = `<p style="color: red;">LoRA를 불러오는 데 실패했습니다.</p>`;
    }
}
