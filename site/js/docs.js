/* Progressive enhancements. Article content, navigation and downloads are static HTML. */
(() => {
  const search = document.getElementById('docSearch');
  const sidebar = document.getElementById('docSide');
  search?.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    sidebar.querySelectorAll('[data-script-name]').forEach(link => {
      link.hidden = !link.dataset.scriptName.includes(query);
    });
    sidebar.querySelectorAll('.grp').forEach(group => {
      let next = group.nextElementSibling;
      let visible = false;
      while (next && !next.classList.contains('grp')) {
        if (!next.hidden) visible = true;
        next = next.nextElementSibling;
      }
      group.hidden = !visible;
    });
  });
  const toc = document.getElementById('docToc');
  if ('IntersectionObserver' in window && toc) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        toc.querySelectorAll('a').forEach(link => link.classList.toggle('on', link.hash === '#' + entry.target.id));
      }
    }, { rootMargin: '-10% 0px -70% 0px' });
    document.querySelectorAll('.md h2[id]').forEach(heading => observer.observe(heading));
  }
  if (window.lucide) lucide.createIcons();
})();
