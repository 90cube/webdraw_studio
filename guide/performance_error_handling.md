# 성능 최적화 및 에러 핸들링 시스템

## 🚀 1. 성능 최적화 전략

### 📊 Performance Monitoring System (performanceMonitor.js)

#### 🎯 목적
실시간 성능 모니터링 및 최적화 제안 시스템

#### 🔧 핵심 구조
```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            // 렌더링 성능
            frameRate: new CircularBuffer(100),
            renderTime: new CircularBuffer(100),
            canvasOperations: new CircularBuffer(100),
            
            // 메모리 사용량
            heapUsed: new CircularBuffer(50),
            heapTotal: new CircularBuffer(50),
            
            // 네트워크 성능
            apiResponseTime: new CircularBuffer(50),
            websocketLatency: new CircularBuffer(100),
            
            // 사용자 상호작용
            inputLatency: new CircularBuffer(100),
            scrollPerformance: new CircularBuffer(100)
        };
        
        this.thresholds = {
            frameRate: { warning: 45, critical: 30 },
            renderTime: { warning: 16, critical: 33 }, // ms
            memoryUsage: { warning: 80, critical: 90 }, // %
            apiResponseTime: { warning: 1000, critical: 3000 }, // ms
            inputLatency: { warning: 100, critical: 200 } // ms
        };
        
        this.isMonitoring = false;
        this.alertCallbacks = new Set();
        
        this.init();
    }

    init() {
        // Performance Observer 설정
        if ('PerformanceObserver' in window) {
            this.setupPerformanceObserver();
        }
        
        // 메모리 모니터링 (Chrome 전용)
        if ('memory' in performance) {
            this.setupMemoryMonitoring();
        }
        
        // FPS 모니터링
        this.setupFrameRateMonitoring();
        
        // 입력 지연 모니터링
        this.setupInputLatencyMonitoring();
    }

    setupPerformanceObserver() {
        // 페인트 이벤트 모니터링
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.recordMetric('renderTime', entry.startTime);
                }
            }
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });

        // 네비게이션 타이밍
        const navObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordMetric('pageLoadTime', entry.loadEventEnd - entry.fetchStart);
            }
        });
        
        navObserver.observe({ entryTypes: ['navigation'] });
    }

    setupFrameRateMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            const now = performance.now();
            frameCount++;
            
            if (now - lastTime >= 1000) {
                const fps = (frameCount * 1000) / (now - lastTime);
                this.recordMetric('frameRate', fps);
                
                frameCount = 0;
                lastTime = now;
                
                // FPS 경고 체크
                this.checkThreshold('frameRate', fps);
            }
            
            if (this.isMonitoring) {
                requestAnimationFrame(measureFPS);
            }
        };
        
        requestAnimationFrame(measureFPS);
    }

    setupMemoryMonitoring() {
        setInterval(() => {
            if (!this.isMonitoring) return;
            
            const memInfo = performance.memory;
            const usedPercent = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
            
            this.recordMetric('heapUsed', memInfo.usedJSHeapSize);
            this.recordMetric('heapTotal', memInfo.totalJSHeapSize);
            
            // 메모리 사용량 경고
            this.checkThreshold('memoryUsage', usedPercent);
            
            // 메모리 누수 감지
            this.detectMemoryLeaks();
            
        }, 5000); // 5초마다 체크
    }

    setupInputLatencyMonitoring() {
        ['click', 'keydown', 'scroll'].forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                const start = performance.now();
                
                requestAnimationFrame(() => {
                    const latency = performance.now() - start;
                    this.recordMetric('inputLatency', latency);
                    
                    if (eventType === 'scroll') {
                        this.recordMetric('scrollPerformance', latency);
                    }
                    
                    this.checkThreshold('inputLatency', latency);
                });
            }, { passive: true });
        });
    }

    // 캔버스 성능 모니터링
    monitorCanvasOperation(operation, duration) {
        this.recordMetric('canvasOperations', { operation, duration });
        
        if (duration > 16) { // 60fps 기준
            console.warn(`Slow canvas operation: ${operation} took ${duration}ms`);
            this.optimizationSuggestions.canvas.push({
                operation,
                duration,
                suggestion: this.getCanvasOptimizationSuggestion(operation, duration)
            });
        }
    }

    // API 성능 모니터링
    monitorAPICall(url, responseTime, success) {
        this.recordMetric('apiResponseTime', responseTime);
        
        if (!success) {
            this.recordError('api', { url, responseTime });
        }
        
        this.checkThreshold('apiResponseTime', responseTime);
    }

    // 성능 임계값 체크
    checkThreshold(metric, value) {
        const threshold = this.thresholds[metric];
        if (!threshold) return;
        
        if (value >= threshold.critical) {
            this.triggerAlert('critical', metric, value);
        } else if (value >= threshold.warning) {
            this.triggerAlert('warning', metric, value);
        }
    }

    triggerAlert(severity, metric, value) {
        const alert = {
            severity,
            metric,
            value,
            timestamp: Date.now(),
            suggestion: this.getOptimizationSuggestion(metric, value)
        };
        
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Performance alert callback error:', error);
            }
        });
    }

    // 최적화 제안 생성
    getOptimizationSuggestion(metric, value) {
        const suggestions = {
            frameRate: {
                warning: '프레임 속도가 감소했습니다. 렌더링 복잡도를 줄이거나 불필요한 애니메이션을 비활성화하세요.',
                critical: '심각한 성능 문제가 발생했습니다. 즉시 렌더링을 최적화하세요.'
            },
            renderTime: {
                warning: '렌더링 시간이 길어지고 있습니다. 레이어 수를 줄이거나 이미지 크기를 최적화하세요.',
                critical: '렌더링이 매우 느립니다. 캔버스 크기를 줄이거나 품질을 낮추세요.'
            },
            memoryUsage: {
                warning: '메모리 사용량이 높습니다. 불필요한 이미지나 레이어를 정리하세요.',
                critical: '메모리 부족입니다. 즉시 일부 리소스를 해제하세요.'
            },
            apiResponseTime: {
                warning: '네트워크 응답이 느립니다. 연결 상태를 확인하세요.',
                critical: '네트워크 응답이 매우 느립니다. 오프라인 모드를 고려하세요.'
            }
        };
        
        const severityKey = value >= this.thresholds[metric].critical ? 'critical' : 'warning';
        return suggestions[metric]?.[severityKey] || '성능을 최적화하세요.';
    }

    // 자동 최적화 실행
    async autoOptimize() {
        const optimizations = this.getRecommendedOptimizations();
        
        for (const optimization of optimizations) {
            try {
                await this.executeOptimization(optimization);
                console.log(`Applied optimization: ${optimization.name}`);
            } catch (error) {
                console.error(`Failed to apply optimization ${optimization.name}:`, error);
            }
        }
    }

    getRecommendedOptimizations() {
        const optimizations = [];
        
        // 메모리 사용량이 높을 때
        if (this.getLatestMetric('memoryUsage') > this.thresholds.memoryUsage.warning) {
            optimizations.push({
                name: 'reduce_canvas_quality',
                priority: 'high',
                execute: () => this.reduceCanvasQuality()
            });
        }
        
        // FPS가 낮을 때
        if (this.getLatestMetric('frameRate') < this.thresholds.frameRate.warning) {
            optimizations.push({
                name: 'disable_animations',
                priority: 'medium',
                execute: () => this.disableNonEssentialAnimations()
            });
        }
        
        return optimizations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // 성능 리포트 생성
    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            summary: {
                avgFrameRate: this.getAverageMetric('frameRate'),
                avgRenderTime: this.getAverageMetric('renderTime'),
                memoryUsage: this.getLatestMetric('memoryUsage'),
                apiResponseTime: this.getAverageMetric('apiResponseTime')
            },
            alerts: this.getRecentAlerts(),
            recommendations: this.generateRecommendations(),
            systemInfo: {
                userAgent: navigator.userAgent,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    pixelRatio: window.devicePixelRatio
                },
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null
            }
        };
        
        return report;
    }
}

// 순환 버퍼 클래스
class CircularBuffer {
    constructor(size) {
        this.size = size;
        this.buffer = new Array(size);
        this.index = 0;
        this.count = 0;
    }
    
    add(value) {
        this.buffer[this.index] = value;
        this.index = (this.index + 1) % this.size;
        this.count = Math.min(this.count + 1, this.size);
    }
    
    getAverage() {
        if (this.count === 0) return 0;
        const sum = this.buffer.slice(0, this.count).reduce((a, b) => a + b, 0);
        return sum / this.count;
    }
    
    getLatest() {
        if (this.count === 0) return null;
        const latestIndex = (this.index - 1 + this.size) % this.size;
        return this.buffer[latestIndex];
    }
}
```

