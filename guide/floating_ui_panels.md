# 플로팅 UI 패널 시스템 상세 기획서

## 🎯 시스템 개요

플로팅 UI 패널 시스템은 사용자가 자유롭게 위치를 조정할 수 있는 독립적인 도구 상자들의 집합입니다. 각 패널은 특정 기능에 특화되어 있으며, 드래그, 리사이즈, 접기/펼치기가 가능합니다.

## 📋 1. Panel Manager (panelManager.js)

### 🎯 목적
모든 플로팅 패널의 생명주기와 상호작용을 통합 관리

### 🔧 핵심 구조
```javascript
class PanelManager {
    constructor() {
        this.panels = new Map();
        this.panelConfigs = new Map();
        this.layoutPresets = new Map();
        this.activeLayout = 'default';
        
        this.initializeDefaultLayouts();
        this.setupGlobalEvents();
    }

    // 패널 등록 및 초기화
    registerPanel(panelId, panelClass, config = {}) {
        const panelInstance = new panelClass(config);
        
        this.panels.set(panelId, panelInstance);
        this.panelConfigs.set(panelId, {
            id: panelId,
            title: config.title || panelId,
            position: config.defaultPosition || { x: 100, y: 100 },
            size: config.defaultSize || { width: 300, height: 400 },
            minSize: config.minSize || { width: 200, height: 200 },
            maxSize: config.maxSize || { width: 800, height: 600 },
            resizable: config.resizable !== false,
            collapsible: config.collapsible !== false,
            closable: config.closable !== false,
            visible: config.visible !== false,
            zIndex: config.zIndex || 100
        });

        this.createPanelDOM(panelId);
        this.setupPanelEvents(panelId);
        
        return panelInstance;
    }

    // 패널 DOM 생성
    createPanelDOM(panelId) {
        const config = this.panelConfigs.get(panelId);
        const panel = this.panels.get(panelId);
        
        const panelElement = document.createElement('div');
        panelElement.className = `floating-panel panel-${panelId}`;
        panelElement.setAttribute('data-panel-id', panelId);
        
        panelElement.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">${config.title}</div>
                <div class="panel-controls">
                    ${config.collapsible ? '<button class="panel-collapse">▼</button>' : ''}
                    ${config.closable ? '<button class="panel-close">✕</button>' : ''}
                </div>
            </div>
            <div class="panel-content">
                ${panel.render()}
            </div>
            ${config.resizable ? '<div class="panel-resize-handle"></div>' : ''}
        `;

        // 초기 위치 및 크기 설정
        panelElement.style.cssText = `
            position: absolute;
            left: ${config.position.x}px;
            top: ${config.position.y}px;
            width: ${config.size.width}px;
            height: ${config.size.height}px;
            z-index: ${config.zIndex};
            display: ${config.visible ? 'block' : 'none'};
        `;

        document.body.appendChild(panelElement);
        panel.setElement(panelElement);
        
        return panelElement;
    }

    // 패널 이벤트 설정
    setupPanelEvents(panelId) {
        const element = document.querySelector(`[data-panel-id="${panelId}"]`);
        const config = this.panelConfigs.get(panelId);
        
        // 드래그 기능
        this.makeDraggable(element, '.panel-header');
        
        // 리사이즈 기능
        if (config.resizable) {
            this.makeResizable(element, '.panel-resize-handle', config);
        }
        
        // 접기/펼치기
        if (config.collapsible) {
            this.setupCollapse(element);
        }
        
        // 닫기
        if (config.closable) {
            this.setupClose(element, panelId);
        }
        
        // 포커스 관리
        this.setupFocusManagement(element, panelId);
    }

    // 드래그 기능 구현
    makeDraggable(element, handleSelector) {
        const handle = element.querySelector(handleSelector);
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseInt(element.style.left) || 0;
            initialY = parseInt(element.style.top) || 0;
            
            element.style.cursor = 'grabbing';
            handle.style.cursor = 'grabbing';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newX = initialX + deltaX;
            let newY = initialY + deltaY;
            
            // 화면 경계 제한
            newX = Math.max(0, Math.min(newX, window.innerWidth - element.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - element.offsetHeight));
            
            element.style.left = newX + 'px';
            element.style.top = newY + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = '';
                handle.style.cursor = '';
                
                // 위치 저장
                this.saveLayoutState();
            }
        });
    }

    // 리사이즈 기능 구현
    makeResizable(element, handleSelector, config) {
        const handle = element.querySelector(handleSelector);
        let isResizing = false;
        let startX, startY, initialWidth, initialHeight;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            initialWidth = parseInt(element.style.width);
            initialHeight = parseInt(element.style.height);
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = initialWidth + deltaX;
            let newHeight = initialHeight + deltaY;
            
            // 최소/최대 크기 제한
            newWidth = Math.max(config.minSize.width, Math.min(newWidth, config.maxSize.width));
            newHeight = Math.max(config.minSize.height, Math.min(newHeight, config.maxSize.height));
            
            element.style.width = newWidth + 'px';
            element.style.height = newHeight + 'px';
            
            // 패널 내용 리사이즈 이벤트 발생
            const panel = this.panels.get(element.getAttribute('data-panel-id'));
            panel.onResize?.(newWidth, newHeight);
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.saveLayoutState();
            }
        });
    }
}
```

### 🔧 레이아웃 프리셋 시스템
```javascript
class LayoutPresets {
    constructor(panelManager) {
        this.panelManager = panelManager;
        
        // 기본 레이아웃들
        this.presets = {
            default: {
                'model-explorer': { x: 20, y: 80, width: 300, height: 500, visible: true },
                'adetailer-control': { x: 20, y: 600, width: 300, height: 400, visible: true },
                'prompt-presets': { x: 340, y: window.innerHeight - 250, width: 400, height: 200, visible: true },
                'lora-selector': { x: 760, y: window.innerHeight - 250, width: 400, height: 200, visible: true },
                'generation-controller': { x: window.innerWidth / 2 - 200, y: 20, width: 400, height: 120, visible: true },
                'area-capture': { x: window.innerWidth - 320, y: 80, width: 300, height: 300, visible: true },
                'multi-detailer': { x: window.innerWidth - 320, y: 400, width: 300, height: 400, visible: true }
            },
            
            compact: {
                // 작은 화면용 레이아웃
            },
            
            fullscreen: {
                // 전체화면 작업용 레이아웃
            },
            
            custom: {
                // 사용자 저장 레이아웃
            }
        };
    }

