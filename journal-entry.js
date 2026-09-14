// The first photograph arrives immediately. No loader or image-readiness gate.
(() => {
  const hero = document.querySelector('.hero>img');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || location.hash || scrollY > 1 || document.hidden || preference.matches ||
      window.performance.getEntriesByType('navigation')[0]?.type === 'back_forward' ||
      typeof hero.animate !== 'function') return;

  const animations = [], timers = [], listeners = [];
  let active = true;
  function finish() {
    if (!active) return;
    active = false;
    timers.forEach(clearTimeout);
    animations.forEach(animation => animation.cancel());
    listeners.forEach(([target, type, callback]) => target.removeEventListener(type, callback));
  }
  function listen(target, type, callback, options) {
    target.addEventListener(type, callback, options);
    listeners.push([target, type, callback]);
  }
  function animate(element, frames, options) {
    const animation = element.animate(frames, { fill: 'both', ...options });
    animations.push(animation);
    return animation;
  }

  try {
    // Set the deadline before starting motion; never await load, decode or fonts.
    timers.push(setTimeout(finish, 3000));
    listen(window, 'keydown', event => {
      if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) finish();
    });
    for (const type of ['wheel', 'touchmove', 'hashchange', 'popstate', 'pagehide']) {
      listen(window, type, finish, { passive: true });
    }
    listen(document, 'visibilitychange', () => { if (document.hidden) finish(); });
    listen(preference, 'change', finish);

    // Keep the original first-photo zoom/blur arrival, without a prelude.
    // Only this first photograph animates; image preparation stays independent.
    const arrival = [
      { opacity: 0, filter: 'blur(8px)', transform: 'scale(1.12)' },
      { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
    ];
    const caption = document.querySelector('.hero .window-label');
    animate(hero, arrival, { duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)' });
    if (caption) animate(caption, arrival, { delay: 150, duration: 800, easing: 'ease' });
    const start = document.timeline.currentTime;
    if (start !== null) animations.forEach(animation => { animation.startTime = start; });
    Promise.all(animations.map(animation => animation.finished)).then(finish, finish);
  } catch {
    finish();
  }
})();
