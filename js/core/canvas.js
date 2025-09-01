export function initCanvas() {
    const canvas = new fabric.Canvas('main-canvas');

    // --- Custom Properties & Mode Definitions ---
    fabric.Object.customProperties = fabric.Object.customProperties || [];
    fabric.Object.customProperties.push('imageMode');

    const imageModes = {
        'image': { name: '이미지 (I2I)', lock: false },
        'mask': { name: '마스크', lock: false },
        'preprocessor': { name: '전처리 소스', lock: false },
        'controlnet': { name: '컨트롤넷 소스', lock: false },
        'reference': { name: '참조 (잠금)', lock: true },
    };

    const canvasContextMenuActions = {
        'whiteRect': {
            name: '흰 네모',
            action: () => {
                const rect = new fabric.Rect({
                    left: canvas.getCenter().left,
                    top: canvas.getCenter().top,
                    originX: 'center',
                    originY: 'center',
                    fill: 'white',
                    stroke: '#ccc',
                    strokeWidth: 1,
                    width: 200,
                    height: 200,
                    imageMode: 'image'
                });
                canvas.add(rect);
                canvas.renderAll();
            }
        },
        'deleteAll': {
            name: '휴지통 (전체 삭제)',
            action: () => {
                if (canvas.getObjects().length === 0) return;
                if (confirm('캔버스의 모든 객체를 삭제하시겠습니까?')) {
                    canvas.clear();
                    canvas.renderAll();
                }
            }
        },
        'elements': {
            name: 'Elements',
            hasSubmenu: true,
            submenuItems: null // Will be loaded dynamically
        }
    };

    function updateObjectLock(target) {
        const mode = target.imageMode || 'image';
        const shouldLock = imageModes[mode]?.lock || false;
        target.set({ selectable: !shouldLock, evented: !shouldLock, lockMovementX: shouldLock, lockMovementY: shouldLock, lockScalingX: shouldLock, lockScalingY: shouldLock, lockRotation: shouldLock });
    }

    function setObjectImageMode(target, mode) {
        if (!target || !imageModes[mode]) return;
        target.set('imageMode', mode);
        updateObjectLock(target);
        canvas.renderAll();
    }

    // --- Canvas Init & Resize ---
    function resizeCanvas() {
        const container = document.getElementById('canvas-container');
        canvas.setWidth(container.offsetWidth);
        canvas.setHeight(container.offsetHeight);
        canvas.renderAll();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- Drag and Drop --- 
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
    }, false);

    canvasContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = function(f) {
            const data = f.target.result;
            fabric.Image.fromURL(data, function(img) {
                // Center the image on the canvas
                const canvasCenter = canvas.getCenter();
                img.set({
                    left: canvasCenter.left,
                    top: canvasCenter.top,
                    originX: 'center',
                    originY: 'center'
                });
                canvas.add(img);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
    });

    const rect = new fabric.Rect({ left: 100, top: 100, fill: 'red', width: 200, height: 200, angle: 45 });
    rect.set('imageMode', 'image');
    canvas.add(rect);

    // --- Zoom & Pan ---
    let isPanning = false, isSpaceDown = false, lastPosX, lastPosY;
    canvas.on('mouse:wheel', function(opt) {
        opt.e.preventDefault();
        opt.e.stopPropagation();
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    });

    canvas.on('mouse:down', function(opt) {
        if (isSpaceDown) {
            opt.e.preventDefault();
            isPanning = true;
            canvas.selection = false;
            lastPosX = opt.e.clientX;
            lastPosY = opt.e.clientY;
        }
    });

    canvas.on('mouse:move', function(opt) {
        if (isPanning) {
            const e = opt.e;
            const vpt = this.viewportTransform;
            vpt[4] += e.clientX - lastPosX;
            vpt[5] += e.clientY - lastPosY;
            this.requestRenderAll();
            lastPosX = e.clientX;
            lastPosY = e.clientY;
        }
    });

    canvas.on('mouse:up', function(opt) {
        if (isPanning) {
            this.setViewportTransform(this.viewportTransform);
            isPanning = false;
            canvas.selection = true;
        }
    });

    // --- Object Hover Tooltip ---
    let objectTooltip = null;
    canvas.on('mouse:over', function(e) {
        const target = e.target;
        if (!target) return;

        if (objectTooltip) objectTooltip.remove();

        const mode = target.imageMode || 'image';
        const modeName = imageModes[mode]?.name || 'Unknown';

        objectTooltip = document.createElement('div');
        objectTooltip.className = 'canvas-tooltip';
        objectTooltip.textContent = modeName;
        document.body.appendChild(objectTooltip);

        objectTooltip.style.left = `${e.e.pageX + 15}px`;
        objectTooltip.style.top = `${e.e.pageY + 15}px`;
    });

    canvas.on('mouse:move', function(e) {
        if (objectTooltip) {
            objectTooltip.style.left = `${e.e.pageX + 15}px`;
            objectTooltip.style.top = `${e.pageY + 15}px`;
        }
    });

    canvas.on('mouse:out', function(e) {
        if (objectTooltip) {
            objectTooltip.remove();
            objectTooltip = null;
        }
    });

    // --- Helper Functions for Layer Management ---
    function handleLayerAction(target, action) {
        if (!target) return;
        
        switch (action) {
            case 'bringForward':
                canvas.bringForward(target);
                break;
            case 'sendBackward':
                canvas.sendBackwards(target);
                break;
            case 'bringToFront':
                canvas.bringToFront(target);
                break;
            case 'sendToBack':
                canvas.sendToBack(target);
                break;
        }
        canvas.renderAll();
    }

    // --- Helper Functions for Elements ---
    async function loadElementsSubmenu(submenuUl) {
        try {
            const response = await fetch('http://localhost:8001/api/models/elements');
            const elements = await response.json();
            
            elements.forEach(elementFile => {
                const li = document.createElement('li');
                li.textContent = elementFile.replace('.png', '');
                li.dataset.element = elementFile;
                submenuUl.appendChild(li);
            });
        } catch (error) {
            console.error('Failed to load elements:', error);
            const li = document.createElement('li');
            li.textContent = 'Elements 로딩 실패';
            li.style.color = '#999';
            submenuUl.appendChild(li);
        }
    }
    
    function loadElementToCanvas(elementFile) {
        const imagePath = `models/presets/elements/${elementFile}`;
        fabric.Image.fromURL(imagePath, function(img) {
            const canvasCenter = canvas.getCenter();
            img.set({
                left: canvasCenter.left,
                top: canvasCenter.top,
                originX: 'center',
                originY: 'center',
                imageMode: 'image'
            });
            // 적절한 크기로 조정 (최대 300px)
            const maxSize = 300;
            if (img.width > maxSize || img.height > maxSize) {
                const scale = Math.min(maxSize / img.width, maxSize / img.height);
                img.scale(scale);
            }
            canvas.add(img);
            canvas.renderAll();
        });
    }

    // --- Context Menu ---
    canvas.on('mouse:dblclick', function(opt) {
        opt.e.preventDefault();
        opt.e.stopPropagation();
        const target = opt.target;
        const menu = document.getElementById('context-menu');
        const menuList = menu.querySelector('ul');
        menuList.innerHTML = ''; // Clear previous menu items

        let menuItems = {};
        let clickHandler = () => {};

        if (target) {
            // --- Object-specific context menu ---
            
            // Image Mode submenu
            const imageModeLi = document.createElement('li');
            imageModeLi.classList.add('has-submenu');
            imageModeLi.innerHTML = `<span>Image Mode</span>`;
            const subMenuUl = document.createElement('ul');
            subMenuUl.classList.add('submenu');
            Object.entries(imageModes).forEach(([key, {name}]) => {
                const subLi = document.createElement('li');
                subLi.textContent = name;
                subLi.dataset.mode = key;
                subMenuUl.appendChild(subLi);
            });
            imageModeLi.appendChild(subMenuUl);
            menuList.appendChild(imageModeLi);

            // Layer Order submenu
            const layerOrderLi = document.createElement('li');
            layerOrderLi.classList.add('has-submenu');
            layerOrderLi.innerHTML = `<span>레이어 순서</span>`;
            const layerSubMenuUl = document.createElement('ul');
            layerSubMenuUl.classList.add('submenu');
            
            // 앞으로 버튼
            const bringForwardLi = document.createElement('li');
            bringForwardLi.textContent = '앞으로';
            bringForwardLi.dataset.layerAction = 'bringForward';
            layerSubMenuUl.appendChild(bringForwardLi);
            
            // 뒤로 버튼
            const sendBackwardLi = document.createElement('li');
            sendBackwardLi.textContent = '뒤로';
            sendBackwardLi.dataset.layerAction = 'sendBackward';
            layerSubMenuUl.appendChild(sendBackwardLi);
            
            // 맨 앞으로
            const bringToFrontLi = document.createElement('li');
            bringToFrontLi.textContent = '맨 앞으로';
            bringToFrontLi.dataset.layerAction = 'bringToFront';
            layerSubMenuUl.appendChild(bringToFrontLi);
            
            // 맨 뒤로
            const sendToBackLi = document.createElement('li');
            sendToBackLi.textContent = '맨 뒤로';
            sendToBackLi.dataset.layerAction = 'sendToBack';
            layerSubMenuUl.appendChild(sendToBackLi);
            
            layerOrderLi.appendChild(layerSubMenuUl);
            menuList.appendChild(layerOrderLi);

            clickHandler = (e) => {
                const clickedLi = e.target.closest('li');
                if (clickedLi && clickedLi.dataset.mode) {
                    setObjectImageMode(target, clickedLi.dataset.mode);
                } else if (clickedLi && clickedLi.dataset.layerAction) {
                    handleLayerAction(target, clickedLi.dataset.layerAction);
                }
                menu.style.display = 'none';
            };

        } else {
            // --- Canvas background context menu ---
            menuItems = canvasContextMenuActions;
            
            Object.entries(menuItems).forEach(([key, item]) => {
                const li = document.createElement('li');
                li.textContent = item.name;
                li.dataset.action = key;
                
                if (item.hasSubmenu) {
                    li.classList.add('has-submenu');
                    const subMenuUl = document.createElement('ul');
                    subMenuUl.classList.add('submenu');
                    
                    if (key === 'elements') {
                        // Load elements dynamically
                        loadElementsSubmenu(subMenuUl);
                    }
                    
                    li.appendChild(subMenuUl);
                }
                
                menuList.appendChild(li);
            });

            clickHandler = (e) => {
                const clickedLi = e.target.closest('li');
                if (clickedLi && clickedLi.dataset.action) {
                    const action = menuItems[clickedLi.dataset.action]?.action;
                    if (action) action();
                } else if (clickedLi && clickedLi.dataset.element) {
                    // Handle element selection
                    loadElementToCanvas(clickedLi.dataset.element);
                }
                menu.style.display = 'none';
            };
        }

        menu.style.left = `${opt.e.clientX}px`;
        menu.style.top = `${opt.e.clientY}px`;
        menu.style.display = 'block';

        menu.addEventListener('click', clickHandler, { once: true });
        const closeMenu = () => { menu.style.display = 'none'; window.removeEventListener('click', closeMenu); };
        setTimeout(() => window.addEventListener('click', closeMenu), 0);
    });

    // --- Keyboard Listeners ---
    window.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            if (!isSpaceDown) {
                e.preventDefault();
                isSpaceDown = true;
                canvas.defaultCursor = 'grab';
                canvas.renderAll();
            }
        }
        if (e.key === 'Delete') {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length > 0) {
                activeObjects.forEach(object => canvas.remove(object));
                canvas.discardActiveObject().requestRenderAll();
            }
        }
        
        // Layer order shortcuts with numpad
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            // Numpad + and - for layer order
            if (e.code === 'NumpadAdd' || e.key === '+') {
                e.preventDefault();
                handleLayerAction(activeObject, 'bringForward');
                return;
            }
            if (e.code === 'NumpadSubtract' || e.key === '-') {
                e.preventDefault();
                handleLayerAction(activeObject, 'sendBackward');
                return;
            }
        }
        
        if (!activeObject) return;
        let mode = null;
        switch (e.key.toLowerCase()) {
            case 'm': mode = 'mask'; break;
            case 'p': mode = 'preprocessor'; break;
            case 'c': mode = 'controlnet'; break;
            case 'r': mode = 'reference'; break;
        }
        if (mode) {
            e.preventDefault();
            setObjectImageMode(activeObject, mode);
        }
    });

    window.addEventListener('keyup', function(e) {
        if (e.code === 'Space') {
            isSpaceDown = false;
            canvas.defaultCursor = 'default';
            canvas.renderAll();
        }
    });

    return canvas;
}
