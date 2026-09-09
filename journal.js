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

const chapters = [...document.querySelectorAll('.intro[id]')];
const links = [...document.querySelectorAll('.journal-nav a')];
let scheduled = false;
function updateChapter() {
  const active = chapters.filter(chapter => chapter.getBoundingClientRect().top <= innerHeight * .35).at(-1);
  links.forEach(link => {
    if (link.hash === `#${active?.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scheduled = false;
}
addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateChapter); }
}, { passive: true });
updateChapter();
