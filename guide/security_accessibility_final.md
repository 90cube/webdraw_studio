# 보안, 접근성 및 최종 실행 계획

## 🔐 1. 보안 고려사항

### 🛡️ Security Framework (security.js)

#### 🎯 목적
클라이언트 사이드 보안 위협에 대한 포괄적 방어 메커니즘

#### 🔧 보안 구현
```javascript
class SecurityManager {
    constructor() {
        this.csp = new ContentSecurityPolicy();
        this.xssProtection = new XSSProtection();
        this.inputSanitizer = new InputSanitizer();
        this.fileValidator = new FileValidator();
        
        // 보안 정책
        this.securityPolicies = {
            // 업로드 파일 제한
            maxFileSize: 50 * 1024 * 1024, // 50MB
            allowedImageTypes: ['image/png', 'image/jpeg', 'image/webp'],
            allowedModelTypes: ['.safetensors', '.ckpt', '.pth'],
            
            // API 호출 제한
            rateLimiting: {
                maxRequests: 100,
                timeWindow: 60000 // 1분
            },
            
            // 콘텐츠 검증
            enableContentValidation: true,
            enableMalwareScanning: false, // 서버사이드에서 처리
            
            // 개인정보 보호
            anonymizeUserData: true,
            encryptLocalStorage: true
        };
        
        this.init();
    }

    init() {
        this.setupCSP();
        this.setupXSSProtection();
        this.setupInputSanitization();
        this.setupFileValidation();
        this.setupRateLimiting();
        this.setupEncryption();
    }

    // Content Security Policy 설정
    setupCSP() {
        const cspDirectives = {
            'default-src': ["'self'"],
            'script-src': [
                "'self'",
                "'unsafe-inline'", // Fabric.js, Three.js 필요
                "'unsafe-eval'",   // 동적 import 필요
                'https://cdnjs.cloudflare.com'
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'"
            ],
            'img-src': [
                "'self'",
                'data:', // Base64 이미지
                'blob:', // Canvas 이미지
                'https:' // 외부 모델 미리보기
            ],
            'connect-src': [
                "'self'",
                'ws:', 'wss:', // WebSocket
                process.env.API_BASE_URL || 'http://localhost:8000'
            ],
            'worker-src': [
                "'self'",
                'blob:' // Web Worker
            ],
            'object-src': ["'none'"],
            'base-uri': ["'self'"]
        };

        const cspString = Object.entries(cspDirectives)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ');

        // 개발 환경에서만 메타 태그로 설정 (프로덕션에서는 서버 헤더 사용)
        if (process.env.NODE_ENV === 'development') {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = cspString;
            document.head.appendChild(meta);
        }
    }

    // XSS 방어
    setupXSSProtection() {
        // HTML 이스케이프 함수
        this.escapeHTML = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        // DOM 생성시 자동 이스케이프
        const originalCreateElement = document.createElement.bind(document);
        document.createElement = (tagName, options) => {
            const element = originalCreateElement(tagName, options);
            
            const originalSetInnerHTML = element.__lookupSetter__('innerHTML') || 
                Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
            
            Object.defineProperty(element, 'innerHTML', {
                set: (value) => {
                    if (typeof value === 'string') {
                        value = this.sanitizeHTML(value);
                    }
                    originalSetInnerHTML.call(element, value);
                },
                get: element.__lookupGetter__('innerHTML') || 
                     Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').get
            });
            
            return element;
        };
    }

    sanitizeHTML(html) {
        // DOMPurify 사용 (없으면 기본 필터링)
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
                ALLOWED_ATTR: ['class', 'style']
            });
        }
        
        // 기본 HTML 태그 제거
        return html.replace(/<script[^>]*>.*?<\/script>/gi, '')
                  .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+="[^"]*"/gi, '');
    }

    // 입력값 검증
    setupInputSanitization() {
        // 프롬프트 입력 검증
        this.validatePrompt = (prompt) => {
            if (typeof prompt !== 'string') return '';
            
            // 길이 제한
            if (prompt.length > 2000) {
                throw new SecurityError('프롬프트가 너무 깁니다.');
            }
            
            // 위험한 패턴 검사
            const dangerousPatterns = [
                /<script/i,
                /javascript:/i,
                /data:.*base64/i,
                /vbscript:/i
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(prompt)) {
                    throw new SecurityError('허용되지 않는 내용이 포함되어 있습니다.');
                }
            }
            
            return prompt.trim();
        };

        // 파일명 검증
        this.validateFileName = (fileName) => {
            if (typeof fileName !== 'string') return '';
            
            // 경로 탐색 방지
            fileName = fileName.replace(/[\/\\]/g, '');
            
            // 위험한 확장자 차단
            const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
            const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
            
            if (dangerousExtensions.includes(extension)) {
                throw new SecurityError('허용되지 않는 파일 형식입니다.');
            }
            
            return fileName;
        };
    }

    // 파일 업로드 보안
    setupFileValidation() {
        this.validateImageFile = async (file) => {
            // 크기 검증
            if (file.size > this.securityPolicies.maxFileSize) {
                throw new SecurityError('파일 크기가 너무 큽니다.');
            }
            
            // MIME 타입 검증
            if (!this.securityPolicies.allowedImageTypes.includes(file.type)) {
                throw new SecurityError('허용되지 않는 이미지 형식입니다.');
            }
            
            // 파일 시그니처 검증
            const isValidImage = await this.verifyImageSignature(file);
            if (!isValidImage) {
                throw new SecurityError('유효하지 않은 이미지 파일입니다.');
            }
            
            return true;
        };

        this.validateModelFile = async (file) => {
            const fileName = file.name.toLowerCase();
            const hasValidExtension = this.securityPolicies.allowedModelTypes
                .some(ext => fileName.endsWith(ext));
            
            if (!hasValidExtension) {
                throw new SecurityError('허용되지 않는 모델 파일 형식입니다.');
            }
            
            // Safetensors 헤더 검증
            if (fileName.endsWith('.safetensors')) {
                const isValidSafetensors = await this.verifySafetensorsFile(file);
                if (!isValidSafetensors) {
                    throw new SecurityError('유효하지 않은 Safetensors 파일입니다.');
                }
            }
            
            return true;
        };
    }

    // 이미지 파일 시그니처 검증
    async verifyImageSignature(file) {
        const buffer = await file.slice(0, 16).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        // PNG 시그니처: 89 50 4E 47 0D 0A 1A 0A
        if (file.type === 'image/png') {
            return bytes[0] === 0x89 && bytes[1] === 0x50 && 
                   bytes[2] === 0x4E && bytes[3] === 0x47;
        }
        
        // JPEG 시그니처: FF D8
        if (file.type === 'image/jpeg') {
            return bytes[0] === 0xFF && bytes[1] === 0xD8;
        }
        
        // WebP 시그니처: 52 49 46 46 ... 57 45 42 50
        if (file.type === 'image/webp') {
            return bytes[0] === 0x52 && bytes[1] === 0x49 && 
                   bytes[2] === 0x46 && bytes[3] === 0x46 &&
                   bytes[8] === 0x57 && bytes[9] === 0x45 && 
                   bytes[10] === 0x42 && bytes[11] === 0x50;
        }
        
        return false;
    }

    // Rate Limiting 구현
    setupRateLimiting() {
        const requestCounts = new Map();
        
        this.checkRateLimit = (identifier = 'default') => {
            const now = Date.now();
            const windowStart = now - this.securityPolicies.rateLimiting.timeWindow;
            
            // 기존 기록 정리
            if (!requestCounts.has(identifier)) {
                requestCounts.set(identifier, []);
            }
            
            const requests = requestCounts.get(identifier)
                .filter(timestamp => timestamp > windowStart);
            
            if (requests.length >= this.securityPolicies.rateLimiting.maxRequests) {
                throw new SecurityError('요청 제한을 초과했습니다. 잠시 후 다시 시도하세요.');
            }
            
            requests.push(now);
            requestCounts.set(identifier, requests);
            
            return true;
        };
    }

    // 로컬 스토리지 암호화
    setupEncryption() {
        if (!this.securityPolicies.encryptLocalStorage) return;
        
        const crypto = window.crypto || window.msCrypto;
        if (!crypto) {
            console.warn('암호화 기능을 사용할 수 없습니다.');
            return;
        }
        
        // 간단한 XOR 암호화 (실제로는 더 강력한 알고리즘 사용)
        this.encryptData = (data, key) => {
            const encrypted = [];
            const keyBytes = new TextEncoder().encode(key);
            const dataBytes = new TextEncoder().encode(JSON.stringify(data));
            
            for (let i = 0; i < dataBytes.length; i++) {
                encrypted.push(dataBytes[i] ^ keyBytes[i % keyBytes.length]);
            }
            
            return btoa(String.fromCharCode(...encrypted));
        };
        
        this.decryptData = (encryptedData, key) => {
            try {
                const encrypted = new Uint8Array(
                    atob(encryptedData).split('').map(c => c.charCodeAt(0))
                );
                const keyBytes = new TextEncoder().encode(key);
                const decrypted = [];
                
                for (let i = 0; i < encrypted.length; i++) {
                    decrypted.push(encrypted[i] ^ keyBytes[i % keyBytes.length]);
                }
                
                const jsonString = new TextDecoder().decode(new Uint8Array(decrypted));
                return JSON.parse(jsonString);
            } catch (error) {
                console.error('복호화 실패:', error);
                return null;
            }
        };
    }
}

// 보안 에러 클래스
class SecurityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SecurityError';
    }
}
```