    applyLayout(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return false;

        Object.entries(preset).forEach(([panelId, config]) => {
            const element = document.querySelector(`[data-panel-id="${panelId}"]`);
            if (element) {
                element.style.left = config.x + 'px';
                element.style.top = config.y + 'px';
                element.style.width = config.width + 'px';
                element.style.height = config.height + 'px';
                element.style.display = config.visible ? 'block' : 'none';
            }
        });

        this.panelManager.activeLayout = presetName;
        return true;
    }

    saveCurrentAsCustom() {
        const customLayout = {};
        
        this.panelManager.panels.forEach((panel, panelId) => {
            const element = document.querySelector(`[data-panel-id="${panelId}"]`);
            if (element) {
                customLayout[panelId] = {
                    x: parseInt(element.style.left),
                    y: parseInt(element.style.top),
                    width: parseInt(element.style.width),
                    height: parseInt(element.style.height),
                    visible: element.style.display !== 'none'
                };
            }
        });

        this.presets.custom = customLayout;
        localStorage.setItem('t2i-custom-layout', JSON.stringify(customLayout));
    }
}
```

## 📋 2. Model Explorer Panel (modelExplorer.js)

### 🎯 목적
체크포인트, LoRA, ControlNet 등 모든 AI 모델을 탐색하고 선택

### 🔧 핵심 구조
```javascript
class ModelExplorerPanel {
    constructor(config) {
        this.models = {
            checkpoints: [],
            loras: [],
            controlnets: [],
            vaes: [],
            upscalers: []
        };
        
        this.currentCategory = 'checkpoints';
        this.searchFilter = '';
        this.typeFilter = 'all';
        this.favoriteModels = new Set();
        
        this.loadFavorites();
    }

