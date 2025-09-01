import state from '../core/stateManager.js?v=20250901';

const panelId = 'panel-lora-selector';
let panel;
let fileList = [];

function buildTree(files) {
    const tree = {};
    files.forEach(file => {
        let currentLevel = tree;
        // Handle undefined or null subfolder
        const subfolder = file.subfolder || '';
        const pathParts = subfolder.split(/[\/]/).filter(p => p); // Using / and \ for cross-platform paths

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

function renderLoras() {
    let selectedLoras = state.getState('selectedLoras') || [];
    
    // Ensure selectedLoras is always an array
    if (!Array.isArray(selectedLoras)) {
        if (typeof selectedLoras === 'string') {
            selectedLoras = [selectedLoras];
        } else {
            selectedLoras = [];
        }
        // Update state to be consistent
        state.setState('selectedLoras', selectedLoras);
    }
    
    const tree = buildTree(fileList);
    const panelContent = panel.querySelector('.panel-content');
    panelContent.innerHTML = renderTree(tree, selectedLoras);
    addEventListenersToLoras(panelContent);
}

function addEventListenersToLoras(panelContent) {
    let activeTooltip = null;

    // Add event listeners for preview tooltips
    panelContent.addEventListener('mouseover', e => {
        if (e.target.classList.contains('file')) {
            if (activeTooltip) activeTooltip.remove();

            activeTooltip = document.createElement('div');
            activeTooltip.className = 'model-tooltip';
            const filename = e.target.textContent;
            const previewSrc = e.target.dataset.preview;
            
            if (previewSrc) {
                activeTooltip.innerHTML = `
                    <div class="tooltip-filename">${filename}</div>
                    <img src="${previewSrc}" alt="Preview">
                `;
            } else {
                activeTooltip.innerHTML = `
                    <div class="tooltip-filename">${filename}</div>
                    <div style="padding: 20px; text-align: center; color: #9aa0a6; font-size: 12px;">NO Preview</div>
                `;
            }
            document.body.appendChild(activeTooltip);

            // Get actual tooltip dimensions after adding to DOM
            const tooltipRect = activeTooltip.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width || 300; // Fallback to 300 if not measurable
            const tooltipHeight = tooltipRect.height || 150; // Fallback to 150 if not measurable
            
            // Position tooltip so its bottom-right corner is at mouse cursor's top-left
            let left = e.pageX - tooltipWidth - 10; // Additional offset for cursor gap
            let top = e.pageY - tooltipHeight - 10; // Additional offset for cursor gap
            
            // Ensure tooltip doesn't go off screen
            if (left < 10) left = e.pageX + 15; // Fall back to right side if too far left
            if (top < 10) top = e.pageY + 15; // Fall back to bottom if too far up
            
            activeTooltip.style.left = `${left}px`;
            activeTooltip.style.top = `${top}px`;
        }
    });

    panelContent.addEventListener('mousemove', e => {
        if (activeTooltip) {
            // Keep tooltip's bottom-right corner at mouse cursor's top-left during movement
            const tooltipRect = activeTooltip.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width || 300; // Use actual width
            const tooltipHeight = tooltipRect.height || 150; // Use actual height
            
            let left = e.pageX - tooltipWidth - 10; // Additional offset for cursor gap
            let top = e.pageY - tooltipHeight - 10; // Additional offset for cursor gap
            
            // Ensure tooltip doesn't go off screen
            if (left < 10) left = e.pageX + 15; // Fall back to right side if too far left
            if (top < 10) top = e.pageY + 15; // Fall back to bottom if too far up
            
            activeTooltip.style.left = `${left}px`;
            activeTooltip.style.top = `${top}px`;
        }
    });

    panelContent.addEventListener('mouseout', e => {
        if (e.target.classList.contains('file') && activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    });

    // Add event listeners for file selection
    panelContent.addEventListener('click', (event) => {
        if (event.target.classList.contains('file')) {
            event.preventDefault();
            event.stopPropagation();
            
            const filePath = event.target.dataset.path;
            if (!filePath) return;
            
            let selectedLoras = state.getState('selectedLoras') || [];
            
            // Ensure selectedLoras is always an array
            if (!Array.isArray(selectedLoras)) {
                if (typeof selectedLoras === 'string') {
                    selectedLoras = [selectedLoras];
                } else {
                    selectedLoras = [];
                }
            }

            if (selectedLoras.includes(filePath)) {
                // Deselect - remove from array
                selectedLoras = selectedLoras.filter(path => path !== filePath);
            } else {
                // Select - add to array
                selectedLoras = [...selectedLoras, filePath];
            }
            
            // Update state
            state.setState('selectedLoras', selectedLoras);
        }
    });

    // Add event listeners for folder toggling
    panelContent.querySelectorAll('.folder').forEach(folderElement => {
        folderElement.addEventListener('click', (event) => {
            const folderContent = event.target.nextElementSibling; // The ul.folder-content
            if (folderContent) {
                folderContent.classList.toggle('active');
                const toggleArrow = event.target.querySelector('.toggle-arrow');
                if (toggleArrow) {
                    toggleArrow.textContent = folderContent.classList.contains('active') ? '▼' : '▶';
                }
            }
        });
    });
}

function updateVisualSelection(selectedLoras) {
    if (!Array.isArray(selectedLoras)) {
        selectedLoras = [];
    }
    
    const panelContent = panel.querySelector('.panel-content');
    if (!panelContent) return;
    
    // Update visual selection for all file elements
    panelContent.querySelectorAll('.file').forEach(fileElement => {
        const filePath = fileElement.dataset.path;
        if (selectedLoras.includes(filePath)) {
            fileElement.classList.add('selected');
        } else {
            fileElement.classList.remove('selected');
        }
    });
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
        // Initialize empty selectedLoras if not exists
        if (!state.getState('selectedLoras')) {
            state.setState('selectedLoras', []);
        }
        await renderLoras();
        matchPanelHeights(); // Call the new function here
        
        // Listen to state changes but avoid infinite loops
        state.listen('selectedLoras', (newSelectedLoras) => {
            updateVisualSelection(newSelectedLoras);
        });
    } catch (error) {
        console.error("Failed to fetch LoRAs:", error);
        panel.querySelector('.panel-content').innerHTML = `<p style="color: red;">LoRA를 불러오는 데 실패했습니다.</p>`;
    }
}

function matchPanelHeights() {
    const promptPanel = document.getElementById('panel-prompt');
    const loraPanel = document.getElementById('panel-lora-selector');

    if (promptPanel && loraPanel) {
        const promptPanelHeight = promptPanel.offsetHeight;
        loraPanel.style.height = `${promptPanelHeight}px`;
        loraPanel.style.bottom = `20px`; // Align bottom with prompt panel
        loraPanel.style.top = `auto`; // Remove top constraint
    }
}