## ♿ 2. 접근성 가이드라인

### 🎯 Accessibility Framework (accessibility.js)

#### 🔧 WCAG 2.1 AA 준수 구현
```javascript
class AccessibilityManager {
    constructor() {
        this.wcagLevel = 'AA'; // A, AA, AAA
        this.features = {
            keyboardNavigation: true,
            screenReaderSupport: true,
            highContrastMode: false,
            reducedMotion: false,
            textScaling: false,
            voiceNavigation: false
        };
        
        this.init();
    }

    init() {
        this.detectUserPreferences();
        this.setupKeyboardNavigation();
        this.setupScreenReaderSupport();
        this.setupFocusManagement();
        this.setupColorContrastSupport();
        this.setupMotionPreferences();
        this.setupTextScaling();
    }

    // 사용자 접근성 설정 감지
    detectUserPreferences() {
        // 고대비 모드
        this.features.highContrastMode = window.matchMedia('(prefers-contrast: high)').matches;
        
        // 애니메이션 감소
        this.features.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // 다크 모드
        this.features.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 설정 변경 감지
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.features.highContrastMode = e.matches;
            this.updateContrastMode();
        });
        
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.features.reducedMotion = e.matches;
            this.updateMotionSettings();
        });
    }

    // 키보드 내비게이션 설정
    setupKeyboardNavigation() {
        let focusableElements = [];
        let currentFocusIndex = 0;
        
        // 포커스 가능한 요소 목록 업데이트
        this.updateFocusableElements = () => {
            focusableElements = Array.from(document.querySelectorAll(`
                button:not([disabled]),
                [href],
                input:not([disabled]),
                select:not([disabled]),
                textarea:not([disabled]),
                [tabindex]:not([tabindex="-1"]),
                .floating-panel:not([aria-hidden="true"]),
                .modal:not([aria-hidden="true"]) [tabindex]:not([tabindex="-1"])
            `)).filter(el => {
                return el.offsetParent !== null && // 보이는 요소만
                       !el.hasAttribute('aria-hidden') &&
                       el.tabIndex !== -1;
            });
        };

        // 키보드 이벤트 처리
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'Escape':
                    this.handleEscapeKey(e);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(e);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowNavigation(e);
                    break;
                case 'Home':
                case 'End':
                    this.handleHomeEndNavigation(e);
                    break;
            }
        });

        // Skip Links 추가
        this.addSkipLinks();
    }

    handleTabNavigation(e) {
        this.updateFocusableElements();
        
        if (focusableElements.length === 0) return;
        
        const currentFocus = document.activeElement;
        const currentIndex = focusableElements.indexOf(currentFocus);
        
        let nextIndex;
        if (e.shiftKey) {
            nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        focusableElements[nextIndex].focus();
        e.preventDefault();
    }

    addSkipLinks() {
        const skipNav = document.createElement('nav');
        skipNav.className = 'skip-navigation';
        skipNav.setAttribute('aria-label', '바로가기 메뉴');
        
        skipNav.innerHTML = `
            <ul class="skip-links">
                <li><a href="#main-content" class="skip-link">메인 콘텐츠로 건너뛰기</a></li>
                <li><a href="#canvas-area" class="skip-link">캔버스 영역으로 건너뛰기</a></li>
                <li><a href="#generation-controls" class="skip-link">생성 제어로 건너뛰기</a></li>
                <li><a href="#panel-navigation" class="skip-link">패널 내비게이션으로 건너뛰기</a></li>
            </ul>
        `;
        
        document.body.insertBefore(skipNav, document.body.firstChild);
    }

    // 스크린 리더 지원
    setupScreenReaderSupport() {
        // ARIA 레이블 자동 생성
        this.enhanceARIALabels();
        
        // 라이브 리전 설정
        this.setupLiveRegions();
        
        // 의미있는 제목 구조 확인
        this.validateHeadingStructure();
        
        // 이미지 alt 텍스트 자동 생성
        this.enhanceImageAltText();
    }

    setupLiveRegions() {
        // 상태 업데이트용 라이브 리전
        const statusRegion = document.createElement('div');
        statusRegion.id = 'status-live-region';
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-atomic', 'true');
        statusRegion.className = 'sr-only';
        document.body.appendChild(statusRegion);
        
        // 에러/알림용 라이브 리전
        const alertRegion = document.createElement('div');
        alertRegion.id = 'alert-live-region';
        alertRegion.setAttribute('aria-live', 'assertive');
        alertRegion.setAttribute('aria-atomic', 'true');
        alertRegion.className = 'sr-only';
        document.body.appendChild(alertRegion);
        
        // 진행 상황 알림
        globalEventBus.on('generation:progress', (data) => {
            this.announceToScreenReader(
                `이미지 생성 진행중: ${data.progress}% 완료. ${data.step}`,
                'status'
            );
        });
        
        // 생성 완료 알림
        globalEventBus.on('generation:complete', () => {
            this.announceToScreenReader(
                '이미지 생성이 완료되었습니다.',
                'alert'
            );
        });
    }

    announceToScreenReader(message, type = 'status') {
        const region = document.getElementById(`${type}-live-region`);
        if (region) {
            region.textContent = message;
            
            // 중복 메시지 방지를 위해 잠시 후 초기화
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }
    }

    // 포커스 관리
    setupFocusManagement() {
        // 모달 포커스 트래핑
        this.trapFocusInModal = (modalElement) => {
            const focusableElements = modalElement.querySelectorAll(`
                button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])
            `);
            
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            const handleTabKey = (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable) {
                            lastFocusable.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastFocusable) {
                            firstFocusable.focus();
                            e.preventDefault();
                        }
                    }
                }
            };
            
            modalElement.addEventListener('keydown', handleTabKey);
            
            // 모달이 열릴 때 첫 번째 요소에 포커스
            if (firstFocusable) {
                firstFocusable.focus();
            }
            
            return () => {
                modalElement.removeEventListener('keydown', handleTabKey);
            };
        };

        // 포커스 표시 강화
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    // 색상 대비 지원
    setupColorContrastSupport() {
        if (this.features.highContrastMode) {
            document.body.classList.add('high-contrast');
        }
        
        // 색상 대비 검사 도구
        this.validateColorContrast = (element) => {
            const styles = window.getComputedStyle(element);
            const backgroundColor = styles.backgroundColor;
            const textColor = styles.color;
            
            const contrast = this.calculateContrastRatio(textColor, backgroundColor);
            
            const minContrast = this.wcagLevel === 'AAA' ? 7 : 4.5;
            
            if (contrast < minContrast) {
                console.warn(`색상 대비가 부족합니다. 현재: ${contrast.toFixed(2)}, 필요: ${minContrast}`);
                return false;
            }
            
            return true;
        };
    }

    calculateContrastRatio(color1, color2) {
        // RGB 값을 relative luminance로 변환
        const getLuminance = (rgb) => {
            const [r, g, b] = rgb.match(/\d+/g).map(n => {
                n = parseInt(n) / 255;
                return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        
        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }

    // 텍스트 크기 조정
    setupTextScaling() {
        const textScaleFactors = [0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.6];
        let currentScaleIndex = 2; // 기본값 1.0
        
        this.adjustTextSize = (direction) => {
            if (direction === 'increase' && currentScaleIndex < textScaleFactors.length - 1) {
                currentScaleIndex++;
            } else if (direction === 'decrease' && currentScaleIndex > 0) {
                currentScaleIndex--;
            }
            
            const scaleFactor = textScaleFactors[currentScaleIndex];
            document.documentElement.style.fontSize = `${16 * scaleFactor}px`;
            
            this.announceToScreenReader(
                `텍스트 크기가 ${Math.round(scaleFactor * 100)}%로 조정되었습니다.`,
                'status'
            );
        };
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    this.adjustTextSize('increase');
                    e.preventDefault();
                } else if (e.key === '-') {
                    this.adjustTextSize('decrease');
                    e.preventDefault();
                }
            }
        });
    }

    // 접근성 도구 모음
    createAccessibilityToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'accessibility-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', '접근성 도구');
        
        toolbar.innerHTML = `
            <button class="a11y-btn" data-action="toggle-contrast" title="고대비 모드 전환">
                🎨 대비
            </button>
            <button class="a11y-btn" data-action="increase-text" title="텍스트 크기 증가">
                🔍+ 텍스트
            </button>
            <button class="a11y-btn" data-action="decrease-text" title="텍스트 크기 감소">
                🔍- 텍스트
            </button>
            <button class="a11y-btn" data-action="toggle-motion" title="애니메이션 감소">
                ⏸️ 모션
            </button>
            <button class="a11y-btn" data-action="focus-outline" title="포커스 강조">
                🎯 포커스
            </button>
        `;
        
        toolbar.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            this.executeAccessibilityAction(action);
        });
        
        document.body.appendChild(toolbar);
    }

    executeAccessibilityAction(action) {
        switch (action) {
            case 'toggle-contrast':
                document.body.classList.toggle('high-contrast');
                break;
            case 'increase-text':
                this.adjustTextSize('increase');
                break;
            case 'decrease-text':
                this.adjustTextSize('decrease');
                break;
            case 'toggle-motion':
                document.body.classList.toggle('reduced-motion');
                break;
            case 'focus-outline':
                document.body.classList.toggle('enhanced-focus');
                break;
        }
    }
}
```