### 🎯 Canvas Performance Optimizer (canvasOptimizer.js)

#### 🔧 캔버스 특화 성능 최적화
```javascript
class CanvasPerformanceOptimizer {
    constructor(fabricCanvas) {
        this.canvas = fabricCanvas;
        this.optimizationLevel = 'auto'; // 'none', 'conservative', 'aggressive', 'auto'
        this.performanceMetrics = new Map();
        
        this.optimizations = {
            // 렌더링 최적화
            renderOnDemand: false,
            skipOffscreenObjects: false,
            useBackgroundCache: false,
            
            // 객체 최적화
            objectCaching: true,
            textureOptimization: true,
            imageSmoothing: true,
            
            // 메모리 최적화
            disposeUnusedTextures: true,
            limitHistorySize: 50,
            
            // 상호작용 최적화
            hoverOptimization: true,
            selectionOptimization: true
        };
        
        this.init();
    }

    init() {
        this.setupRenderOptimizations();
        this.setupObjectOptimizations();
        this.setupMemoryOptimizations();
        this.setupEventOptimizations();
    }

    setupRenderOptimizations() {
        let renderTimeout = null;
        
        // 온디맨드 렌더링
        const originalRenderAll = this.canvas.renderAll.bind(this.canvas);
        this.canvas.renderAll = () => {
            if (!this.optimizations.renderOnDemand) {
                return originalRenderAll();
            }
            
            if (renderTimeout) clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                const startTime = performance.now();
                originalRenderAll();
                const renderTime = performance.now() - startTime;
                
                this.recordRenderPerformance(renderTime);
                renderTimeout = null;
            }, 16); // 60fps 제한
        };

        // 뷰포트 기반 렌더링
        if (this.optimizations.skipOffscreenObjects) {
            this.enableViewportCulling();
        }
    }

    enableViewportCulling() {
        const originalRenderCanvas = this.canvas._renderCanvas.bind(this.canvas);
        
        this.canvas._renderCanvas = (ctx, objects) => {
            const viewport = this.canvas.calcViewportBoundaries();
            const visibleObjects = objects.filter(obj => {
                const objBounds = obj.getBoundingRect();
                return this.isObjectInViewport(objBounds, viewport);
            });
            
            return originalRenderCanvas(ctx, visibleObjects);
        };
    }

    isObjectInViewport(objBounds, viewport) {
        return !(
            objBounds.left > viewport.br.x ||
            objBounds.top > viewport.br.y ||
            objBounds.left + objBounds.width < viewport.tl.x ||
            objBounds.top + objBounds.height < viewport.tl.y
        );
    }

    setupObjectOptimizations() {
        // 이미지 캐싱 최적화
        this.canvas.on('object:added', (e) => {
            const obj = e.target;
            
            if (obj.type === 'image' && this.optimizations.objectCaching) {
                obj.set('objectCaching', true);
                
                // 이미지 품질 최적화
                if (this.optimizations.textureOptimization) {
                    this.optimizeImageTexture(obj);
                }
            }
        });

        // 대형 객체 자동 분할
        this.canvas.on('object:scaling', (e) => {
            const obj = e.target;
            const bounds = obj.getBoundingRect();
            
            if (bounds.width > 2000 || bounds.height > 2000) {
                this.suggestObjectSplitting(obj);
            }
        });
    }

    optimizeImageTexture(imageObj) {
        const img = imageObj.getElement();
        if (!img) return;

        // 이미지 크기가 캔버스보다 큰 경우 리사이징
        const canvasSize = {
            width: this.canvas.getWidth(),
            height: this.canvas.getHeight()
        };

        if (img.naturalWidth > canvasSize.width * 2 || 
            img.naturalHeight > canvasSize.height * 2) {
            
            const optimizedImg = this.resizeImage(img, canvasSize.width, canvasSize.height);
            imageObj.setElement(optimizedImg);
        }
    }

    resizeImage(img, maxWidth, maxHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 종횡비 유지하면서 리사이징
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let { width, height } = img;
        
        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 고품질 리샘플링
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        const optimizedImg = new Image();
        optimizedImg.src = canvas.toDataURL('image/jpeg', 0.9);
        return optimizedImg;
    }

    setupMemoryOptimizations() {
        // 메모리 사용량 모니터링
        setInterval(() => {
            this.checkMemoryUsage();
        }, 10000);

        // 불필요한 텍스처 정리
        if (this.optimizations.disposeUnusedTextures) {
            this.scheduleTextureCleanup();
        }

        // 히스토리 크기 제한
        if (this.optimizations.limitHistorySize) {
            this.limitCanvasHistory();
        }
    }

    checkMemoryUsage() {
        if (!performance.memory) return;
        
        const memUsage = performance.memory.usedJSHeapSize;
        const memLimit = performance.memory.jsHeapSizeLimit;
        const usagePercent = (memUsage / memLimit) * 100;
        
        if (usagePercent > 80) {
            this.triggerMemoryOptimization();
        }
    }

    triggerMemoryOptimization() {
        console.log('Triggering memory optimization...');
        
        // 캐시된 객체 정리
        this.canvas.getObjects().forEach(obj => {
            if (obj.cacheCanvas) {
                obj.dirty = true;
            }
        });
        
        // 가비지 컬렉션 제안
        if (window.gc) {
            window.gc();
        }
        
        // 성능 수준 조정
        this.adjustPerformanceLevel('conservative');
    }

    setupEventOptimizations() {
        // 호버 최적화
        if (this.optimizations.hoverOptimization) {
            this.optimizeHoverEvents();
        }

        // 선택 최적화
        if (this.optimizations.selectionOptimization) {
            this.optimizeSelectionEvents();
        }
    }

    optimizeHoverEvents() {
        let hoverTimeout = null;
        
        this.canvas.on('mouse:move', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                // 실제 호버 처리
                this.canvas.findTarget();
            }, 50); // 호버 지연
        });
    }

    // 적응형 성능 조정
    adjustPerformanceLevel(level) {
        this.optimizationLevel = level;
        
        const settings = {
            none: {
                renderOnDemand: false,
                skipOffscreenObjects: false,
                objectCaching: false,
                textureOptimization: false
            },
            conservative: {
                renderOnDemand: true,
                skipOffscreenObjects: false,
                objectCaching: true,
                textureOptimization: false
            },
            aggressive: {
                renderOnDemand: true,
                skipOffscreenObjects: true,
                objectCaching: true,
                textureOptimization: true,
                imageSmoothing: false
            }
        };
        
        if (settings[level]) {
            Object.assign(this.optimizations, settings[level]);
            this.applyOptimizations();
        }
    }

    // 자동 성능 조정
    autoAdjustPerformance() {
        const avgRenderTime = this.getAverageRenderTime();
        const currentFPS = this.getCurrentFPS();
        
        if (currentFPS < 30 || avgRenderTime > 33) {
            this.adjustPerformanceLevel('aggressive');
        } else if (currentFPS < 45 || avgRenderTime > 20) {
            this.adjustPerformanceLevel('conservative');
        } else if (currentFPS > 55 && avgRenderTime < 10) {
            this.adjustPerformanceLevel('none');
        }
    }
}
```

