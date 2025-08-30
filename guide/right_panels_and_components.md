# 우측 패널 및 UI 컴포넌트 상세 기획서

## 🎯 우측 패널 개요

우측 패널들은 고급 편집 기능과 결과물 관리를 담당하며, 전문가 워크플로우를 지원합니다.

## 📋 1. Area Capture Panel (areaCapture.js)

### 🎯 목적
캔버스의 특정 영역을 선택하고 캡처하여 정밀한 편집 작업을 지원

### 🔧 핵심 구조
```javascript
class AreaCapturePanel {
    constructor(config) {
        this.captureMode = 'rectangle'; // 'rectangle', 'lasso', 'magic-wand'
        this.capturedAreas = new Map();
        this.activeSelection = null;
        this.selectionHistory = [];
        
        // 캡처 도구 설정
        this.tools = {
            rectangle: new RectangleSelectTool(),
            lasso: new LassoSelectTool(),
            magicWand: new MagicWandTool(),
            brush: new BrushSelectTool()
        };
        
        this.setupCanvasInteraction();
    }

    render() {
        return `
            <div class="area-capture">
                <!-- 도구 선택 -->
                <div class="capture-tools">
                    <div class="tool-group">
                        <button class="tool-btn ${this.captureMode === 'rectangle' ? 'active' : ''}" 
                                data-tool="rectangle" title="사각형 선택">
                            ⬜
                        </button>
                        <button class="tool-btn ${this.captureMode === 'lasso' ? 'active' : ''}" 
                                data-tool="lasso" title="자유 선택">
                            🖉
                        </button>
                        <button class="tool-btn ${this.captureMode === 'magic-wand' ? 'active' : ''}" 
                                data-tool="magic-wand" title="색상 기반 선택">
                            🪄
                        </button>
                        <button class="tool-btn ${this.captureMode === 'brush' ? 'active' : ''}" 
                                data-tool="brush" title="브러시 선택">
                            🖌️
                        </button>
                    </div>
                </div>

                <!-- 도구별 설정 -->
                <div class="tool-settings">
                    <!-- 마법봉 도구 설정 -->
                    <div class="magic-wand-settings" 
                         style="display: ${this.captureMode === 'magic-wand' ? 'block' : 'none'};">
                        <div class="setting-group">
                            <label>허용 오차 (${this.tools.magicWand.tolerance})</label>
                            <div class="slider-container">
                                <input type="range" class="tolerance-slider" 
                                       min="0" max="100" step="1" 
                                       value="${this.tools.magicWand.tolerance}"
                                       data-setting="tolerance">
                            </div>
                        </div>
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" data-setting="antiAlias" 
                                       ${this.tools.magicWand.antiAlias ? 'checked' : ''}>
                                <span>안티 앨리어싱</span>
                            </label>
                        </div>
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" data-setting="contiguous"
                                       ${this.tools.magicWand.contiguous ? 'checked' : ''}>
                                <span>연결된 영역만</span>
                            </label>
                        </div>
                    </div>

                    <!-- 브러시 도구 설정 -->
                    <div class="brush-settings" 
                         style="display: ${this.captureMode === 'brush' ? 'block' : 'none'};">
                        <div class="setting-group">
                            <label>브러시 크기 (${this.tools.brush.size}px)</label>
                            <div class="slider-container">
                                <input type="range" class="brush-size-slider"
                                       min="1" max="100" step="1"
                                       value="${this.tools.brush.size}"
                                       data-setting="brushSize">
                            </div>
                        </div>
                        <div class="setting-group">
                            <label>브러시 경도 (${Math.round(this.tools.brush.hardness * 100)}%)</label>
                            <div class="slider-container">
                                <input type="range" class="brush-hardness-slider"
                                       min="0" max="1" step="0.1"
                                       value="${this.tools.brush.hardness}"
                                       data-setting="brushHardness">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 선택 영역 제어 -->
                <div class="selection-controls">
                    <div class="control-buttons">
                        <button class="btn-select-all">전체 선택</button>
                        <button class="btn-deselect">선택 해제</button>
                        <button class="btn-invert-selection">선택 반전</button>
                        <button class="btn-refine-edges">경계 다듬기</button>
                    </div>
                    
                    <div class="selection-operations">
                        <div class="operation-group">
                            <span>선택 영역:</span>
                            <button class="btn-expand-selection" title="확장">+</button>
                            <button class="btn-contract-selection" title="축소">-</button>
                            <button class="btn-feather-selection" title="부드럽게">~</button>
                        </div>
                    </div>
                </div>

                <!-- 캡처된 영역 목록 -->
                <div class="captured-areas">
                    <div class="areas-header">
                        <h4>캡처된 영역</h4>
                        <button class="btn-clear-all-areas" 
                                ${this.capturedAreas.size === 0 ? 'disabled' : ''}>
                            모두 지우기
                        </button>
                    </div>
                    
                    <div class="areas-list" id="captured-areas-list">
                        ${this.renderCapturedAreas()}
                    </div>
                </div>

                <!-- 캡처 액션 -->
                <div class="capture-actions">
                    <button class="btn-capture-area primary" 
                            ${!this.activeSelection ? 'disabled' : ''}>
                        영역 캡처
                    </button>
                    <button class="btn-copy-selection"
                            ${!this.activeSelection ? 'disabled' : ''}>
                        클립보드 복사
                    </button>
                    <button class="btn-save-selection"
                            ${!this.activeSelection ? 'disabled' : ''}>
                        파일로 저장
                    </button>
                </div>

                <!-- 고급 캡처 옵션 -->
                <div class="advanced-capture">
                    <div class="section-toggle">
                        <button class="toggle-advanced-capture">
                            고급 캡처 옵션 <span class="toggle-icon">▼</span>
                        </button>
                    </div>
                    
                    <div class="advanced-content" style="display: none;">
                        <div class="option-group">
                            <label class="checkbox-label">
                                <input type="checkbox" data-option="includeBackground">
                                <span>배경 포함</span>
                            </label>
                        </div>
                        
                        <div class="option-group">
                            <label class="checkbox-label">
                                <input type="checkbox" data-option="preserveTransparency">
                                <span>투명도 보존</span>
                            </label>
                        </div>
                        
                        <div class="option-group">
                            <label>출력 형식</label>
                            <select class="format-selector" data-option="format">
                                <option value="png">PNG</option>
                                <option value="jpg">JPEG</option>
                                <option value="webp">WebP</option>
                            </select>
                        </div>
                        
                        <div class="option-group">
                            <label>품질 (JPEG/WebP)</label>
                            <div class="slider-container">
                                <input type="range" class="quality-slider"
                                       min="1" max="100" step="1" value="95"
                                       data-option="quality">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCapturedAreas() {
        if (this.capturedAreas.size === 0) {
            return '<div class="no-areas">캡처된 영역이 없습니다</div>';
        }

        return Array.from(this.capturedAreas.entries()).map(([areaId, area]) => `
            <div class="captured-area-item" data-area-id="${areaId}">
                <div class="area-preview">
                    <img src="${area.thumbnail}" alt="Area ${areaId}">
                    <div class="area-overlay">
                        <button class="btn-preview-area" title="미리보기">👁️</button>
                        <button class="btn-edit-area" title="편집">✏️</button>
                    </div>
                </div>
                
                <div class="area-info">
                    <div class="area-name">${area.name || `영역 ${areaId}`}</div>
                    <div class="area-details">
                        <span>${area.width}×${area.height}</span>
                        <span>${this.formatFileSize(area.size)}</span>
                    </div>
                    <div class="area-timestamp">
                        ${this.formatTimestamp(area.capturedAt)}
                    </div>
                </div>
                
                <div class="area-actions">
                    <button class="btn-use-for-img2img" title="img2img로 사용">🔄</button>
                    <button class="btn-use-for-inpaint" title="인페인팅으로 사용">🖌️</button>
                    <button class="btn-export-area" title="내보내기">💾</button>
                    <button class="btn-delete-area" title="삭제">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    // 도구별 선택 구현
    setupCanvasInteraction() {
        const canvas = globalCanvasManager.getMainCanvas();
        
        canvas.on('mouse:down', (e) => this.handleMouseDown(e));
        canvas.on('mouse:move', (e) => this.handleMouseMove(e));
        canvas.on('mouse:up', (e) => this.handleMouseUp(e));
    }

    handleMouseDown(e) {
        const tool = this.tools[this.captureMode];
        if (tool && tool.onMouseDown) {
            tool.onMouseDown(e);
        }
    }

    // 사각형 선택 도구
    createRectangleSelection(startPoint, endPoint) {
        const rect = new fabric.Rect({
            left: Math.min(startPoint.x, endPoint.x),
            top: Math.min(startPoint.y, endPoint.y),
            width: Math.abs(endPoint.x - startPoint.x),
            height: Math.abs(endPoint.y - startPoint.y),
            fill: 'rgba(0, 123, 255, 0.1)',
            stroke: '#007bff',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            excludeFromExport: true
        });

        this.activeSelection = {
            type: 'rectangle',
            fabric: rect,
            bounds: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            },
            area: rect.width * rect.height
        };

        return rect;
    }

    // 마법봉 도구 구현
    async magicWandSelect(clickPoint, tolerance = 30) {
        const canvas = globalCanvasManager.getMainCanvas();
        const imageData = canvas.getContext().getImageData(
            0, 0, canvas.width, canvas.height
        );

        // Web Worker를 사용한 마법봉 알고리즘
        const worker = new Worker('js/workers/magicWandWorker.js');
        
        return new Promise((resolve) => {
            worker.postMessage({
                imageData: imageData,
                seedPoint: clickPoint,
                tolerance: tolerance,
                antiAlias: this.tools.magicWand.antiAlias,
                contiguous: this.tools.magicWand.contiguous
            });

            worker.onmessage = (e) => {
                const selectionMask = e.data.mask;
                this.createMaskSelection(selectionMask);
                worker.terminate();
                resolve();
            };
        });
    }

    // 영역 캡처 실행
    async captureSelectedArea() {
        if (!this.activeSelection) return null;

        const canvas = globalCanvasManager.getMainCanvas();
        const bounds = this.activeSelection.bounds;
        
        // 선택 영역을 별도 캔버스에 그리기
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = bounds.width;
        captureCanvas.height = bounds.height;
        const ctx = captureCanvas.getContext('2d');

        // 배경 포함 여부에 따라 처리
        if (this.advancedOptions.includeBackground) {
            ctx.drawImage(
                canvas.getElement(),
                bounds.x, bounds.y, bounds.width, bounds.height,
                0, 0, bounds.width, bounds.height
            );
        } else {
            // 투명 배경으로 객체들만 캡처
            await this.captureObjectsOnly(ctx, bounds);
        }

        // 캡처 결과 저장
        const captureData = {
            id: this.generateCaptureId(),
            canvas: captureCanvas,
            dataUrl: captureCanvas.toDataURL('image/png'),
            thumbnail: this.createThumbnail(captureCanvas, 64, 64),
            bounds: bounds,
            width: bounds.width,
            height: bounds.height,
            size: this.calculateImageSize(captureCanvas),
            capturedAt: Date.now(),
            name: `영역_${Date.now()}`
        };

        this.capturedAreas.set(captureData.id, captureData);
        this.updateCapturedAreasList();
        
        return captureData;
    }

    // 캡처된 영역을 다른 도구로 사용
    useForImg2Img(areaId) {
        const area = this.capturedAreas.get(areaId);
        if (!area) return;

        globalEventBus.emit('img2img:load-image', {
            imageData: area.dataUrl,
            source: 'area-capture',
            metadata: {
                originalBounds: area.bounds,
                capturedAt: area.capturedAt
            }
        });
    }

    useForInpainting(areaId) {
        const area = this.capturedAreas.get(areaId);
        if (!area) return;

        globalEventBus.emit('inpaint:load-image', {
            imageData: area.dataUrl,
            source: 'area-capture',
            maskMode: 'create-new'
        });
    }
}

// 선택 도구 클래스들
class RectangleSelectTool {
    constructor() {
        this.isSelecting = false;
        this.startPoint = null;
    }

    onMouseDown(e) {
        this.isSelecting = true;
        this.startPoint = { x: e.absolutePointer.x, y: e.absolutePointer.y };
    }

    onMouseMove(e) {
        if (!this.isSelecting) return;
        
        const currentPoint = { x: e.absolutePointer.x, y: e.absolutePointer.y };
        this.updatePreviewRect(this.startPoint, currentPoint);
    }

    onMouseUp(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        const endPoint = { x: e.absolutePointer.x, y: e.absolutePointer.y };
        this.finalizeSelection(this.startPoint, endPoint);
    }
}

class LassoSelectTool {
    constructor() {
        this.points = [];
        this.isSelecting = false;
    }

    onMouseDown(e) {
        this.isSelecting = true;
        this.points = [{ x: e.absolutePointer.x, y: e.absolutePointer.y }];
    }

    onMouseMove(e) {
        if (!this.isSelecting) return;
        
        this.points.push({ x: e.absolutePointer.x, y: e.absolutePointer.y });
        this.updateLassoPath();
    }

    onMouseUp(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.finalizeLassoSelection();
    }
}
```

## 📋 2. Multi Detailer Panel (multiDetailer.js)

### 🎯 목적
여러 디테일러 작업의 결과를 관리하고 비교하는 도구

### 🔧 핵심 구조
```javascript
class MultiDetailerPanel {
    constructor(config) {
        this.detailerResults = new Map();
        this.comparisonMode = false;
        this.selectedResults = new Set();
        this.sortBy = 'timestamp'; // 'timestamp', 'quality', 'name'
        this.filterBy = 'all'; // 'all', 'face', 'hand', 'person'
        
        this.setupEventListeners();
    }

    render() {
        return `
            <div class="multi-detailer">
                <!-- 제어 패널 -->
                <div class="detailer-controls">
                    <div class="control-group">
                        <button class="btn-comparison-mode ${this.comparisonMode ? 'active' : ''}"
                                title="비교 모드">
                            📊 비교
                        </button>
                        <button class="btn-batch-export" 
                                ${this.detailerResults.size === 0 ? 'disabled' : ''}>
                            📦 일괄 내보내기
                        </button>
                        <button class="btn-clear-results"
                                ${this.detailerResults.size === 0 ? 'disabled' : ''}>
                            🗑️ 모두 지우기
                        </button>
                    </div>

                    <div class="filter-controls">
                        <select class="filter-select" data-filter="type">
                            <option value="all">모든 타입</option>
                            <option value="face">얼굴</option>
                            <option value="hand">손</option>
                            <option value="person">인물</option>
                            <option value="custom">커스텀</option>
                        </select>
                        
                        <select class="sort-select" data-sort="method">
                            <option value="timestamp">최신순</option>
                            <option value="quality">품질순</option>
                            <option value="name">이름순</option>
                            <option value="size">크기순</option>
                        </select>
                    </div>
                </div>

                <!-- 비교 모드 UI -->
                <div class="comparison-view" ${!this.comparisonMode ? 'style="display:none;"' : ''}>
                    <div class="comparison-header">
                        <h4>디테일러 결과 비교</h4>
                        <div class="comparison-controls">
                            <button class="btn-side-by-side active">좌우 비교</button>
                            <button class="btn-overlay">오버레이</button>
                            <button class="btn-slider">슬라이더</button>
                        </div>
                    </div>
                    
                    <div class="comparison-container">
                        ${this.renderComparisonView()}
                    </div>
                    
                    <div class="comparison-metrics">
                        ${this.renderComparisonMetrics()}
                    </div>
                </div>

                <!-- 결과 목록 -->
                <div class="results-list-view" ${this.comparisonMode ? 'style="display:none;"' : ''}>
                    <div class="results-header">
                        <span>디테일러 결과 (${this.detailerResults.size})</span>
                        <div class="view-options">
                            <button class="btn-grid-view active">⊞</button>
                            <button class="btn-list-view">☰</button>
                        </div>
                    </div>
                    
                    <div class="results-container">
                        <div class="results-grid" id="detailer-results">
                            ${this.renderDetailerResults()}
                        </div>
                    </div>
                </div>

                <!-- 결과 상세 정보 -->
                <div class="result-details" id="result-details" style="display: none;">
                    <!-- 선택된 결과의 상세 정보 -->
                </div>
            </div>
        `;
    }

    renderDetailerResults() {
        const filteredResults = this.getFilteredResults();
        
        if (filteredResults.length === 0) {
            return '<div class="no-results">디테일러 결과가 없습니다</div>';
        }

        return filteredResults.map(result => `
            <div class="detailer-result-item ${this.selectedResults.has(result.id) ? 'selected' : ''}" 
                 data-result-id="${result.id}">
                
                <div class="result-preview">
                    <img src="${result.thumbnail}" alt="${result.name}">
                    
                    <!-- 원본과 결과 비교 슬라이더 -->
                    <div class="preview-overlay">
                        <div class="before-after-slider" data-result-id="${result.id}">
                            <div class="slider-handle"></div>
                        </div>
                    </div>
                    
                    <!-- 결과 메타데이터 오버레이 -->
                    <div class="result-metadata">
                        <div class="detection-count">${result.detectionsCount}개 검출</div>
                        <div class="improvement-score">개선도: ${result.improvementScore}%</div>
                    </div>
                </div>

                <div class="result-info">
                    <div class="result-header">
                        <div class="result-name">${result.name}</div>
                        <div class="result-type-badge type-${result.type}">${result.type}</div>
                    </div>
                    
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">크기:</span>
                            <span class="stat-value">${result.width}×${result.height}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">시간:</span>
                            <span class="stat-value">${result.processingTime}초</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">품질:</span>
                            <span class="stat-value">${result.qualityScore}/100</span>
                        </div>
                    </div>

                    <div class="detailer-params">
                        <div class="param-summary">
                            강도: ${result.parameters.strength} | 
                            스텝: ${result.parameters.steps} |
                            모델: ${result.parameters.model}
                        </div>
                    </div>

                    <div class="result-timestamp">
                        ${this.formatTimestamp(result.createdAt)}
                    </div>
                </div>

                <div class="result-actions">
                    <div class="action-row">
                        <button class="btn-compare" title="비교 추가" 
                                ${this.selectedResults.has(result.id) ? 'disabled' : ''}>
                            📊
                        </button>
                        <button class="btn-apply" title="캔버스에 적용">✓</button>
                        <button class="btn-export" title="내보내기">💾</button>
                        <button class="btn-details" title="상세 정보">ⓘ</button>
                    </div>
                    <div class="action-row">
                        <button class="btn-retry" title="다시 실행">🔄</button>
                        <button class="btn-favorite ${result.isFavorite ? 'active' : ''}" title="즐겨찾기">★</button>
                        <button class="btn-delete" title="삭제">🗑️</button>
                    </div>
                </div>

                <!-- 선택 체크박스 (비교 모드용) -->
                <div class="selection-checkbox" ${!this.comparisonMode ? 'style="display:none;"' : ''}>
                    <input type="checkbox" ${this.selectedResults.has(result.id) ? 'checked' : ''}
                           data-result-id="${result.id}">
                </div>
            </div>
        `).join('');
    }

    renderComparisonView() {
        const selectedResults = Array.from(this.selectedResults)
            .map(id => this.detailerResults.get(id))
            .filter(Boolean);

        if (selectedResults.length < 2) {
            return `
                <div class="comparison-placeholder">
                    <p>비교할 결과를 2개 이상 선택해주세요</p>
                    <p>현재 선택: ${selectedResults.length}개</p>
                </div>
            `;
        }

        return `
            <div class="comparison-grid">
                ${selectedResults.map((result, index) => `
                    <div class="comparison-item" data-result-id="${result.id}">
                        <div class="comparison-header">
                            <span class="item-label">${String.fromCharCode(65 + index)}</span>
                            <span class="item-name">${result.name}</span>
                        </div>
                        
                        <div class="comparison-image-container">
                            <img src="${result.resultImage}" alt="${result.name}">
                            
                            <!-- 원본 오버레이 토글 -->
                            <div class="original-overlay" style="display: none;">
                                <img src="${result.originalImage}" alt="원본">
                            </div>
                            
                            <button class="btn-toggle-original">원본 보기</button>
                        </div>
                        
                        <div class="comparison-metrics">
                            <div class="metric">
                                <span class="metric-label">품질:</span>
                                <span class="metric-value">${result.qualityScore}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">개선도:</span>
                                <span class="metric-value">${result.improvementScore}%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">시간:</span>
                                <span class="metric-value">${result.processingTime}초</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderComparisonMetrics() {
        const selectedResults = Array.from(this.selectedResults)
            .map(id => this.detailerResults.get(id))
            .filter(Boolean);

        if (selectedResults.length < 2) return '';

        const metrics = this.calculateComparisonMetrics(selectedResults);

        return `
            <div class="metrics-comparison">
                <h5>비교 분석</h5>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-title">최고 품질</div>
                        <div class="metric-winner">${metrics.bestQuality.name}</div>
                        <div class="metric-score">${metrics.bestQuality.score}/100</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">최대 개선</div>
                        <div class="metric-winner">${metrics.bestImprovement.name}</div>
                        <div class="metric-score">+${metrics.bestImprovement.score}%</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">최고 속도</div>
                        <div class="metric-winner">${metrics.fastest.name}</div>
                        <div class="metric-score">${metrics.fastest.time}초</div>
                    </div>
                </div>

                <div class="recommendations">
                    <h6>추천</h6>
                    <div class="recommendation-list">
                        ${metrics.recommendations.map(rec => `
                            <div class="recommendation-item">
                                <span class="rec-icon">${rec.icon}</span>
                                <span class="rec-text">${rec.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 디테일러 결과 처리
    addDetailerResult(resultData) {
        const result = {
            id: this.generateResultId(),
            name: resultData.name || `디테일러_${Date.now()}`,
            type: resultData.type || 'face',
            originalImage: resultData.originalImage,
            resultImage: resultData.resultImage,
            thumbnail: this.createThumbnail(resultData.resultImage),
            width: resultData.width,
            height: resultData.height,
            detectionsCount: resultData.detections?.length || 0,
            parameters: resultData.parameters,
            processingTime: resultData.processingTime || 0,
            qualityScore: this.calculateQualityScore(resultData),
            improvementScore: this.calculateImprovementScore(resultData),
            createdAt: Date.now(),
            isFavorite: false,
            metadata: resultData.metadata || {}
        };

        this.detailerResults.set(result.id, result);
        this.updateResultsList();
        
        return result.id;
    }

    // 품질 점수 계산 (가상의 알고리즘)
    calculateQualityScore(resultData) {
        // 실제로는 PSNR, SSIM 등의 이미지 품질 지표를 사용
        let score = 75; // 기본 점수

        // 해상도 보너스
        const pixels = resultData.width * resultData.height;
        if (pixels > 512 * 512) score += 5;
        if (pixels > 1024 * 1024) score += 5;

        // 검출 정확도 보너스
        if (resultData.detections && resultData.detections.length > 0) {
            const avgConfidence = resultData.detections.reduce(
                (sum, det) => sum + det.confidence, 0
            ) / resultData.detections.length;
            score += Math.round(avgConfidence * 20);
        }

        // 처리 시간 패널티 (너무 오래 걸리면 감점)
        if (resultData.processingTime > 60) score -= 10;
        if (resultData.processingTime > 120) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    // 개선 정도 계산
    calculateImprovementScore(resultData) {
        // 실제로는 원본과 결과 이미지의 feature 비교
        // 여기서는 파라미터 기반 추정
        let improvement = 0;

        const strength = resultData.parameters?.strength || 0.4;
        improvement += strength * 50; // 강도에 비례

        const steps = resultData.parameters?.steps || 20;
        improvement += (steps / 50) * 20; // 스텝 수 고려

        if (resultData.detectionsCount > 0) {
            improvement += resultData.detectionsCount * 5; // 검출 수 보너스
        }

        return Math.max(0, Math.min(100, Math.round(improvement)));
    }

    // 비교 메트릭 계산
    calculateComparisonMetrics(results) {
        const bestQuality = results.reduce((best, current) => 
            current.qualityScore > best.qualityScore ? current : best
        );

        const bestImprovement = results.reduce((best, current) =>
            current.improvementScore > best.improvementScore ? current : best
        );

        const fastest = results.reduce((fastest, current) =>
            current.processingTime < fastest.processingTime ? current : fastest
        );

        // 추천 생성
        const recommendations = [];
        
        if (bestQuality.qualityScore > 90) {
            recommendations.push({
                icon: '🏆',
                text: `${bestQuality.name}이 가장 높은 품질을 보여줍니다`
            });
        }

        if (bestImprovement.improvementScore > 70) {
            recommendations.push({
                icon: '⬆️',
                text: `${bestImprovement.name}이 가장 큰 개선 효과를 보였습니다`
            });
        }

        if (fastest.processingTime < 30) {
            recommendations.push({
                icon: '⚡',
                text: `${fastest.name}이 가장 빠른 처리 속도를 보였습니다`
            });
        }

        return {
            bestQuality: {
                name: bestQuality.name,
                score: bestQuality.qualityScore
            },
            bestImprovement: {
                name: bestImprovement.name,
                score: bestImprovement.improvementScore
            },
            fastest: {
                name: fastest.name,
                time: fastest.processingTime
            },
            recommendations
        };
    }

    // 결과를 캔버스에 적용
    applyResultToCanvas(resultId) {
        const result = this.detailerResults.get(resultId);
        if (!result) return;

        globalEventBus.emit('canvas:apply-detailer-result', {
            resultImage: result.resultImage,
            originalBounds: result.metadata.originalBounds,
            blendMode: 'normal',
            opacity: 1.0
        });
    }

    // 일괄 내보내기
    async batchExport() {
        const selectedIds = Array.from(this.selectedResults);
        if (selectedIds.length === 0) {
            alert('내보낼 결과를 선택해주세요.');
            return;
        }

        const exportOptions = await this.showExportDialog();
        if (!exportOptions) return;

        for (const resultId of selectedIds) {
            const result = this.detailerResults.get(resultId);
            if (result) {
                await this.exportSingleResult(result, exportOptions);
            }
        }
    }

    showExportDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal export-dialog-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>일괄 내보내기</h3>
                        <button class="btn-close-modal">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="export-options">
                            <div class="option-group">
                                <label>내보낼 내용</label>
                                <div class="checkbox-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" checked data-option="result">
                                        <span>결과 이미지</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" data-option="original">
                                        <span>원본 이미지</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" data-option="comparison">
                                        <span>비교 이미지</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" data-option="metadata">
                                        <span>메타데이터 (JSON)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="option-group">
                                <label>파일 형식</label>
                                <select class="format-select">
                                    <option value="png">PNG</option>
                                    <option value="jpg">JPEG</option>
                                    <option value="webp">WebP</option>
                                </select>
                            </div>
                            
                            <div class="option-group">
                                <label>파일명 규칙</label>
                                <select class="naming-select">
                                    <option value="original">원본 이름 유지</option>
                                    <option value="timestamp">타임스탬프</option>
                                    <option value="sequential">순번</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-cancel">취소</button>
                        <button class="btn-export primary">내보내기</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            
            // 모달 이벤트 처리...
        });
    }
}
```

## 📋 3. 공통 UI 컴포넌트들

### 🔧 Slider Component (slider.js)
```javascript
class EnhancedSlider {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            min: options.min || 0,
            max: options.max || 100,
            step: options.step || 1,
            value: options.value || 0,
            unit: options.unit || '',
            presets: options.presets || [],
            logarithmic: options.logarithmic || false,
            showTooltip: options.showTooltip !== false,
            showPresets: options.showPresets !== false,
            ...options
        };
        
        this.init();
    }

    init() {
        this.element.classList.add('enhanced-slider');
        
        const sliderHTML = `
            <div class="slider-container">
                <div class="slider-track">
                    <div class="slider-fill"></div>
                    <div class="slider-handle" tabindex="0"></div>
                </div>
                
                ${this.options.showPresets ? `
                    <div class="slider-presets">
                        ${this.options.presets.map(preset => `
                            <button class="preset-btn" data-value="${preset.value}">
                                ${preset.label || preset.value}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${this.options.showTooltip ? `
                    <div class="slider-tooltip">${this.formatValue(this.options.value)}</div>
                ` : ''}
            </div>
        `;
        
        this.element.innerHTML = sliderHTML;
        this.setupEvents();
        this.updateUI();
    }

    formatValue(value) {
        return `${value}${this.options.unit}`;
    }
}
```

### 🔧 Dropdown Component (dropdown.js)
```javascript
class SmartDropdown {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            searchable: options.searchable || false,
            multiSelect: options.multiSelect || false,
            placeholder: options.placeholder || '선택하세요',
            items: options.items || [],
            ...options
        };
        
        this.isOpen = false;
        this.selectedItems = new Set();
        this.filteredItems = [...this.options.items];
        
        this.init();
    }

    init() {
        this.element.classList.add('smart-dropdown');
        
        const dropdownHTML = `
            <div class="dropdown-trigger">
                <span class="dropdown-text">${this.options.placeholder}</span>
                <span class="dropdown-arrow">▼</span>
            </div>
            
            <div class="dropdown-menu">
                ${this.options.searchable ? `
                    <div class="dropdown-search">
                        <input type="text" placeholder="검색...">
                    </div>
                ` : ''}
                
                <div class="dropdown-items">
                    ${this.renderItems()}
                </div>
            </div>
        `;
        
        this.element.innerHTML = dropdownHTML;
        this.setupEvents();
    }
}
```

이렇게 모든 프론트엔드 모듈들의 상세 기획서가 완성되었습니다. 각 모듈은 독립적으로 동작하면서도 서로 긴밀하게 연동되는 구조로 설계되어 전문가 수준의 T2I 애플리케이션을 구현할 수 있습니다.