## 🌍 3. 국제화 지원 (i18n)

### 📋 Internationalization System (i18n.js)

#### 🔧 다국어 지원 구현
```javascript
class I18nManager {
    constructor() {
        this.currentLocale = 'ko';
        this.fallbackLocale = 'en';
        this.translations = new Map();
        this.dateFormatter = null;
        this.numberFormatter = null;
        
        this.supportedLocales = [
            { code: 'ko', name: '한국어', rtl: false },
            { code: 'en', name: 'English', rtl: false },
            { code: 'ja', name: '日本語', rtl: false },
            { code: 'zh-CN', name: '简体中文', rtl: false },
            { code: 'zh-TW', name: '繁體中文', rtl: false },
            { code: 'ar', name: 'العربية', rtl: true },
            { code: 'es', name: 'Español', rtl: false },
            { code: 'fr', name: 'Français', rtl: false },
            { code: 'de', name: 'Deutsch', rtl: false },
            { code: 'ru', name: 'Русский', rtl: false }
        ];
        
        this.init();
    }

    async init() {
        // 사용자 언어 감지
        this.detectUserLanguage();
        
        // 번역 파일 로드
        await this.loadTranslations();
        
        // DOM 업데이트
        this.updateDOM();
        
        // 포매터 초기화
        this.initializeFormatters();
        
        // 언어 전환 UI 생성
        this.createLanguageSelector();
    }

    detectUserLanguage() {
        // URL 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        
        if (urlLang && this.supportedLocales.some(l => l.code === urlLang)) {
            this.currentLocale = urlLang;
            return;
        }
        
        // 로컬 스토리지 확인
        const savedLang = localStorage.getItem('preferred-language');
        if (savedLang && this.supportedLocales.some(l => l.code === savedLang)) {
            this.currentLocale = savedLang;
            return;
        }
        
        // 브라우저 언어 감지
        const browserLang = navigator.language || navigator.languages[0];
        const matchedLocale = this.supportedLocales.find(locale => 
            browserLang.startsWith(locale.code) || locale.code.startsWith(browserLang)
        );
        
        if (matchedLocale) {
            this.currentLocale = matchedLocale.code;
        }
    }

    async loadTranslations() {
        try {
            // 현재 언어 번역 로드
            const response = await fetch(`/locales/${this.currentLocale}.json`);
            if (response.ok) {
                const translations = await response.json();
                this.translations.set(this.currentLocale, translations);
            }
            
            // 폴백 언어 번역 로드 (다른 언어인 경우)
            if (this.currentLocale !== this.fallbackLocale) {
                const fallbackResponse = await fetch(`/locales/${this.fallbackLocale}.json`);
                if (fallbackResponse.ok) {
                    const fallbackTranslations = await fallbackResponse.json();
                    this.translations.set(this.fallbackLocale, fallbackTranslations);
                }
            }
        } catch (error) {
            console.error('번역 파일 로딩 실패:', error);
        }
    }

    t(key, params = {}) {
        const currentTranslations = this.translations.get(this.currentLocale) || {};
        const fallbackTranslations = this.translations.get(this.fallbackLocale) || {};
        
        // 중첩된 키 처리 (예: "ui.buttons.generate")
        const getValue = (obj, path) => {
            return path.split('.').reduce((current, key) => current?.[key], obj);
        };
        
        let translation = getValue(currentTranslations, key) || 
                         getValue(fallbackTranslations, key) || 
                         key;
        
        // 파라미터 치환
        Object.entries(params).forEach(([param, value]) => {
            translation = translation.replace(new RegExp(`{{\\s*${param}\\s*}}`, 'g'), value);
        });
        
        return translation;
    }

    // DOM 업데이트
    updateDOM() {
        // data-i18n 속성이 있는 요소들 업데이트
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.hasAttribute('data-i18n-attr')) {
                const attr = element.getAttribute('data-i18n-attr');
                element.setAttribute(attr, translation);
            } else {
                element.textContent = translation;
            }
        });
        
        // HTML 문서 언어 설정
        document.documentElement.lang = this.currentLocale;
        
        // RTL 언어 지원
        const locale = this.supportedLocales.find(l => l.code === this.currentLocale);
        if (locale && locale.rtl) {
            document.documentElement.dir = 'rtl';
            document.body.classList.add('rtl');
        } else {
            document.documentElement.dir = 'ltr';
            document.body.classList.remove('rtl');
        }
    }

    // 언어 전환
    async switchLanguage(localeCode) {
        if (!this.supportedLocales.some(l => l.code === localeCode)) {
            throw new Error(`지원하지 않는 언어입니다: ${localeCode}`);
        }
        
        this.currentLocale = localeCode;
        
        // 번역 파일이 없으면 로드
        if (!this.translations.has(localeCode)) {
            await this.loadTranslations();
        }
        
        // DOM 업데이트
        this.updateDOM();
        
        // 포매터 재초기화
        this.initializeFormatters();
        
        // 로컬 스토리지에 저장
        localStorage.setItem('preferred-language', localeCode);
        
        // 다른 컴포넌트들에 알림
        globalEventBus.emit('language:changed', { locale: localeCode });
    }

    initializeFormatters() {
        this.dateFormatter = new Intl.DateTimeFormat(this.currentLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        this.numberFormatter = new Intl.NumberFormat(this.currentLocale);
        
        this.relativeTimeFormatter = new Intl.RelativeTimeFormat(this.currentLocale, {
            numeric: 'auto'
        });
    }

    formatDate(date) {
        return this.dateFormatter.format(new Date(date));
    }

    formatNumber(number) {
        return this.numberFormatter.format(number);
    }

    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = timestamp - now;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (Math.abs(days) >= 1) {
            return this.relativeTimeFormatter.format(days, 'day');
        } else if (Math.abs(hours) >= 1) {
            return this.relativeTimeFormatter.format(hours, 'hour');
        } else if (Math.abs(minutes) >= 1) {
            return this.relativeTimeFormatter.format(minutes, 'minute');
        } else {
            return this.relativeTimeFormatter.format(seconds, 'second');
        }
    }
}

// 번역 파일 예시 (ko.json)
const koreanTranslations = {
    "ui": {
        "buttons": {
            "generate": "생성",
            "stop": "중단",
            "save": "저장",
            "load": "불러오기",
            "cancel": "취소",
            "confirm": "확인"
        },
        "panels": {
            "modelExplorer": "모델 탐색기",
            "adetailer": "ADetailer 제어",
            "promptPresets": "프롬프트 프리셋",
            "loraSelector": "LoRA 선택기",
            "generationController": "생성 제어기",
            "areaCapture": "영역 캡처",
            "multiDetailer": "다중 디테일러"
        },
        "messages": {
            "generating": "생성 중...",
            "completed": "완료되었습니다",
            "error": "오류가 발생했습니다",
            "loading": "로딩 중..."
        }
    },
    "parameters": {
        "prompt": "프롬프트",
        "negativePrompt": "네거티브 프롬프트",
        "width": "너비",
        "height": "높이",
        "steps": "스텝 수",
        "cfgScale": "CFG 스케일",
        "seed": "시드",
        "strength": "강도"
    },
    "errors": {
        "networkError": "네트워크 오류가 발생했습니다",
        "fileTooBig": "파일 크기가 너무 큽니다",
        "invalidFormat": "지원하지 않는 파일 형식입니다",
        "generationFailed": "이미지 생성에 실패했습니다"
    }
};
```

