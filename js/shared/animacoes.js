/** --- ANIMAÇÕES E EFEITOS PARA PAGINAS --- **/

document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth scrolling para links internos ---
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return; // só reage se for link interno
        e.preventDefault();

        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // --- Animação para estatísticas ---
    const stats = document.querySelectorAll('.stat-card h3, .stat-item h3');
    if (stats.length) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transition = 'transform 0.3s ease';
                    entry.target.style.transform = 'scale(1.1)';
                    setTimeout(() => entry.target.style.transform = 'scale(1)', 300);
                }
            });
        }, { threshold: 0.3 }); // dispara quando ~30% do elemento está visível

        stats.forEach(stat => observer.observe(stat));
    }
});

