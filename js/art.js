document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();

        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        const rotateX = y * 6;
        const rotateY = -x * 6;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        card.querySelectorAll('.layer').forEach((layer, index) => {
            const depth = (index + 1) * 8;

            layer.style.transform = `
                translateZ(${depth}px)
                translateX(${x * depth * 0.3}px)
                translateY(${y * depth * 0.3}px)
            `;
        });
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';

        card.querySelectorAll('.layer').forEach(layer => {
            layer.style.transform = '';
        });
    });
});