## 🚀 4. 최종 실행 계획

### 📅 프로젝트 타임라인

#### Phase 1: 기반 구축 (4주)
**주차 1-2: 코어 시스템**
- [ ] 프로젝트 구조 설정 및 개발 환경 구축
- [ ] 코어 모듈 구현 (StateManager, EventBus, Utils)
- [ ] 기본 WebSocket 통신 시스템
- [ ] 에러 핸들링 및 로깅 시스템

**주차 3-4: 캔버스 시스템**
- [ ] Fabric.js 기반 메인 캔버스 구현
- [ ] Three.js 기반 에디트 캔버스 구현
- [ ] 캔버스 브릿지 및 모드 전환 기능
- [ ] 기본 레이어 관리 시스템

#### Phase 2: UI 시스템 (6주)
**주차 5-6: 플로팅 패널 시스템**
- [ ] PanelManager 및 기본 패널 구조
- [ ] 드래그 앤 드롭, 리사이즈 기능
- [ ] 레이아웃 프리셋 시스템

**주차 7-8: 핵심 패널 구현**
- [ ] Model Explorer 패널
- [ ] Generation Controller 패널
- [ ] Prompt Presets 패널

**주차 9-10: 고급 패널 구현**
- [ ] ADetailer Control 패널
- [ ] LoRA Selector 패널
- [ ] Area Capture 및 Multi Detailer 패널