    render() {
        return `
            <div class="model-explorer">
                <!-- 검색 및 필터 -->
                <div class="search-section">
                    <input type="text" class="search-input" placeholder="모델 검색...">
                    <select class="category-filter">
                        <option value="checkpoints">체크포인트</option>
                        <option value="loras">LoRA</option>
                        <option value="controlnets">ControlNet</option>
                        <option value="vaes">VAE</option>
                        <option value="upscalers">업스케일러</option>
                    </select>
                </div>

                <!-- 타입 필터 (체크포인트용) -->
                <div class="type-filter-section" data-category="checkpoints">
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="all">전체</button>
                        <button class="filter-btn" data-filter="sd15">SD1.5</button>
                        <button class="filter-btn" data-filter="sdxl">SDXL</button>
                        <button class="filter-btn" data-filter="ilxl">ILXL</button>
                        <button class="filter-btn" data-filter="pdxl">PDXL</button>
                    </div>
                </div>

                <!-- 모델 목록 -->
                <div class="model-list-container">
                    <div class="model-list" id="model-list">
                        <!-- 동적으로 채워짐 -->
                    </div>
                </div>

                <!-- 선택된 모델 정보 -->
                <div class="selected-model-info">
                    <div class="model-preview">
                        <img class="preview-image" src="" alt="미리보기">
                        <div class="model-details">
                            <h4 class="model-name">-</h4>
                            <p class="model-type">-</p>
                            <p class="model-size">-</p>
                        </div>
                    </div>
                    <div class="model-actions">
                        <button class="btn-favorite">★</button>
                        <button class="btn-select primary">선택</button>
                    </div>
                </div>
            </div>
        `;
    }

    // 모델 목록 렌더링
    renderModelList(models) {
        const listContainer = document.getElementById('model-list');
        
        listContainer.innerHTML = models.map(model => `
            <div class="model-item ${model.isSelected ? 'selected' : ''}" 
                 data-model-id="${model.id}"
                 data-model-type="${model.type}">
                
                <div class="model-thumbnail">
                    ${model.preview ? 
                        `<img src="${model.preview}" alt="${model.name}">` :
                        '<div class="no-preview">📷</div>'
                    }
                    ${this.favoriteModels.has(model.id) ? 
                        '<div class="favorite-badge">★</div>' : ''
                    }
                </div>
                
                <div class="model-info">
                    <div class="model-title">${model.name}</div>
                    <div class="model-meta">
                        <span class="model-base">${model.baseModel}</span>
                        <span class="model-size">${this.formatFileSize(model.size)}</span>
                    </div>
                    ${model.tags ? 
                        `<div class="model-tags">
                            ${model.tags.slice(0, 3).map(tag => 
                                `<span class="tag">${tag}</span>`
                            ).join('')}
                        </div>` : ''
                    }
                </div>
                
                <div class="model-actions-mini">
                    <button class="btn-quick-select" title="빠른 선택">✓</button>
                    <button class="btn-info" title="상세 정보">ⓘ</button>
                </div>
            </div>
        `).join('');
        
        this.setupModelItemEvents();
    }

    // 모델 아이템 이벤트 설정
    setupModelItemEvents() {
        document.querySelectorAll('.model-item').forEach(item => {
            // 모델 선택
            item.addEventListener('click', (e) => {
                if (e.target.closest('.btn-quick-select, .btn-info')) return;
                
                this.selectModel(item.getAttribute('data-model-id'));
            });
            
            // 빠른 선택 버튼
            item.querySelector('.btn-quick-select')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.quickSelectModel(item.getAttribute('data-model-id'));
            });
            
            // 상세 정보 버튼
            item.querySelector('.btn-info')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showModelDetails(item.getAttribute('data-model-id'));
            });
        });
    }

    // 검색 및 필터링
    filterModels() {
        const searchTerm = this.searchFilter.toLowerCase();
        const models = this.models[this.currentCategory] || [];
        
        let filteredModels = models.filter(model => {
            const matchesSearch = !searchTerm || 
                model.name.toLowerCase().includes(searchTerm) ||
                model.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
                
            const matchesType = this.typeFilter === 'all' || 
                model.baseModel === this.typeFilter ||
                model.subType === this.typeFilter;
                
            return matchesSearch && matchesType;
        });
        
        // 즐겨찾기 우선 정렬
        filteredModels.sort((a, b) => {
            const aFav = this.favoriteModels.has(a.id);
            const bFav = this.favoriteModels.has(b.id);
            
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            
            return a.name.localeCompare(b.name);
        });
        
        this.renderModelList(filteredModels);
    }

    // 모델 선택 처리
    selectModel(modelId) {
        const model = this.findModelById(modelId);
        if (!model) return;
        
        // 이전 선택 해제
        this.clearSelection();
        
        // 새 모델 선택
        model.isSelected = true;
        this.updateSelectedModelInfo(model);
        
        // 전역 상태 업데이트
        globalEventBus.emit('model:selected', {
            category: this.currentCategory,
            model: model
        });
    }

    // 빠른 선택 (바로 적용)
    quickSelectModel(modelId) {
        this.selectModel(modelId);
        
        // 바로 생성 파라미터에 적용
        globalEventBus.emit('model:apply', {
            category: this.currentCategory,
            model: this.findModelById(modelId)
        });
    }

    // 즐겨찾기 관리
    toggleFavorite(modelId) {
        if (this.favoriteModels.has(modelId)) {
            this.favoriteModels.delete(modelId);
        } else {
            this.favoriteModels.add(modelId);
        }
        
        this.saveFavorites();
        this.filterModels(); // 목록 새로고침
    }

    saveFavorites() {
        localStorage.setItem('t2i-favorite-models', 
            JSON.stringify(Array.from(this.favoriteModels)));
    }

    loadFavorites() {
        const saved = localStorage.getItem('t2i-favorite-models');
        if (saved) {
            this.favoriteModels = new Set(JSON.parse(saved));
        }
    }
}
```

## 📋 3. ADetailer Control Panel (adetailerControl.js)

### 🎯 목적
ADetailer(After Detailer) 시스템의 모든 파라미터를 세밀하게 제어

### 🔧 핵심 구조
```javascript
class ADetailerControlPanel {
    constructor(config) {
        this.isEnabled = false;
        this.detailerConfigs = [
            {
                id: 'face',
                enabled: true,
                model: 'face_yolov8n.pt',
                useSegm: false,
                confidence: 0.30,
                maxDetections: 10,
                padding: 32,
                prompt: 'detailed face, sharp eyes, high quality',
                negativePrompt: 'blurry, low quality, distorted',
                strength: 0.40,
                steps: 20,
                cfgScale: 7.0,
                seed: -1,
                maskBlur: 4,
                maskExpand: 0,
                inpaintArea: 'masked',
                blendMode: 'linear'
            }
        ];
        
        this.availableModels = {
            bbox: [],
            segm: []
        };
        
        this.loadAvailableModels();
    }