## 🛡️ 2. 에러 핸들링 시스템

### 🚨 Global Error Handler (errorHandler.js)

#### 🎯 목적
전역 에러 캐치, 로깅, 복구 메커니즘 제공

#### 🔧 핵심 구조
```javascript
class GlobalErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 1000;
        this.errorCategories = new Map();
        this.recoveryStrategies = new Map();
        this.errorCallbacks = new Set();
        
        // 에러 심각도 정의
        this.severityLevels = {
            LOW: { level: 1, color: '#17a2b8', action: 'log' },
            MEDIUM: { level: 2, color: '#ffc107', action: 'warn' },
            HIGH: { level: 3, color: '#fd7e14', action: 'notify' },
            CRITICAL: { level: 4, color: '#dc3545', action: 'block' }
        };
        
        this.init();
    }

    init() {
        this.setupGlobalErrorHandlers();
        this.setupErrorCategories();
        this.setupRecoveryStrategies();
        this.setupErrorReporting();
    }

    setupGlobalErrorHandlers() {
        // JavaScript 런타임 에러
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                severity: 'HIGH'
            });
        });

        // Promise 거부 에러
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise_rejection',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                reason: event.reason,
                severity: 'HIGH'
            });
        });

        // 리소스 로딩 에러
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource_load',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    target: event.target,
                    severity: 'MEDIUM'
                });
            }
        }, true);

        // 네트워크 에러
        window.addEventListener('offline', () => {
            this.handleError({
                type: 'network',
                message: 'Network connection lost',
                severity: 'HIGH'
            });
        });
    }

    setupErrorCategories() {
        this.errorCategories.set('canvas', {
            patterns: [
                /canvas/i,
                /fabric/i,
                /webgl/i,
                /rendering/i
            ],
            severity: 'HIGH',
            recovery: 'canvas_recovery'
        });

        this.errorCategories.set('api', {
            patterns: [
                /fetch/i,
                /network/i,
                /request/i,
                /response/i
            ],
            severity: 'HIGH',
            recovery: 'api_recovery'
        });

        this.errorCategories.set('websocket', {
            patterns: [
                /websocket/i,
                /connection/i,
                /socket/i
            ],
            severity: 'HIGH',
            recovery: 'websocket_recovery'
        });

        this.errorCategories.set('memory', {
            patterns: [
                /memory/i,
                /allocation/i,
                /out of memory/i
            ],
            severity: 'CRITICAL',
            recovery: 'memory_recovery'
        });

        this.errorCategories.set('ui', {
            patterns: [
                /element/i,
                /dom/i,
                /ui/i,
                /component/i
            ],
            severity: 'MEDIUM',
            recovery: 'ui_recovery'
        });
    }

    setupRecoveryStrategies() {
        // 캔버스 복구
        this.recoveryStrategies.set('canvas_recovery', async (error) => {
            console.log('Attempting canvas recovery...');
            
            try {
                // 캔버스 상태 백업
                const canvasState = globalCanvasManager.getState();
                
                // 캔버스 재초기화
                await globalCanvasManager.reinitialize();
                
                // 상태 복원 시도
                if (canvasState && canvasState.objects) {
                    await globalCanvasManager.restoreState(canvasState);
                }
                
                return { success: true, message: '캔버스가 복구되었습니다.' };
                
            } catch (recoveryError) {
                return { 
                    success: false, 
                    message: '캔버스 복구에 실패했습니다.',
                    error: recoveryError 
                };
            }
        });

        // API 복구
        this.recoveryStrategies.set('api_recovery', async (error) => {
            console.log('Attempting API recovery...');
            
            try {
                // 네트워크 상태 확인
                if (!navigator.onLine) {
                    return { 
                        success: false, 
                        message: '네트워크 연결을 확인하세요.' 
                    };
                }
                
                // API 연결 테스트
                const testResponse = await fetch('/api/health');
                if (testResponse.ok) {
                    return { 
                        success: true, 
                        message: 'API 연결이 복구되었습니다.' 
                    };
                }
                
                // 대체 서버 시도
                return await this.tryFallbackServers();
                
            } catch (recoveryError) {
                return { 
                    success: false, 
                    message: 'API 복구에 실패했습니다.' 
                };
            }
        });

        // WebSocket 복구
        this.recoveryStrategies.set('websocket_recovery', async (error) => {
            console.log('Attempting WebSocket recovery...');
            
            try {
                // 기존 WebSocket 정리
                if (globalWebSocketManager) {
                    globalWebSocketManager.disconnect();
                }
                
                // 재연결 시도
                await globalWebSocketManager.connect();
                
                return { 
                    success: true, 
                    message: 'WebSocket 연결이 복구되었습니다.' 
                };
                
            } catch (recoveryError) {
                // 폴링 모드로 폴백
                globalWebSocketManager.switchToPollingMode();
                
                return { 
                    success: true, 
                    message: '폴링 모드로 전환되었습니다.' 
                };
            }
        });

        // 메모리 복구
        this.recoveryStrategies.set('memory_recovery', async (error) => {
            console.log('Attempting memory recovery...');
            
            try {
                // 캐시 정리
                await this.clearCaches();
                
                // 불필요한 객체 정리
                await this.cleanupUnusedObjects();
                
                // 가비지 컬렉션 강제 실행
                if (window.gc) {
                    window.gc();
                }
                
                return { 
                    success: true, 
                    message: '메모리가 정리되었습니다.' 
                };
                
            } catch (recoveryError) {
                return { 
                    success: false, 
                    message: '메모리 복구에 실패했습니다.' 
                };
            }
        });

        // UI 복구
        this.recoveryStrategies.set('ui_recovery', async (error) => {
            console.log('Attempting UI recovery...');
            
            try {
                // 문제가 있는 패널 재초기화
                await this.reinitializePanels();
                
                // 이벤트 리스너 재설정
                await this.rebindEventListeners();
                
                return { 
                    success: true, 
                    message: 'UI가 복구되었습니다.' 
                };
                
            } catch (recoveryError) {
                return { 
                    success: false, 
                    message: 'UI 복구에 실패했습니다.' 
                };
            }
        });
    }

    // 에러 처리 메인 로직
    async handleError(errorInfo) {
        const processedError = this.processError(errorInfo);
        
        // 에러 로깅
        this.logError(processedError);
        
        // 사용자 알림 (심각도에 따라)
        await this.notifyUser(processedError);
        
        // 복구 시도
        const recoveryResult = await this.attemptRecovery(processedError);
        
        // 에러 콜백 실행
        this.executeErrorCallbacks(processedError, recoveryResult);
        
        // 분석을 위한 에러 수집
        this.collectErrorAnalytics(processedError);
    }

    processError(errorInfo) {
        const processed = {
            id: this.generateErrorId(),
            timestamp: Date.now(),
            ...errorInfo
        };
        
        // 에러 분류
        processed.category = this.categorizeError(errorInfo.message);
        
        // 컨텍스트 정보 추가
        processed.context = this.gatherErrorContext();
        
        // 스택 트레이스 정리
        if (processed.error && processed.error.stack) {
            processed.stackTrace = this.parseStackTrace(processed.error.stack);
        }
        
        return processed;
    }

    categorizeError(message) {
        for (const [category, config] of this.errorCategories) {
            if (config.patterns.some(pattern => pattern.test(message))) {
                return category;
            }
        }
        return 'unknown';
    }

    gatherErrorContext() {
        return {
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
            } : null,
            canvasState: globalCanvasManager ? {
                objectCount: globalCanvasManager.getObjectCount(),
                canvasSize: globalCanvasManager.getCanvasSize()
            } : null,
            currentOperation: globalStateManager ? 
                globalStateManager.getState('generation.currentStep') : null
        };
    }

    async notifyUser(error) {
        const severity = this.severityLevels[error.severity];
        if (!severity) return;

        switch (severity.action) {
            case 'log':
                console.log(`[${error.severity}] ${error.message}`);
                break;
                
            case 'warn':
                console.warn(`[${error.severity}] ${error.message}`);
                this.showToast(error.message, 'warning');
                break;
                
            case 'notify':
                console.error(`[${error.severity}] ${error.message}`);
                this.showErrorDialog(error);
                break;
                
            case 'block':
                console.error(`[CRITICAL] ${error.message}`);
                await this.showCriticalErrorDialog(error);
                break;
        }
    }

    showErrorDialog(error) {
        globalModalSystem.alert(
            `오류가 발생했습니다: ${error.message}`,
            '에러',
            {
                icon: '⚠️',
                onConfirm: () => {
                    // 에러 리포팅 옵션 제공
                    this.showErrorReportDialog(error);
                }
            }
        );
    }

    async showCriticalErrorDialog(error) {
        const userChoice = await globalModalSystem.confirm(
            `심각한 오류가 발생했습니다: ${error.message}\n\n애플리케이션을 재시작하시겠습니까?`,
            '심각한 에러',
            {
                icon: '🚨',
                confirmText: '재시작',
                cancelText: '계속'
            }
        );
        
        if (userChoice) {
            window.location.reload();
        }
    }

    // 에러 복구 시도
    async attemptRecovery(error) {
        const category = this.errorCategories.get(error.category);
        if (!category || !category.recovery) {
            return { success: false, message: '복구 전략이 없습니다.' };
        }
        
        const recoveryStrategy = this.recoveryStrategies.get(category.recovery);
        if (!recoveryStrategy) {
            return { success: false, message: '복구 함수를 찾을 수 없습니다.' };
        }
        
        try {
            const result = await recoveryStrategy(error);
            
            if (result.success) {
                this.logError({
                    type: 'recovery_success',
                    message: `${error.category} 복구 성공: ${result.message}`,
                    originalError: error.id,
                    severity: 'LOW'
                });
            }
            
            return result;
            
        } catch (recoveryError) {
            this.logError({
                type: 'recovery_failure',
                message: `${error.category} 복구 실패`,
                error: recoveryError,
                originalError: error.id,
                severity: 'CRITICAL'
            });
            
            return { 
                success: false, 
                message: '복구 중 오류가 발생했습니다.' 
            };
        }
    }

    // 에러 분석 및 리포팅
    generateErrorReport() {
        const recentErrors = this.errorLog.slice(-50);
        const errorStats = this.analyzeErrors(recentErrors);
        
        return {
            timestamp: Date.now(),
            totalErrors: this.errorLog.length,
            recentErrors: recentErrors,
            statistics: errorStats,
            systemInfo: this.getSystemInfo(),
            recommendations: this.generateRecommendations(errorStats)
        };
    }

    analyzeErrors(errors) {
        const stats = {
            byCategory: {},
            bySeverity: {},
            byTime: {},
            patterns: []
        };
        
        errors.forEach(error => {
            // 카테고리별 집계
            stats.byCategory[error.category] = 
                (stats.byCategory[error.category] || 0) + 1;
            
            // 심각도별 집계
            stats.bySeverity[error.severity] = 
                (stats.bySeverity[error.severity] || 0) + 1;
            
            // 시간별 집계 (시간당)
            const hour = new Date(error.timestamp).getHours();
            stats.byTime[hour] = (stats.byTime[hour] || 0) + 1;
        });
        
        return stats;
    }

    generateRecommendations(stats) {
        const recommendations = [];
        
        // 메모리 에러가 많은 경우
        if (stats.byCategory.memory > 5) {
            recommendations.push({
                type: 'memory',
                message: '메모리 에러가 빈번합니다. 이미지 크기를 줄이거나 레이어 수를 제한하세요.',
                priority: 'high'
            });
        }
        
        // 캔버스 에러가 많은 경우
        if (stats.byCategory.canvas > 3) {
            recommendations.push({
                type: 'canvas',
                message: '캔버스 관련 에러가 발생하고 있습니다. 브라우저 호환성을 확인하세요.',
                priority: 'medium'
            });
        }
        
        // 네트워크 에러가 많은 경우
        if (stats.byCategory.api > 5) {
            recommendations.push({
                type: 'network',
                message: '네트워크 연결이 불안정합니다. 인터넷 연결을 확인하세요.',
                priority: 'high'
            });
        }
        
        return recommendations;
    }
}

// 전역 에러 핸들러 인스턴스
const globalErrorHandler = new GlobalErrorHandler();
```

이제 테스트 계획과 배포 전략까지 마저 작성하겠습니다.