#### Phase 3: 통합 및 최적화 (4주)
**주차 11-12: 시스템 통합**
- [ ] 전체 모듈 간 연동 테스트
- [ ] 백엔드 API 통합
- [ ] WebSocket 실시간 통신 완성

**주차 13-14: 성능 최적화**
- [ ] 캔버스 렌더링 최적화
- [ ] 메모리 관리 최적화
- [ ] 성능 모니터링 시스템

#### Phase 4: 품질 보장 (3주)
**주차 15-16: 테스트 및 접근성**
- [ ] 단위/통합/UI 테스트 구현
- [ ] 접근성 기능 구현 (WCAG 2.1 AA)
- [ ] 다국어 지원 (i18n)

**주차 17: 배포 준비**
- [ ] 보안 검토 및 강화
- [ ] 빌드 시스템 최적화
- [ ] CI/CD 파이프라인 구축

### 🎯 주요 마일스톤
1. **MVP 완성** (8주): 기본 생성 워크플로우 동작
2. **Beta 버전** (12주): 모든 핵심 기능 완성
3. **RC 버전** (16주): 품질 보장 및 최적화 완료
4. **Production 릴리즈** (17주): 배포 준비 완료

### ⚠️ 위험 요소 및 대응책

#### 기술적 위험
**위험**: Fabric.js와 Three.js 간 호환성 문제
**대응**: 초기 프로토타입으로 호환성 검증, 필요시 대안 라이브러리 고려