    render() {
        return `
            <div class="adetailer-control">
                <!-- 메인 토글 -->
                <div class="main-toggle">
                    <label class="toggle-switch">
                        <input type="checkbox" id="adetailer-enable" ${this.isEnabled ? 'checked' : ''}>
                        <span class="slider"></span>
                        <span class="label">ADetailer 활성화</span>
                    </label>
                </div>

                <!-- 디테일러 설정 탭 -->
                <div class="detailer-tabs">
                    <div class="tab-headers">
                        <button class="tab-header active" data-tab="face">얼굴</button>
                        <button class="tab-header" data-tab="hand">손</button>
                        <button class="tab-header" data-tab="person">인물</button>
                        <button class="tab-add">+</button>
                    </div>

                    <!-- 얼굴 디테일러 설정 -->
                    <div class="tab-content active" data-tab="face">
                        ${this.renderDetailerConfig(this.detailerConfigs[0])}
                    </div>

                    <!-- 손 디테일러 설정 (필요시) -->
                    <div class="tab-content" data-tab="hand" style="display: none;">
                        <!-- 동적으로 생성 -->
                    </div>
                </div>

                <!-- 프리셋 관리 -->
                <div class="preset-section">
                    <div class="preset-header">
                        <span>프리셋</span>
                        <div class="preset-actions">
                            <button class="btn-save-preset">저장</button>
                            <button class="btn-load-preset">불러오기</button>
                        </div>
                    </div>
                    <select class="preset-selector">
                        <option value="conservative">보수적 개선</option>
                        <option value="balanced">균형잡힌 개선</option>
                        <option value="aggressive">적극적 개선</option>
                        <option value="custom">커스텀</option>
                    </select>
                </div>

                <!-- 미리보기 컨트롤 -->
                <div class="preview-section">
                    <button class="btn-preview-detection">검출 미리보기</button>
                    <button class="btn-apply-now">지금 적용</button>
                </div>
            </div>
        `;
    }

