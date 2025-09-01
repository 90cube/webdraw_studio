export function initDraggablePanels() {
    const panels = document.querySelectorAll('.panel');
    let highestZIndex = 100;
    let draggedPanel = null;

    // 스냅 범위 설정 (화면 가장자리 20px 내)
    const SNAP_THRESHOLD = 30;
    const EDGE_MARGIN = 20;

    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        if (!header) return;

        let isDragging = false;
        let offsetX, offsetY;
        let startX, startY;
        let hasMoved = false;

        // 패널 클릭 시 Z-index 업데이트
        panel.addEventListener('mousedown', (e) => {
            if (!e.target.classList.contains('collapse-toggle')) {
                bringToFront(panel);
            }
        });

        header.addEventListener('mousedown', (e) => {
            // 드래그 대상이 토글 버튼이면 드래그 시작 안함
            if (e.target.classList.contains('collapse-toggle')) return;

            isDragging = true;
            draggedPanel = panel;
            hasMoved = false;
            
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            startX = rect.left;
            startY = rect.top;
            
            // 드래그 시작 시 애니메이션 제거
            panel.style.transition = 'none';
            panel.classList.add('dragging');
            
            header.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || draggedPanel !== panel) return;

            hasMoved = true;
            
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            // 화면 경계 제한
            const rect = panel.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width + (rect.width - 100); // 100px 정도는 밖으로 나가도 OK
            const maxY = window.innerHeight - 44; // 헤더는 항상 보이도록
            
            newX = Math.max(-rect.width + 100, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            panel.style.left = `${newX}px`;
            panel.style.top = `${newY}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            
            // 위치 예상 표시 (스냅 가이드)
            showSnapGuide(newX, newY, rect.width, rect.height);
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging || draggedPanel !== panel) return;
            
            isDragging = false;
            draggedPanel = null;
            
            // 드래그 종료 후 애니메이션 복구
            panel.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            panel.classList.remove('dragging');
            
            header.style.cursor = 'move';
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            
            hideSnapGuide();
            
            if (hasMoved) {
                // 스냅 처리
                snapToEdgeIfClose(panel);
                // 위치에 따른 클래스 업데이트
                updatePositionClass(panel);
            }
        });
    });

    function bringToFront(panel) {
        highestZIndex += 1;
        panel.style.zIndex = highestZIndex;
    }

    function snapToEdgeIfClose(panel) {
        const rect = panel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let snapX = rect.left;
        let snapY = rect.top;
        let snapped = false;
        
        // 왼쪽 가장자리 스냅
        if (rect.left < SNAP_THRESHOLD) {
            snapX = EDGE_MARGIN;
            snapped = true;
        }
        // 오른쪽 가장자리 스냅
        else if (rect.right > window.innerWidth - SNAP_THRESHOLD) {
            snapX = window.innerWidth - rect.width - EDGE_MARGIN;
            snapped = true;
        }
        
        // 위쪽 가장자리 스냅
        if (rect.top < SNAP_THRESHOLD) {
            snapY = EDGE_MARGIN;
            snapped = true;
        }
        // 아래쪽 가장자리 스냅
        else if (rect.bottom > window.innerHeight - SNAP_THRESHOLD) {
            snapY = window.innerHeight - rect.height - EDGE_MARGIN;
            snapped = true;
        }
        
        if (snapped) {
            panel.style.left = `${snapX}px`;
            panel.style.top = `${snapY}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        }
    }

    function updatePositionClass(panel) {
        const rect = panel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 기존 위치 클래스 제거
        panel.classList.remove('position-left', 'position-right', 'position-top', 'position-bottom');
        
        // 새로운 위치 클래스 추가
        if (centerX < window.innerWidth / 3) {
            panel.classList.add('position-left');
        } else if (centerX > window.innerWidth * 2 / 3) {
            panel.classList.add('position-right');
        }
        
        if (centerY < window.innerHeight / 3) {
            panel.classList.add('position-top');
        } else if (centerY > window.innerHeight * 2 / 3) {
            panel.classList.add('position-bottom');
        }
        
        // 접기 버튼 아이콘 업데이트
        updateCollapseIcon(panel);
    }

    function updateCollapseIcon(panel) {
        const collapseBtn = panel.querySelector('.collapse-toggle');
        if (!collapseBtn) return;
        
        let icons = ['−', '+']; // Default (center or top)
        if (panel.classList.contains('position-left')) icons = ['<', '>'];
        if (panel.classList.contains('position-right')) icons = ['>', '<'];
        if (panel.classList.contains('position-bottom')) icons = ['v', '^'];
        
        collapseBtn.textContent = panel.classList.contains('collapsed') ? icons[1] : icons[0];
    }

    // 스냅 가이드 표시
    function showSnapGuide(x, y, width, height) {
        let guide = document.getElementById('snap-guide');
        if (!guide) {
            guide = document.createElement('div');
            guide.id = 'snap-guide';
            guide.style.cssText = `
                position: fixed;
                pointer-events: none;
                border: 2px dashed #6cb6ff;
                background: rgba(108, 182, 255, 0.1);
                border-radius: 8px;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            document.body.appendChild(guide);
        }
        
        // 스냅 예상 위치 계산
        let snapX = x, snapY = y;
        let shouldShow = false;
        
        if (x < SNAP_THRESHOLD) {
            snapX = EDGE_MARGIN;
            shouldShow = true;
        } else if (x + width > window.innerWidth - SNAP_THRESHOLD) {
            snapX = window.innerWidth - width - EDGE_MARGIN;
            shouldShow = true;
        }
        
        if (y < SNAP_THRESHOLD) {
            snapY = EDGE_MARGIN;
            shouldShow = true;
        } else if (y + height > window.innerHeight - SNAP_THRESHOLD) {
            snapY = window.innerHeight - height - EDGE_MARGIN;
            shouldShow = true;
        }
        
        if (shouldShow) {
            guide.style.left = `${snapX}px`;
            guide.style.top = `${snapY}px`;
            guide.style.width = `${width}px`;
            guide.style.height = `${height}px`;
            guide.style.opacity = '1';
        } else {
            guide.style.opacity = '0';
        }
    }
    
    function hideSnapGuide() {
        const guide = document.getElementById('snap-guide');
        if (guide) {
            guide.style.opacity = '0';
        }
    }

    // 리사이즈 시 패널 위치 조정
    window.addEventListener('resize', () => {
        panels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            let x = rect.left;
            let y = rect.top;
            
            // 화면 밖으로 나간 패널 조정
            if (x + rect.width > window.innerWidth) {
                x = window.innerWidth - rect.width - EDGE_MARGIN;
            }
            if (y + rect.height > window.innerHeight) {
                y = window.innerHeight - rect.height - EDGE_MARGIN;
            }
            
            panel.style.left = `${Math.max(EDGE_MARGIN, x)}px`;
            panel.style.top = `${Math.max(EDGE_MARGIN, y)}px`;
            
            updatePositionClass(panel);
        });
    });
}

export function initCollapsiblePanels() {
    document.body.addEventListener('click', (e) => {
        if (!e.target.classList.contains('collapse-toggle')) return;

        const button = e.target;
        const panel = button.closest('.panel');
        if (!panel) {
            console.log('🚨 [DEBUG] No panel found for collapse button');
            return;
        }

        console.log('🔄 [DEBUG] Collapse button clicked');
        console.log('📋 [DEBUG] Panel ID:', panel.id);
        console.log('📋 [DEBUG] Panel classes BEFORE:', Array.from(panel.classList));
        
        const wasCollapsed = panel.classList.contains('collapsed');
        panel.classList.toggle('collapsed');
        const isNowCollapsed = panel.classList.contains('collapsed');
        
        console.log('📋 [DEBUG] Panel classes AFTER:', Array.from(panel.classList));
        console.log('🔄 [DEBUG] Collapse state changed:', wasCollapsed, '→', isNowCollapsed);
        
        // CSS 스타일 적용 상태 확인
        const computedStyle = window.getComputedStyle(panel);
        console.log('🎨 [DEBUG] Panel computed width:', computedStyle.width);
        console.log('🎨 [DEBUG] Panel computed height:', computedStyle.height);
        
        const panelContent = panel.querySelector('.panel-content');
        if (panelContent) {
            const contentStyle = window.getComputedStyle(panelContent);
            console.log('🎨 [DEBUG] Content display:', contentStyle.display);
        }
        
        const panelTitle = panel.querySelector('.panel-title');
        if (panelTitle) {
            const titleStyle = window.getComputedStyle(panelTitle);
            console.log('🎨 [DEBUG] Title display:', titleStyle.display);
        }
        
        // 아이콘 업데이트는 updateCollapseIcon 함수에서 처리
        updatePanelCollapseIcon(panel);
    });
    
    function updatePanelCollapseIcon(panel) {
        const collapseBtn = panel.querySelector('.collapse-toggle');
        if (!collapseBtn) {
            console.log('🚨 [DEBUG] No collapse button found in panel:', panel.id);
            return;
        }
        
        let icons = ['−', '+']; // Default (center or top)
        let position = 'center/top';
        
        if (panel.classList.contains('position-left')) {
            icons = ['<', '>'];
            position = 'left';
        }
        if (panel.classList.contains('position-right')) {
            icons = ['>', '<'];
            position = 'right';
        }
        if (panel.classList.contains('position-bottom')) {
            icons = ['v', '^'];
            position = 'bottom';
        }
        
        const isCollapsed = panel.classList.contains('collapsed');
        const newIcon = isCollapsed ? icons[1] : icons[0];
        
        console.log('🔄 [DEBUG] Updating icon for panel:', panel.id);
        console.log('📍 [DEBUG] Panel position:', position);
        console.log('🔄 [DEBUG] Is collapsed:', isCollapsed);
        console.log('🎯 [DEBUG] Icon changed:', collapseBtn.textContent, '→', newIcon);
        
        collapseBtn.textContent = newIcon;
    }
    
    // 초기 패널들의 아이콘 설정
    console.log('🚀 [DEBUG] Initializing collapsible panels...');
    const panels = document.querySelectorAll('.panel');
    console.log('📋 [DEBUG] Found', panels.length, 'panels');
    
    panels.forEach(panel => {
        console.log('🏷️ [DEBUG] Initializing panel:', panel.id, 'with classes:', Array.from(panel.classList));
        updatePanelCollapseIcon(panel);
    });
    
    console.log('✅ [DEBUG] Collapsible panels initialization complete');
}
