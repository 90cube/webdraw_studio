# T2I 프론트엔드 아키텍처 전체 개요

## 🏗️ 시스템 구조

### 핵심 아키텍처 원칙
- **Vanilla JavaScript**: 프레임워크 의존성 없는 순수 JS 구현
- **Floating UI System**: 독립적이고 드래그 가능한 패널 시스템
- **Dual Canvas Architecture**: 메인 캔버스(합성) + 에디트 캔버스(편집)
- **Modular Design**: 각 컴포넌트 완전 독립적 모듈화
- **Real-time Communication**: WebSocket 기반 실시간 업데이트

## 📊 모듈 구조 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    T2I Frontend Application                 │
├─────────────────────────────────────────────────────────────┤
│  Core System                                                │
│  ├── App Controller (main.js)                               │
│  ├── State Manager (state.js)                               │  
│  ├── WebSocket Manager (websocket.js)                       │
│  └── Utils Library (utils.js)                               │
├─────────────────────────────────────────────────────────────┤
│  Canvas System                                               │
│  ├── Main Canvas Controller (mainCanvas.js)                 │
│  ├── Edit Canvas Controller (editCanvas.js)                 │
│  ├── Canvas Bridge (canvasBridge.js)                        │
│  └── Layer Manager (layerManager.js)                        │
├─────────────────────────────────────────────────────────────┤
│  Floating UI Panels                                          │
│  ├── Left Panels                                            │
│  │   ├── Model Explorer (modelExplorer.js)                  │
│  │   └── ADetailer Control (adetailerControl.js)            │
│  ├── Bottom Panels                                          │
│  │   ├── Prompt Presets (promptPresets.js)                  │
│  │   ├── LoRA Selector (loraSelector.js)                    │
│  │   └── Generation Controller (generationController.js)    │
│  ├── Right Panels                                           │
│  │   ├── Area Capture (areaCapture.js)                      │
│  │   └── Multi Detailer (multiDetailer.js)                  │
│  └── Panel Manager (panelManager.js)                        │
├─────────────────────────────────────────────────────────────┤
│  UI Components                                               │
│  ├── Slider Component (slider.js)                           │
│  ├── Dropdown Component (dropdown.js)                       │
│  ├── Image Viewer (imageViewer.js)                          │
│  ├── Progress Bar (progressBar.js)                          │
│  └── Modal System (modal.js)                                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 모듈별 기획서 구성

### 📁 1. 코어 시스템 모듈들
- **App Controller**: 애플리케이션 초기화 및 전체 제어
- **State Manager**: 전역 상태 관리 시스템
- **WebSocket Manager**: 실시간 통신 관리
- **Utils Library**: 공통 유틸리티 함수집

### 🖼️ 2. 캔버스 시스템 모듈들  
- **Main Canvas Controller**: Fabric.js 기반 다중 레이어 관리
- **Edit Canvas Controller**: Three.js 지원 정밀 편집
- **Canvas Bridge**: 두 캔버스 간 데이터 연동
- **Layer Manager**: 레이어 계층 구조 관리

### 🎛️ 3. 플로팅 UI 패널 모듈들
#### 왼쪽 영역
- **Model Explorer**: 모델 파일 탐색 및 선택
- **ADetailer Control**: 디테일러 파라미터 제어

#### 하단 영역  
- **Prompt Presets**: 프롬프트 템플릿 관리
- **LoRA Selector**: LoRA 모델 선택 및 가중치 조절
- **Generation Controller**: 생성 실행 및 제어

#### 우측 영역
- **Area Capture**: 영역 선택 및 캡처
- **Multi Detailer**: 디테일러 결과 관리

### 🧩 4. UI 컴포넌트 모듈들
- **공통 컴포넌트**: 재사용 가능한 UI 요소들
- **이벤트 시스템**: 컴포넌트 간 통신
- **스타일 시스템**: 테마 및 스타일 관리

## 🔧 기술 스택 세부사항

### JavaScript 환경
```javascript
// 브라우저 호환성
const BROWSER_SUPPORT = {
    chrome: "90+",
    firefox: "88+", 
    safari: "14+",
    edge: "90+"
}

// 필수 브라우저 API
const REQUIRED_APIS = [
    "Canvas 2D Context",
    "WebGL 2.0",
    "WebSocket",
    "File API",
    "IndexedDB"
]
```

### 외부 라이브러리
```javascript
const DEPENDENCIES = {
    "fabric.js": "^5.3.0",      // 메인 캔버스
    "three.js": "^0.156.0",     // 에디트 캔버스  
    // 추가 의존성 없음 (Vanilla JS)
}
```

## 📱 반응형 설계

### 화면 크기별 레이아웃
```css
/* 데스크톱 (1920x1080 기준) */
@media (min-width: 1440px) {
    .floating-panel { /* 전체 패널 표시 */ }
}

/* 태블릿 (1024x768) */  
@media (max-width: 1439px) {
    .floating-panel { /* 일부 패널 접기 */ }
}

/* 모바일 대응 제외 (데스크톱 전용) */
```

## 🚀 성능 목표

### 초기 로딩
- **First Paint**: < 1초
- **Interactive**: < 2초  
- **완전 로드**: < 3초

### 런타임 성능
- **캔버스 렌더링**: 60fps 유지
- **메모리 사용**: < 500MB (캔버스 제외)
- **WebSocket 지연**: < 100ms

## 📋 개발 우선순위

### Phase 1: 기본 구조
1. App Controller 및 State Manager
2. Main Canvas Controller  
3. 기본 Floating Panel System

### Phase 2: 핵심 기능
1. Model Explorer 및 Generation Controller
2. WebSocket Manager
3. 기본 UI Components

### Phase 3: 고급 기능  
1. Edit Canvas Controller
2. ADetailer Control Panel
3. Multi Detailer System

### Phase 4: 최적화
1. 성능 튜닝
2. 에러 핸들링 강화
3. 사용자 경험 개선

다음 단계에서 각 모듈별 상세 기획서를 개별 아티팩트로 제공하겠습니다.