// A fixed dialog uses the layout viewport. Mobile browser chrome can leave the
// visible viewport shifted after showModal() focuses and locks the page.
export function fitCaseViewport(panel, view = window) {
  const viewport = view.visualViewport;
  const previous = {
    top: panel.style.top,
    height: panel.style.height,
    bottom: panel.style.bottom,
  };
  let frame = null;

  function update() {
    frame = null;
    // Let the browser magnify and pan the content normally during pinch zoom.
    if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
    const height = viewport ? viewport.height : view.innerHeight;
    if (!(height > 0)) return;
    panel.style.top = `${viewport ? viewport.offsetTop : 0}px`;
    panel.style.height = `${height}px`;
    panel.style.bottom = 'auto';
  }

  function schedule() {
    if (frame === null) frame = view.requestAnimationFrame(update);
  }

  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  view.addEventListener('resize', schedule);
  update();
  // Opening/focusing the dialog can settle its viewport in the next frame.
  schedule();

  return () => {
    viewport?.removeEventListener('resize', schedule);
    viewport?.removeEventListener('scroll', schedule);
    view.removeEventListener('resize', schedule);
    if (frame !== null) view.cancelAnimationFrame(frame);
    Object.assign(panel.style, previous);
  };
}
