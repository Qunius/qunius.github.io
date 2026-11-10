# Digital fun

Pavel Li's interactive experiments, published at `/digital-fun.html` and linked
from the portfolio's “Annat roligt” section.

## Structure

Each experiment is an `<article class="project-entry">` in `digital-fun.html`.
Styles, scripts and media live under `assets/digital-fun/`. Experiments can use
their own visual language and implementation.

Temperaturbrasa uses `temperature-fire.js` for its fire simulation and finite
fuel. `digital-fun.js` handles pause, new wood and the page's scroll and history
lifecycle. The canvas is transparent, with a dark background supplied by the
stage. This page has no external dependencies or build step; scripts remain
external to preserve the site's Content Security Policy.

## Development

Animations run only while visible. Interactive pieces support keyboard input
and respect reduced-motion preferences. Changes should preserve the existing
photojournal, case scrolling and typography.

Run the regression checks from the repository root:

```sh
node --test tests/*.test.mjs
```

See the root README for the portfolio homepage's build workflow.

## Unpublished work

Regn mot rutan has been unpublished since 16 October 2026. The complete work is
preserved on `draft/regn-mot-rutan-2026-10-16` at commit
`751b046f4578e7145f29d25f2a68d8c028aa2158` and is not part of the live portfolio.
Project policy: publication requires Pavel's explicit approval.
