let canvas;
let currentMode = 'selection';
let isDrawing = false;
let rectangle = null;
let aspectRatioConstraint = 'free';
let capturedImageData = null;

const panelId = 'panel-area-capture';
let panel;

const aspectRatios = {
    '512x512': { width: 512, height: 512 },
    '512x768': { width: 512, height: 768 },
    '768x512': { width: 768, height: 512 },
    '1024x1024': { width: 1024, height: 1024 },
    '768x1024': { width: 768, height: 1024 },
    '1024x768': { width: 1024, height: 768 }
};

function roundToMultiple(value, multiple = 8) {
    return Math.round(value / multiple) * multiple;
}

function render() {
    return `
        <div class="panel-header"><h2>영역 캡처</h2><button class="collapse-toggle">></button></div>
        <div class="panel-content">
            <div class="tool-group">
                <h4>선택 도구</h4>
                <button id="selection-tool" class="btn active">선택</button>
                <button id="rectangle-tool" class="btn">사각형</button>
            </div>
            <div class="tool-group">
                <label for="aspect-ratio">SD 비율</label>
                <select id="aspect-ratio">
                    <option value="free">자유 비율</option>
                    <option value="512x512">1:1 (512x512)</option>
                    <option value="512x768">2:3 (512x768)</option>
                    <option value="768x512">3:2 (768x512)</option>
                    <option value="1024x1024">1:1 (1024x1024)</option>
                    <option value="768x1024">3:4 (768x1024)</option>
                    <option value="1024x768">4:3 (1024x768)</option>
                </select>
            </div>
            <div class="tool-group">
                <h4>캡처 & 붙여넣기</h4>
                <button id="capture-btn" class="btn">캡처</button>
                <button id="paste-btn" class="btn" disabled>붙여넣기</button>
            </div>
            <div id="selection-info">선택된 영역: 없음</div>
            <img id="captured-preview" alt="캡처 미리보기" style="width:100%; display:none; margin-top:10px;">
        </div>
    `;
}

function setSelectionMode() {
    currentMode = 'selection';
    if(canvas) {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        clearSelectionRectangle();
    }
    updateToolButtons();
}

function setRectangleMode() {
    currentMode = 'rectangle';
    if(canvas) {
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
    }
    updateToolButtons();
}

function updateToolButtons() {
    panel.querySelector('#selection-tool').classList.toggle('active', currentMode === 'selection');
    panel.querySelector('#rectangle-tool').classList.toggle('active', currentMode === 'rectangle');
}

function updateSelectionConstraints() {
    aspectRatioConstraint = panel.querySelector('#aspect-ratio').value;
}

function updateSelectionInfo(rect) {
    const info = panel.querySelector('#selection-info');
    if (rect) {
        const width = roundToMultiple(rect.width * rect.scaleX);
        const height = roundToMultiple(rect.height * rect.scaleY);
        info.innerHTML = `X:${Math.round(rect.left)}, Y:${Math.round(rect.top)}<br>W:${width}, H:${height}`;
    } else {
        info.innerHTML = '선택된 영역: 없음';
    }
}

function clearSelectionRectangle() {
    if (rectangle) {
        canvas.remove(rectangle);
        rectangle = null;
        updateSelectionInfo(null);
    }
}

function captureSelection() {
    if (!rectangle) return alert('먼저 사각형 도구로 영역을 선택해주세요.');
    const { left, top, width, height } = rectangle;
    // 캡처 직전: 선택 사각형 숨김
    rectangle.set({ visible: false });
    canvas.renderAll();

    // 임시 캔버스 생성
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;

    // 캔버스에서 이미지 추출
    const canvasElement = canvas.getElement();
    tempCtx.drawImage(canvasElement, left, top, width, height, 0, 0, width, height);

    // Base64로 변환
    capturedImageData = tempCanvas.toDataURL('image/png');

    // 캡처 후: 선택 사각형 다시 표시
    rectangle.set({ visible: true });
    canvas.renderAll();
    const preview = panel.querySelector('#captured-preview');
    preview.src = capturedImageData;
    preview.style.display = 'block';
    panel.querySelector('#paste-btn').disabled = false;
}

function pasteToCanvas() {
    if (!capturedImageData) return;
    fabric.Image.fromURL(capturedImageData, img => {
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
    });
}

function attachEventListeners() {
    panel.querySelector('#selection-tool').addEventListener('click', setSelectionMode);
    panel.querySelector('#rectangle-tool').addEventListener('click', setRectangleMode);
    panel.querySelector('#aspect-ratio').addEventListener('change', updateSelectionConstraints);
    panel.querySelector('#capture-btn').addEventListener('click', captureSelection);
    panel.querySelector('#paste-btn').addEventListener('click', pasteToCanvas);

    canvas.on('mouse:down', o => {
        if (currentMode !== 'rectangle') return;
        const pointer = canvas.getPointer(o.e);
        isDrawing = true;
        clearSelectionRectangle();
        rectangle = new fabric.Rect({ left: pointer.x, top: pointer.y, width: 0, height: 0, fill: 'rgba(0,123,255,0.1)', stroke: '#007bff', strokeWidth: 2, selectable: false, evented: false, strokeDashArray: [5, 5] });
        canvas.add(rectangle);
    });

    canvas.on('mouse:move', o => {
        if (!isDrawing || !rectangle) return;
        const pointer = canvas.getPointer(o.e);
        let w = pointer.x - rectangle.left;
        let h = pointer.y - rectangle.top;
        if (aspectRatioConstraint !== 'free') {
            const ratio = aspectRatios[aspectRatioConstraint];
            const targetRatio = ratio.width / ratio.height;
            Math.abs(w / h) > targetRatio ? h = w / targetRatio : w = h * targetRatio;
        }
        rectangle.set({ width: Math.abs(w), height: Math.abs(h) });
        if (w < 0) rectangle.set({ left: pointer.x });
        if (h < 0) rectangle.set({ top: pointer.y });
        canvas.renderAll();
        updateSelectionInfo(rectangle);
    });

    canvas.on('mouse:up', () => { isDrawing = false; });
}

export function init(canvasInstance) {
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-right');
    panel.innerHTML = render();
    
    canvas = canvasInstance;
    if (!canvas) {
        console.error("AreaCapture: Canvas instance is not provided!");
        return;
    }
    
    attachEventListeners();
    updateToolButtons();
}