    renderDetailerConfig(config) {
        return `
            <div class="detailer-config">
                <!-- 검출 설정 -->
                <div class="config-section">
                    <h4>검출 설정</h4>
                    
                    <div class="control-group">
                        <label>검출 모델</label>
                        <select class="model-selector" data-param="model">
                            ${this.availableModels.bbox.map(model => `
                                <option value="${model.fileName}" 
                                        ${config.model === model.fileName ? 'selected' : ''}>
                                    ${model.displayName}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="control-group">
                        <label>신뢰도 (${config.confidence})</label>
                        <div class="slider-container">
                            <input type="range" class="slider" 
                                   min="0.1" max="1.0" step="0.05" 
                                   value="${config.confidence}"
                                   data-param="confidence">
                            <div class="slider-track"></div>
                        </div>
                    </div>

                    <div class="control-group">
                        <label>최대 검출 수 (${config.maxDetections})</label>
                        <div class="slider-container">
                            <input type="range" class="slider"
                                   min="1" max="20" step="1"
                                   value="${config.maxDetections}"
                                   data-param="maxDetections">
                        </div>
                    </div>

                    <div class="control-group">
                        <label>패딩 (${config.padding}px)</label>
                        <div class="slider-container">
                            <input type="range" class="slider"
                                   min="16" max="128" step="8"
                                   value="${config.padding}"
                                   data-param="padding">
                        </div>
                    </div>
                </div>

                <!-- 생성 설정 -->
                <div class="config-section">
                    <h4>생성 설정</h4>
                    
                    <div class="control-group">
                        <label>디테일 프롬프트</label>
                        <textarea class="prompt-input" data-param="prompt" 
                                  rows="3" placeholder="detailed face, sharp eyes, high quality">${config.prompt}</textarea>
                    </div>

                    <div class="control-group">
                        <label>네거티브 프롬프트</label>
                        <textarea class="prompt-input" data-param="negativePrompt"
                                  rows="2" placeholder="blurry, low quality, distorted">${config.negativePrompt}</textarea>
                    </div>

                    <div class="control-row">
                        <div class="control-group half">
                            <label>강도 (${config.strength})</label>
                            <div class="slider-container">
                                <input type="range" class="slider"
                                       min="0.1" max="1.0" step="0.05"
                                       value="${config.strength}"
                                       data-param="strength">
                            </div>
                        </div>

                        <div class="control-group half">
                            <label>스텝 수 (${config.steps})</label>
                            <div class="slider-container">
                                <input type="range" class="slider"
                                       min="10" max="50" step="5"
                                       value="${config.steps}"
                                       data-param="steps">
                            </div>
                        </div>
                    </div>

                    <div class="control-row">
                        <div class="control-group half">
                            <label>CFG Scale (${config.cfgScale})</label>
                            <div class="slider-container">
                                <input type="range" class="slider"
                                       min="1.0" max="20.0" step="0.5"
                                       value="${config.cfgScale}"
                                       data-param="cfgScale">
                            </div>
                        </div>

                        <div class="control-group half">
                            <label>시드</label>
                            <div class="seed-container">
                                <input type="number" class="seed-input"
                                       value="${config.seed}"
                                       data-param="seed" placeholder="-1 (랜덤)">
                                <button class="btn-random-seed">🎲</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 마스크 및 블렌딩 -->
                <div class="config-section">
                    <h4>마스크 & 블렌딩</h4>
                    
                    <div class="control-group">
                        <label class="checkbox-label">
                            <input type="checkbox" ${config.useSegm ? 'checked' : ''} 
                                   data-param="useSegm">
                            <span>세그멘테이션 사용 (정밀 마스크)</span>
                        </label>
                    </div>

                    <div class="control-row">
                        <div class="control-group half">
                            <label>마스크 블러 (${config.maskBlur}px)</label>
                            <div class="slider-container">
                                <input type="range" class="slider"
                                       min="0" max="20" step="1"
                                       value="${config.maskBlur}"
                                       data-param="maskBlur">
                            </div>
                        </div>

                        <div class="control-group half">
                            <label>마스크 확장 (${config.maskExpand}px)</label>
                            <div class="slider-container">
                                <input type="range" class="slider"
                                       min="-16" max="32" step="2"
                                       value="${config.maskExpand}"
                                       data-param="maskExpand">
                            </div>
                        </div>
                    </div>

                    <div class="control-group">
                        <label>인페인팅 영역</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="inpaintArea" value="masked" 
                                       ${config.inpaintArea === 'masked' ? 'checked' : ''}
                                       data-param="inpaintArea">
                                <span>마스크 영역만</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="inpaintArea" value="whole"
                                       ${config.inpaintArea === 'whole' ? 'checked' : ''}
                                       data-param="inpaintArea">
                                <span>전체 이미지</span>
                            </label>
                        </div>
                    </div>

                    <div class="control-group">
                        <label>블렌딩 모드</label>
                        <select class="blend-mode-selector" data-param="blendMode">
                            <option value="linear" ${config.blendMode === 'linear' ? 'selected' : ''}>Linear</option>
                            <option value="gaussian" ${config.blendMode === 'gaussian' ? 'selected' : ''}>Gaussian</option>
                            <option value="poisson" ${config.blendMode === 'poisson' ? 'selected' : ''}>Poisson</option>
                            <option value="alpha" ${config.blendMode === 'alpha' ? 'selected' : ''}>Alpha</option>
                        </select>
                    </div>
                </div>

                <!-- 후처리 설정 -->
                <div class="config-section collapsible">
                    <h4 class="section-header">
                        후처리 설정
                        <span class="collapse-icon">▼</span>
                    </h4>
                    <div class="section-content">
                        <div class="control-group">
                            <label class="checkbox-label">
                                <input type="checkbox" checked data-param="colorCorrection">
                                <span>색상 보정</span>
                            </label>
                        </div>
                        
                        <div class="control-group">
                            <label class="checkbox-label">
                                <input type="checkbox" checked data-param="histogramMatch">
                                <span>히스토그램 매칭</span>
                            </label>
                        </div>

                        <div class="control-group">
                            <label>경계 부드럽게 (8px)</label>
                            <div class="slider-container">
                                <input type="range" class="slider"
                                       min="2" max="32" step="2" value="8"
                                       data-param="edgeFeathering">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 파라미터 변경 처리
    setupParameterEvents() {
        this.element.addEventListener('input', (e) => {
            const param = e.target.getAttribute('data-param');
            if (!param) return;
            
            const activeTab = this.element.querySelector('.tab-content.active');
            const tabType = activeTab.getAttribute('data-tab');
            const config = this.findConfigByType(tabType);
            
            let value = e.target.value;
            
            // 타입별 값 변환
            if (e.target.type === 'range' || e.target.type === 'number') {
                value = parseFloat(value);
            } else if (e.target.type === 'checkbox') {
                value = e.target.checked;
            }
            
            // 설정 업데이트
            config[param] = value;
            
            // 슬라이더 레이블 업데이트
            if (e.target.type === 'range') {
                const label = e.target.closest('.control-group').querySelector('label');
                const baseText = label.textContent.split(' (')[0];
                label.textContent = `${baseText} (${value}${this.getUnit(param)})`;
            }
            
            // 실시간 미리보기 (디바운스)
            this.schedulePreview();
        });
    }

    // 프리셋 적용
    applyPreset(presetName) {
        const presets = {
            conservative: {
                strength: 0.25,
                steps: 15,
                cfgScale: 6.0,
                confidence: 0.4,
                maskBlur: 6,
                prompt: 'subtle improvement, detailed, high quality'
            },
            balanced: {
                strength: 0.4,
                steps: 20,
                cfgScale: 7.0,
                confidence: 0.3,
                maskBlur: 4,
                prompt: 'detailed face, sharp eyes, high quality, 8k'
            },
            aggressive: {
                strength: 0.6,
                steps: 30,
                cfgScale: 8.0,
                confidence: 0.2,
                maskBlur: 2,
                prompt: 'highly detailed, perfect face, masterpiece, ultra high quality'
            }
        };
        
        const preset = presets[presetName];
        if (!preset) return;
        
        const activeConfig = this.getCurrentConfig();
        Object.assign(activeConfig, preset);
        
        this.refreshUI();
    }

    // 검출 미리보기
    async previewDetection() {
        if (!this.isEnabled) return;
        
        const activeConfig = this.getCurrentConfig();
        
        try {
            const response = await fetch('/api/adetailer/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: activeConfig.model,
                    confidence: activeConfig.confidence,
                    maxDetections: activeConfig.maxDetections,
                    padding: activeConfig.padding,
                    currentImage: this.getCurrentImageData()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.displayDetectionPreview(result.detections);
            }
        } catch (error) {
            console.error('Detection preview failed:', error);
        }
    }

    displayDetectionPreview(detections) {
        // 메인 캔버스에 검출 박스 오버레이 표시
        globalEventBus.emit('canvas:overlay', {
            type: 'detection-boxes',
            data: detections.map(det => ({
                bbox: det.bbox,
                confidence: det.confidence,
                label: det.class_name
            }))
        });
    }
}
```

이렇게 플로팅 UI 패널 시스템의 주요 컴포넌트들을 설계했습니다. 다음으로 나머지 패널들(프롬프트 프리셋, LoRA 선택기, 생성 제어기 등)을 기획하겠습니다.