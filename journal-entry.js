// A single, interruptible entrance. Image loading never controls this overlay.
(() => {
  const overlay = document.querySelector('#journal-entry');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!overlay || location.hash || scrollY > 1 || document.hidden || preference.matches ||
      window.performance.getEntriesByType('navigation')[0]?.type === 'back_forward' ||
      typeof overlay.animate !== 'function') return;

  const button = overlay.querySelector('button');
  const animations = [], timers = [], listeners = [];
  let active = true;
  function reveal() {
    const hadFocus = overlay.contains(document.activeElement);
    overlay.hidden = true;
    if (hadFocus) document.querySelector('#journal-main')?.focus({ preventScroll: true });
  }
  function finish() {
    if (!active) return;
    active = false;
    reveal();
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
    overlay.hidden = false;
    button.focus({ preventScroll: true });
    listen(button, 'click', finish);
    listen(window, 'keydown', event => {
      if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) finish();
    });
    for (const type of ['wheel', 'touchmove', 'hashchange', 'popstate', 'pagehide']) {
      listen(window, type, finish, { passive: true });
    }
    listen(document, 'visibilitychange', () => { if (document.hidden) finish(); });
    listen(document, 'focusin', event => { if (!overlay.hidden && !overlay.contains(event.target)) finish(); });
    listen(preference, 'change', finish);

    overlay.querySelectorAll('.journal-entry-dot').forEach((dot, index) => {
      const frames = Array.from({ length: 121 }, (_, step) => {
        const offset = step / 120;
        const distance = (index - (-2 + offset * 10)) / .60;
        return { offset, opacity: .08 + .92 * Math.exp(-.5 * distance * distance) };
      });
      animate(dot, frames, { duration: 1400, easing: 'linear' });
    });
    const exit = animate(overlay, [{ opacity: 1 }, { opacity: 0 }], {
      delay: 1250, duration: 220, easing: 'ease-out',
    });
    // Restore the original first-photo zoom/blur arrival as the dots clear.
    // Only this first photograph animates; image preparation stays independent.
    const arrival = [
      { opacity: 0, filter: 'blur(8px)', transform: 'scale(1.12)' },
      { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
    ];
    const hero = document.querySelector('.hero>img');
    const caption = document.querySelector('.hero .window-label');
    if (hero) animate(hero, arrival, { delay: 1250, duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)' });
    if (caption) animate(caption, arrival, { delay: 1400, duration: 800, easing: 'ease' });
    const start = document.timeline.currentTime;
    if (start !== null) animations.forEach(animation => { animation.startTime = start; });
    exit.finished.then(reveal, finish);
    Promise.all(animations.map(animation => animation.finished)).then(finish, finish);
  } catch {
    finish();
  }
})();