**위험**: 대용량 이미지 처리시 성능 저하
**대응**: 청크 단위 처리, Web Worker 활용, 메모리 관리 최적화

**위험**: 실시간 WebSocket 연결 안정성
**대응**: 자동 재연결, 폴링 폴백, 큐 시스템 구현

#### 일정 위험
**위험**: 복잡한 UI 시스템으로 인한 개발 지연
**대응**: 각 패널을 독립적으로 개발, MVP 스코프 명확히 정의

**위험**: 접근성 요구사항으로 인한 추가 개발 시간
**대응**: 초기 설계 단계부터 접근성 고려, 점진적 개선 방식

### 📊 성공 지표 (KPIs)

#### 성능 지표
- 초기 로딩 시간 < 3초
- 캔버스 렌더링 60fps 유지
- 메모리 사용량 < 500MB
- API 응답 시간 < 500ms

#### 품질 지표
- 단위 테스트 커버리지 > 80%
- 접근성 점수 > 90 (Lighthouse)
- 보안 취약점 0개
- 브라우저 호환성 95% (Can I Use)

#### 사용성 지표
- 사용자 작업 완료율 > 90%
- 평균 생성 작업 완료 시간 < 5분
- 에러 발생률 < 1%
- 사용자 만족도 > 4.5/5

