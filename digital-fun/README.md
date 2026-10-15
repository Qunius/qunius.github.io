# Digital fun

An open-ended home for Pavel's interactive experiments: `/digital-fun.html`.
The portfolio links here from the main navigation and “Annat roligt”.

Each experiment is an `<article class="experiment">` in `digital-fun.html`.
Future pieces can have their own markup, colours, media and scripts; they do
not need to use Canvas or ASCII. Add their styles under `assets/digital-fun/`.
Only load their animation while visible, respect reduced motion, and provide
keyboard controls for interactive pieces.

The first piece is Temperaturbrasa. `temperature-fire.js` contains the original
standalone artwork's engine and settings, including finite fuel. `digital-fun.js`
owns page controls (pause/new wood) and scroll/history lifecycle. The canvas is
transparent; the stage provides the dark background. No dependencies or build
step are needed for this page. Scripts stay external to retain the site's CSP.

The current portfolio homepage is supplied as a built bundle. When changing it,
update the entry point in `index.html` to a new content-hashed filename. Retain
the existing photojournal, case scrolling and typography. Local tests:
`node --test tests/*.test.mjs`.
