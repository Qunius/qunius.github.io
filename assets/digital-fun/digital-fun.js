// Controls belong to the page; the artwork keeps its original movement and colours.
(() => {
  'use strict';
  const canvas = document.getElementById('fire');
  const controls = document.getElementById('fire-controls');
  const pauseButton = document.getElementById('pause-fire');
  const resetButton = document.getElementById('reset-fire');
  const status = document.getElementById('fire-status');
  const motionNote = document.getElementById('motion-note');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let fire;
  let userPaused = false;
  let visible = !('IntersectionObserver' in window);
  let activePage = true;

  function sync() {
    if (!fire) return;
    if (userPaused || !visible || !activePage) fire.pause();
    else fire.resume();
    pauseButton.textContent = motion.matches ? 'Stillbild' : userPaused ? 'Fortsätt' : 'Pausa';
    pauseButton.setAttribute('aria-pressed', String(userPaused));
    pauseButton.disabled = motion.matches;
    motionNote.hidden = !motion.matches;
  }

  function start() {
    try {
      fire?.destroy();
      fire = new window.TemperatureFire(canvas);
      controls.hidden = false;
      document.getElementById('fire-error').hidden = true;
      sync();
    } catch (error) {
      fire?.destroy();
      fire = null;
      controls.hidden = true;
      document.getElementById('fire-error').hidden = false;
      console.error('Temperaturbrasan kunde inte starta.', error);
    }
  }

  function togglePause() {
    if (motion.matches) return;
    userPaused = !userPaused;
    sync();
  }

  pauseButton.addEventListener('click', togglePause);
  resetButton.addEventListener('click', () => {
    start();
    if (fire) status.textContent = userPaused ? 'Ny ved på plats. Brasan är pausad.' : 'Ny ved på plats.';
  });
  canvas.addEventListener('keydown', event => {
    if (event.code !== 'Space') return;
    event.preventDefault();
    if (!event.repeat) togglePause();
  });
  motion.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { activePage = false; sync(); });
  window.addEventListener('pageshow', () => { activePage = true; sync(); });

  start();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0 });
    observer.observe(canvas);
  }
})();
