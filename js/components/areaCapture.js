let canvas;
let currentMode = 'selection'; // Default to selection mode
let isDrawing = false;
let rectangle = null;
let aspectRatioConstraint = 'free';
let capturedImageData = null;
let isInverted = false;

const panelId = 'panel-area-capture';
let panel;

const aspectRatios = {
    '1:1': { width: 256, height: 256 },
    '3:2': { width: 384, height: 256 },
    '4:3': { width: 512, height: 384 },
    '16:9': { width: 512, height: 288 },
    '21:9': { width: 512, height: 219 }
};

function roundToMultiple(value, multiple = 8) {
    return Math.round(value / multiple) * multiple;
}

function render() {
    return `
        <div class="panel-header"><h2>영역 캡처</h2><button class="collapse-toggle">></button></div>
        <div class="panel-content">
            <div class="tool-group tool-group-horizontal">
                <button id="rectangle-tool" class="btn">영역 지정</button>
                <button id="capture-btn" class="btn">복제</button>
                <div id="selection-info">W: - H: -</div>
            </div>
            <div class="tool-group tool-group-aspect-ratio">
                
                <select id="aspect-ratio" aria-label="비율 선택">
                    <option value="free">자유 비율</option>
                    <option value="1:1">1:1</option>
                    <option value="3:2">3:2</option>
                    <option value="4:3">4:3</option>
                    <option value="16:9">16:9</option>
                    <option value="21:9">21:9</option>
                </select>
                <div class="toggle-switch">
                    <input type="checkbox" id="invert-ratio-toggle">
                    <label for="invert-ratio-toggle">역전</label>
                </div>
            </div>
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

// New toggle function
function toggleAreaDesignation() {
    if (currentMode === 'selection') {
        setRectangleMode();
    } else {
        setSelectionMode();
    }
}

function updateToolButtons() {
    // Only toggle the active state of the rectangle tool button
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
        info.innerHTML = `W: ${width} H: ${height}`;
    } else {
        info.innerHTML = 'W: - H: -';
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
    if (!rectangle) {
        alert('먼저 \'영역 지정\' 버튼을 눌러 영역을 선택해주세요.');
        return;
    }
    const { left, top, width, height } = rectangle;
    
    rectangle.set({ visible: false });
    canvas.renderAll();

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;

    const canvasElement = canvas.getElement();
    tempCtx.drawImage(canvasElement, left, top, width, height, 0, 0, width, height);

    capturedImageData = tempCanvas.toDataURL('image/png');

    rectangle.set({ visible: true });
    canvas.renderAll();

    pasteToCanvas();
}

function pasteToCanvas() {
    if (!capturedImageData) return;
    fabric.Image.fromURL(capturedImageData, img => {
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        setSelectionMode();
    });
}

function attachEventListeners() {
    // Point the single button to the toggle function
    panel.querySelector('#rectangle-tool').addEventListener('click', toggleAreaDesignation);
    panel.querySelector('#aspect-ratio').addEventListener('change', updateSelectionConstraints);
    panel.querySelector('#capture-btn').addEventListener('click', captureSelection);
    panel.querySelector('#invert-ratio-toggle').addEventListener('change', (e) => {
        isInverted = e.target.checked;
    });

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
            let targetRatio = ratio.width / ratio.height;
            if (isInverted) {
                targetRatio = 1 / targetRatio; // Invert the ratio
            }
            if (Math.abs(w / h) > targetRatio) {
                h = w / targetRatio;
            } else {
                w = h * targetRatio;
            }
        } else {
            // Apply halving for "자유비율"
            w = w * 0.5;
            h = h * 0.5;
            if (isInverted) {
                // If "자유비율" and inverted, swap width and height
                [w, h] = [h, w];
            }
        }
        rectangle.set({ width: Math.abs(w), height: Math.abs(h) });
        if (w < 0) {
            rectangle.set({ left: pointer.x });
        }
        if (h < 0) {
            rectangle.set({ top: pointer.y });
        }
        canvas.renderAll();
        updateSelectionInfo(rectangle);
    });

    canvas.on('mouse:up', () => { 
        isDrawing = false; 
    });
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
    updateToolButtons(); // Initial button state update
}
