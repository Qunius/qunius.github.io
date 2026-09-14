// Prefetch from normal-flow containers, before the photograph is on screen.
// The large fixed/clipped windows load eagerly in HTML; they must not depend
// on the browser's lazy-loading intersection of their clipped image itself.
(() => {
  function prepare(image) {
    image.loading = 'eager';
    // Request decoded pixels in advance too; completion never gates visibility or scroll.
    if (typeof image.decode === 'function') image.decode().catch(() => {});
  }
  document.querySelectorAll('#journal-main .window>img').forEach(prepare);
  if (!('IntersectionObserver' in window)) return; // Native lazy loading remains the fallback.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const image = entry.target.querySelector('img');
      if (image) prepare(image);
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '1800px 0px', threshold: 0 });

  document.querySelectorAll('#journal-main .photo-open').forEach(container => {
    if (container.querySelector('img')?.loading === 'lazy') observer.observe(container);
  });
})();
