// 중앙 상태 관리 모듈
const appState = {
    currentBaseModel: null, // 'sd15', 'sdxl' 등
    currentResolution: { width: 0, height: 0 },
    currentSteps: 25,
    addNoise: false,
    currentSeed: -1,
    randomSeed: true,
    currentCFG: 5,
    currentDenoise: 1,
};

const stateManager = {
    getState(key) {
        return appState[key];
    },

    setState(key, value) {
        if (appState[key] === value) return; // 변경이 없으면 무시
        appState[key] = value;
        // 상태 변경을 앱 전체에 알립니다.
        window.dispatchEvent(new CustomEvent('state:changed', {
            detail: { key, value }
        }));
        console.log(`State changed: ${key} = ${value}`);
    },

    // 다른 모듈이 상태 변경을 구독할 수 있도록 리스너를 추가합니다.
    listen(key, callback) {
        window.addEventListener('state:changed', (e) => {
            if (e.detail.key === key) {
                callback(e.detail.value);
            }
        });
    }
};

export default stateManager;
