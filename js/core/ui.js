export function initDraggablePanels() {
    const panels = document.querySelectorAll('.panel');

    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        if (!header) return;

        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            // 드래그 대상이 토글 버튼이면 드래그 시작 안함
            if (e.target.classList.contains('collapse-toggle')) return;

            isDragging = true;
            offsetX = e.clientX - panel.getBoundingClientRect().left;
            offsetY = e.clientY - panel.getBoundingClientRect().top;
            
            panel.style.cursor = 'grabbing';
            document.body.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            panel.style.left = `${newX}px`;
            panel.style.top = `${newY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                panel.style.cursor = 'default';
                document.body.style.cursor = 'default';
            }
        });
    });
}

export function initCollapsiblePanels() {
    document.body.addEventListener('click', (e) => {
        if (!e.target.classList.contains('collapse-toggle')) return;

        const button = e.target;
        const panel = button.closest('.panel');
        if (!panel) return;

        panel.classList.toggle('collapsed');
        
        let icons = ['−', '+']; // Default (top)
        if (panel.classList.contains('position-left')) icons = ['<', '>'];
        if (panel.classList.contains('position-right')) icons = ['>', '<'];
        if (panel.classList.contains('position-bottom')) icons = ['v', '^'];

        button.textContent = panel.classList.contains('collapsed') ? icons[1] : icons[0];
    });
}
