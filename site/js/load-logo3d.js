// Load the decorative WebGL scene only when its section approaches the viewport.
const stage = document.getElementById('logo3d');
if (stage) {
  stage.classList.add('logo3d--fallback');
  const load = () => import('./logo3d.js').catch(() => stage.classList.add('logo3d--fallback'));
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void load(); }
    }, { rootMargin: '250px' });
    observer.observe(stage);
  }
}