### 🔧 개발 도구 및 환경

#### 개발 환경
```json
{
  "node": "18.x",
  "npm": "9.x",
  "browsers": ["Chrome 90+", "Firefox 88+", "Safari 14+", "Edge 90+"],
  "development": {
    "bundler": "Webpack 5",
    "transpiler": "Babel",
    "linter": "ESLint + Prettier",
    "testing": "Jest + Playwright",
    "devServer": "Webpack Dev Server"
  },
  "production": {
    "bundler": "Webpack (optimized)",
    "minifier": "Terser",
    "cssProcessor": "PostCSS",
    "deployment": "Docker + Nginx",
    "monitoring": "Custom Analytics + Sentry"
  }
}
```

#### Git 워크플로우
```
main (production) ← develop ← feature/* branches
              ↑
          hotfix/*
```

### 📚 문서화 계획
1. **기술 문서**: API 명세, 아키텍처 가이드
2. **사용자 가이드**: 기능 설명, 튜토리얼
3. **개발자 가이드**: 컴포넌트 개발, 확장 가이드
4. **배포 가이드**: 설치, 설정, 문제 해결

### 🎉 결론

이 상세한 기획서는 T2I 프론트엔드 시스템의 모든 측면을 다루며, 전문가 수준의 AI 이미지 생성 도구를 구축하기 위한 완전한 로드맵을 제공합니다.

**핵심 성공 요인:**
- 모듈화된 아키텍처로 확장성 확보
- 사용자 경험 중심의 설계
- 성능과 접근성의 균형
- 체계적인 테스트 및 품질 관리

이 기획서를 바탕으로 단계적으로 개발을 진행하면 사용자 친화적이면서도 전문적인 T2I 웹 애플리케이션을 성공적으로 구축할 수 있을 것입니다.