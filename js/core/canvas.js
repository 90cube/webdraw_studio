export function initCanvas() {
    const canvas = new fabric.Canvas('main-canvas');

    // --- Custom Properties & Mode Definitions ---
    fabric.Object.customProperties = fabric.Object.customProperties || [];
    fabric.Object.customProperties.push('imageMode');

    const imageModes = {
        'image': { name: '이미지 (I2I)', lock: false, badge: { letter: 'I', color: '#4285F4' } },
        'mask': { name: '마스크', lock: false, badge: { letter: 'M', color: '#DB4437' } },
        'preprocessor': { name: '전처리 소스', lock: false, badge: { letter: 'P', color: '#F4B400' } },
        'controlnet': { name: '컨트롤넷 소스', lock: false, badge: { letter: 'C', color: '#0F9D58' } },
        'reference': { name: '참조 (잠금)', lock: true, badge: { letter: 'R', color: '#757575' } },
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
        console.log(`Object mode set to: ${mode}`);
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

    const rect = new fabric.Rect({ left: 100, top: 100, fill: 'red', width: 200, height: 200, angle: 45 });
    rect.set('imageMode', 'image');
    canvas.add(rect);
    console.log('Fabric.js canvas initialized.');

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

    // --- Context Menu ---
    canvas.on('mouse:dblclick', function(opt) {
        const target = opt.target;
        if (!target) return;
        opt.e.preventDefault();
        opt.e.stopPropagation();
        const menu = document.getElementById('context-menu');
        const menuList = menu.querySelector('ul');
        menuList.innerHTML = '';
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
        menu.style.left = `${opt.e.clientX}px`;
        menu.style.top = `${opt.e.clientY}px`;
        menu.style.display = 'block';
        const menuClickHandler = (e) => {
            const clickedLi = e.target.closest('li');
            if (clickedLi && clickedLi.dataset.mode) {
                setObjectImageMode(target, clickedLi.dataset.mode);
            }
            menu.style.display = 'none';
        };
        menu.addEventListener('click', menuClickHandler, { once: true });
        const closeMenu = () => { menu.style.display = 'none'; window.removeEventListener('click', closeMenu); };
        setTimeout(() => window.addEventListener('click', closeMenu), 0);
    });

    // --- Badge Rendering ---
    canvas.on('after:render', function() {
        const activeObj = canvas.getActiveObject();
        if (!activeObj) return;
        const mode = activeObj.imageMode || 'image';
        const badge = imageModes[mode]?.badge;
        if (!badge) return;
        const ctx = canvas.getContext();
        ctx.save();
        const zoom = canvas.getZoom();
        const badgeSize = 18 / zoom;
        const padding = 4 / zoom;
        const offset = 48 / zoom;
        const p = activeObj.getPointByOrigin('left', 'top');
        p.x -= offset;
        p.y -= offset;
        ctx.fillStyle = badge.color;
        ctx.fillRect(p.x, p.y, badgeSize + padding * 2, badgeSize + padding * 2);
        ctx.fillStyle = 'white';
        ctx.font = `${badgeSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(badge.letter, p.x + padding, p.y + padding);
        ctx.restore();
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
        const activeObject = canvas.getActiveObject();
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
