const viewer = document.querySelector('#photo-viewer');
const photographs = JSON.parse(document.querySelector('#viewer-data').textContent);
const fullImage = viewer.querySelector('img');
const label = viewer.querySelector('#viewer-caption');
const position = viewer.querySelector('.viewer-position');
let current = 0;
let opener;
let originalOverflow;

function show(index) {
  current = (index + photographs.length) % photographs.length;
  const photo = photographs[current];
  fullImage.src = photo.src;
  fullImage.alt = photo.alt;
  label.textContent = photo.caption;
  position.textContent = `${current + 1} / ${photographs.length}`;
  const next = new Image();
  next.src = photographs[(current + 1) % photographs.length].src;
}

document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => {
    opener = button;
    show(photographs.findIndex(photo => photo.id === Number(button.dataset.photo)));
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewer.showModal();
    viewer.querySelector('.viewer-close').focus();
  });
});
viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.querySelector('.viewer-prev').addEventListener('click', () => show(current - 1));
viewer.querySelector('.viewer-next').addEventListener('click', () => show(current + 1));
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
viewer.addEventListener('close', () => {
  document.body.style.overflow = originalOverflow;
  opener?.focus({ preventScroll: true });
});

const journalRoot = document.documentElement;
const journalHeader = document.querySelector('body > header');
let lastScrollY = Math.max(0, scrollY);
let scrollDistance = 0;
let menuIdleTimer;
let scheduled = false;
function revealJournalMenu() {
  clearTimeout(menuIdleTimer);
  scrollDistance = 0;
  journalRoot.classList.remove('journal-header-hidden');
}
function updateJournalMenu() {
  const y = Math.max(0, scrollY);
  const delta = y - lastScrollY;
  scrollDistance += Math.abs(delta);
  journalRoot.classList.toggle('journal-scrolled', y > 8);
  if (y < 96 || journalHeader.contains(document.activeElement) || viewer.open) {
    revealJournalMenu();
  } else if (scrollDistance > 8) {
    journalRoot.classList.add('journal-header-hidden');
  }
  lastScrollY = y;
  scheduled = false;
}
addEventListener('scroll', () => {
  clearTimeout(menuIdleTimer);
  menuIdleTimer = setTimeout(revealJournalMenu, 1000);
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateJournalMenu); }
}, { passive: true });
journalHeader.addEventListener('focusin', revealJournalMenu);
addEventListener('pageshow', () => {
  lastScrollY = Math.max(0, scrollY);
  revealJournalMenu();
});
updateJournalMenu();
