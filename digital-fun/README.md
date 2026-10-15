# Digital fun

An open-ended home for Pavel's interactive experiments: `/digital-fun.html`.
The portfolio links here from the main navigation and “Annat roligt”.

Each experiment is an `<article class="project-entry">` in `digital-fun.html`.
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

Regn mot rutan follows the fire. `rain-core.js` owns the simulation clock,
per-pixel fog age and merging droplets. `rain-window.js` owns WebGL rendering,
Canvas fallback, pointer/keyboard controls and locally synthesized Web Audio.
`rain-window.css` is scoped to this piece. The plant-only background was generated
with Higgsfield Seedream 4.5 (basic, 4:3); job
`4bd4d625-932e-4cc6-b6f9-5810da10a83b`. It is served locally as WebP.
The glass and droplets are rendered independently; the photo has no baked-in rain.

Wiping holds for 5 simulation seconds then refogs over 20 seconds. Pausing,
leaving the viewport, hiding the tab or enabling reduced motion freezes this
clock. Manual wiping still works while paused or in reduced motion. Sound is
off until requested, stops while paused/offscreen/hidden, and resumes only if
previously requested. No third-party assets or audio network requests are made.
