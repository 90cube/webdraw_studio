import state from '../core/stateManager.js?v=20250901';

const panelId = 'panel-model-explorer';
let panel;
let checkpointList = [];
let vaeList = [];

// 파일 리스트를 계층적 트리 구조로 변환
function buildTree(files, selectedPaths = []) {
    const tree = {};
    files.forEach(file => {
        let currentLevel = tree;

        // Determine the primary category (SDXL or sd15) based on the FIRST subdirectory
        let primaryCategory = null;
        const subfolderParts = file.subfolder.split(/[\/]/).filter(p => p);
        if (subfolderParts.length > 0) {
            const firstPart = subfolderParts[0].toLowerCase();
            if (firstPart === 'sd15') {
                primaryCategory = 'sd15';
            } else if (firstPart === 'sdxl' || firstPart === 'ilxl') { // Explicitly map ILXL to SDXL
                primaryCategory = 'sdxl'; // Changed to lowercase 'sdxl'
            }
        }

        // If a primary category is determined, create that as the first level
        if (primaryCategory) {
            if (!currentLevel[primaryCategory]) {
                currentLevel[primaryCategory] = {};
            }
            currentLevel = currentLevel[primaryCategory];
        } else {
            // If no primary category (e.g., model directly in checkpoints root), put it under "기타" (Misc)
            if (!currentLevel['기타']) {
                currentLevel['기타'] = {};
            }
            currentLevel = currentLevel['기타'];
        }

        // Now, add the remaining subfolders from the original path, starting from the second part
        let startIndex = 0;
        if (subfolderParts.length > 0 && primaryCategory) {
            const firstOriginalPartLower = subfolderParts[0].toLowerCase();
            if (firstOriginalPartLower === primaryCategory.toLowerCase() || (firstOriginalPartLower === 'ilxl' && primaryCategory === 'sdxl')) {
                startIndex = 1;
            }
        }

        for (let i = startIndex; i < subfolderParts.length; i++) {
            const part = subfolderParts[i];
            if (!currentLevel[part]) {
                currentLevel[part] = {};
            }
            currentLevel = currentLevel[part];
        }

        if (!currentLevel._files) currentLevel._files = [];
        currentLevel._files.push(file);
    });
    return tree;
}

// 트리 구조를 HTML (ul/li)로 렌더링
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

async function renderCheckpoints() {
    const tree = buildTree(checkpointList);
    panel.querySelector('#checkpoints-content').innerHTML = renderTree(tree);
}

async function renderVaes() {
    const currentBaseModel = state.getState('currentBaseModel');
    let filteredVaes = vaeList;

    if (currentBaseModel) {
        // Filter VAEs by checking if their path contains the base model keyword (e.g., 'sdxl', 'sd15')
        filteredVaes = vaeList.filter(vae => vae.path.toLowerCase().includes(currentBaseModel));
    }

    if (filteredVaes.length === 0) {
        panel.querySelector('#vae-content').innerHTML = "<p>호환되는 VAE가 없습니다.</p>";
        return;
    }

    const tree = buildTree(filteredVaes);
    panel.querySelector('#vae-content').innerHTML = renderTree(tree);
}

// New: Render LoRAs


function attachEventListeners() {
    panel.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            panel.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
            button.classList.add('active');
            panel.querySelector(`#${button.dataset.tab}-content`).classList.add('active');
        });
    });

    const checkpointsContent = panel.querySelector('#checkpoints-content');
    let activeTooltip = null;

    checkpointsContent.addEventListener('mouseover', e => {
        if (e.target.classList.contains('file') && e.target.dataset.preview) {
            if (activeTooltip) activeTooltip.remove();

            activeTooltip = document.createElement('div');
            activeTooltip.className = 'model-tooltip';
            const filename = e.target.textContent;
            const previewSrc = e.target.dataset.preview;
            activeTooltip.innerHTML = `
                <div class="tooltip-filename">${filename}</div>
                <img src="${previewSrc}" alt="Preview">
            `;
            document.body.appendChild(activeTooltip);

            activeTooltip.style.left = `${e.pageX + 15}px`;
            activeTooltip.style.top = `${e.pageY + 15}px`;
        }
    });

    checkpointsContent.addEventListener('mousemove', e => {
        if (activeTooltip) {
            activeTooltip.style.left = `${e.pageX + 15}px`;
            activeTooltip.style.top = `${e.pageY + 15}px`;
        }
    });

    checkpointsContent.addEventListener('mouseout', e => {
        if (e.target.classList.contains('file') && activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    });

    checkpointsContent.addEventListener('click', e => {
        if (e.target.classList.contains('file')) {
            const subfolder = e.target.dataset.subfolder;
            const subfolderParts = subfolder.split(/[\/]/).filter(p => p);
            let baseModel = null;
            if (subfolderParts.length > 0) {
                const firstPart = subfolderParts[0].toLowerCase();
                if (firstPart === 'sd15') {
                    baseModel = 'sd15';
                } else if (firstPart === 'sdxl' || firstPart === 'ilxl') { // Explicitly map ILXL to SDXL
                    baseModel = 'sdxl'; // Changed to lowercase 'sdxl'
                }
            }
            state.setState('currentBaseModel', baseModel);
        }
        if (e.target.classList.contains('folder')) {
            const folderSpan = e.target;
            const toggleArrow = folderSpan.querySelector('.toggle-arrow');
            const ul = folderSpan.nextElementSibling;

            if (ul && ul.classList.contains('folder-content')) {
                ul.classList.toggle('collapsed');
                toggleArrow.textContent = ul.classList.contains('collapsed') ? '▶' : '▼';
            }
        }
    });

    }

export async function init() {
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-left');
    panel.innerHTML = `
        <div class="panel-header"><h2 class="panel-title">모델 탐색기</h2><button class="collapse-toggle"></button></div>
        <div class="panel-content">
            <div class="tab-nav">
                <button class="tab-btn active" data-tab="checkpoints">Checkpoints</button>
                                <button class="tab-btn" data-tab="vae">VAE</button>
            </div>
            <div class="tab-content">
                <div id="checkpoints-content" class="tab-pane active"></div>
                <div id="vae-content" class="tab-pane"></div> <!-- New LoRA Pane -->
            </div>
        </div>
    `;
    attachEventListeners();

    try {
        const [checkpointsRes, vaesRes] = await Promise.all([
            fetch('http://localhost:8001/api/models/checkpoints'),
            fetch('http://localhost:8001/api/models/vaes')
        ]);

        if (!checkpointsRes.ok) throw new Error(`Failed to fetch checkpoints: ${checkpointsRes.status}`);
        if (!vaesRes.ok) throw new Error(`Failed to fetch VAEs: ${vaesRes.status}`);

        checkpointList = await checkpointsRes.json();
        vaeList = await vaesRes.json();
        
        await renderCheckpoints();
        await renderVaes();

                state.listen('currentBaseModel', renderVaes); // New: Listen for LoRA selection changes
    } catch (error) {
        console.error("Failed to fetch models:", error);
        panel.querySelector('#checkpoints-content').innerHTML = `<p style="color: red;">모델을 불러오는 데 실패했습니다.</p>`;
    }
}