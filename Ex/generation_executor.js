import state from '../core/stateManager.js';

// app.js에서 초기화 시 주입될 캔버스 인스턴스
let mainCanvas = null;

const panelId = 'panel-generation-executor';
let panel;
let websocket = null;
let sessionId = null;
let isExecuting = false;

// UI 요소들을 한 곳에서 관리
const ui = {
    generateBtn: null,
    stopBtn: null,
    pipelineDisplay: null,
};

/**
 * WebSocket 연결 설정 및 관리
 */
function setupWebSocket() {
    const wsUrl = "ws://localhost:8001/ws"; // 백엔드 WebSocket 주소
    
    try {
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
            console.log('🔗 WebSocket 연결됨');
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            websocket.send(JSON.stringify({ type: 'register', data: { session_id: sessionId } }));
            // TODO: UI에 연결 상태 표시
        };

        websocket.onmessage = (event) => {
            handleWebSocketMessage(JSON.parse(event.data));
        };

        websocket.onclose = () => {
            console.log('🔌 WebSocket 연결 끊어짐');
            websocket = null;
            // TODO: 재연결 로직
        };

        websocket.onerror = (error) => {
            console.error('❌ WebSocket 오류:', error);
            websocket = null;
            // TODO: UI에 오류 상태 표시
        };

    } catch (error) {
        console.error('❌ WebSocket 연결 실패:', error);
    }
}


/**
 * UI 상태를 바탕으로 작업 목록 JSON 생성
 */
function buildTaskList() {
    const taskList = [];
    
    // 1. 기본 이미지 생성 작업 (t2i 또는 i2i)
    const baseTask = createBaseGenerationTask();
    taskList.push(baseTask);

    // TODO: 2. 업스케일러 작업 (활성화된 경우)
    
    // TODO: 3. 다중 디테일러 작업들 (활성화된 각 단계)

    return {
        task_list: taskList,
        session_id: sessionId,
    };
}

/**
 * 기본 생성 작업 생성 (t2i/i2i 감지)
 */
function createBaseGenerationTask() {
    const activeObject = mainCanvas.getActiveObject();
    const isI2I = activeObject && activeObject.imageMode === 'image';

    const params = {
        checkpoint: state.getState('currentCheckpoint'),
        vae: state.getState('currentVae'),
        positive_prompt: document.getElementById('positive-prompt').value,
        negative_prompt: document.getElementById('negative-prompt').value,
        width: parseInt(document.getElementById('param-width').value),
        height: parseInt(document.getElementById('param-height').value),
        steps: state.getState('currentSteps'),
        sampler: document.getElementById('param-sampler').value,
        scheduler: document.getElementById('param-scheduler').value,
        seed: state.getState('fixedSeed') ? state.getState('currentSeed') : -1,
        cfg_scale: state.getState('currentCFG'),
        loras: state.getState('selectedLoras')?.map(loraPath => ({ path: loraPath, weight: 1.0 })) || []
    };

    if (isI2I) {
        // I2I 모드
        return {
            name: "generate_i2i",
            params: {
                ...params,
                image_b64: getObjectAsBase64(activeObject),
                denoise_strength: state.getState('currentDenoise'),
            }
        };
    } else {
        // T2I 모드
        return {
            name: "generate_t2i",
            params: {
                ...params,
            }
        };
    }
}

/**
 * Fabric 객체를 Base64 문자열로 변환
 */
function getObjectAsBase64(fabricObject) {
    if (!fabricObject) return null;
    return fabricObject.toDataURL({ format: 'png' });
}


/**
 * WebSocket 메시지 처리
 */
function handleWebSocketMessage(message) {
    const { type, data } = message;

    switch (type) {
        case 'task_started':
            ui.pipelineDisplay.textContent = `실행 중: ${data.task_name} (${data.task_index + 1}/${data.total_tasks})`;
            break;
        case 'task_progress':
            console.log(`Progress: ${data.task_name} - ${data.progress}%`);
            break;
        case 'task_completed':
            console.log(`Task completed: ${data.task_name}`);
            if (data.result_image) {
                addBase64ImageToCanvas(data.result_image);
            }
            break;
        case 'workflow_completed':
            isExecuting = false;
            updateUIState();
            console.log('🎉 워크플로우 완료');
            break;
        case 'error':
            isExecuting = false;
            updateUIState();
            alert(`오류 발생: ${data.message}`);
            ui.pipelineDisplay.textContent = `오류: ${data.message}`;
            break;
        default:
            console.log('📨 알 수 없는 메시지:', message);
    }
}

/**
 * Base64 이미지를 캔버스에 추가
 */
function addBase64ImageToCanvas(base64Data) {
    const dataUrl = `data:image/png;base64,${base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data}`;
    fabric.Image.fromURL(dataUrl, (img) => {
        img.set({
            left: 100,
            top: 100,
            selectable: true,
            imageMode: 'image',
        });
        mainCanvas.add(img);
        mainCanvas.setActiveObject(img);
        mainCanvas.renderAll();
    });
}


/**
 * 생성 실행 로직
 */
function executeGeneration() {
    if (isExecuting) return;
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        alert("백엔드 서버에 연결되지 않았습니다.");
        return;
    }

    const taskListPayload = buildTaskList();
    console.log('🚀 생성 요청 전송:', taskListPayload);
    
    isExecuting = true;
    updateUIState();
    
    websocket.send(JSON.stringify({
        type: 'execute_workflow',
        data: taskListPayload
    }));
}

/**
 * 생성 중지 로직
 */
function stopGeneration() {
    if (!isExecuting || !websocket || websocket.readyState !== WebSocket.OPEN) return;
    
    console.log('🛑 생성 중지 요청');
    websocket.send(JSON.stringify({
        type: 'cancel_workflow',
        data: { session_id: sessionId }
    }));
}


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

function updateUIState() {
    if (isExecuting) {
        ui.generateBtn.style.display = 'none';
        ui.stopBtn.style.display = 'inline-block';
        ui.pipelineDisplay.textContent = "작업 준비 중...";
    } else {
        ui.generateBtn.style.display = 'inline-block';
        ui.stopBtn.style.display = 'none';
        ui.pipelineDisplay.textContent = "Pipeline: Idle";
    }
}

export function init(canvasInstance) {
    mainCanvas = canvasInstance;
    panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('position-top');
    panel.innerHTML = render();

    ui.generateBtn = panel.querySelector('#generate-btn');
    ui.stopBtn = panel.querySelector('#stop-btn');
    ui.pipelineDisplay = panel.querySelector('#pipeline-display');

    ui.generateBtn.addEventListener('click', executeGeneration);
    ui.stopBtn.addEventListener('click', stopGeneration);
    
    setupWebSocket();
}
