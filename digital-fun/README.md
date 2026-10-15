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
per-pixel fog age and asynchronous media playback. `rain-window.js` composites
a local botanical rain film with a separate fine-grained condensation layer
using WebGL, with Canvas fallback. The video supplies all water movement;
there are no procedural droplets. Pointer and keyboard wiping reveal the
film beneath. `rain-window.css` provides a quiet photographic mount.

The source image was generated with Higgsfield Seedream 4.5; a transparent
rain-glass variant (job `0da2db5a-9d1f-4450-a97c-d94a4d3686f1`) was animated
with Kling 3.0 Pro (job `b7e0d655-896d-46a8-93ca-841fb57c9086`). The delivered
MP4 is a silent local H.264 loop; the WebP poster is taken from that loop.
No condensation is baked into the interactive foreground.

Wiping holds for 5 simulation seconds then refogs over 20 seconds. Pausing,
leaving the viewport, hiding the tab or enabling reduced motion freezes both
the video and this clock. Manual wiping still works while paused or in reduced
motion. Video is loaded only when first visible and motion is allowed. A
failed media load retains the interactive poster. Playback rejection exposes
a user-driven Continue action; stale play promises cannot override a pause.
Sound is synthesized locally, off until requested, stops while paused,
offscreen or hidden, and resumes only if previously requested. No third-party
assets or audio network requests are made.
