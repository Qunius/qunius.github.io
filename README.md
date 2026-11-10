# Pavel Li — Portfolio

My portfolio of UX and visual design projects, with interactive web experiments.

**Live portfolio:** [pavelli.fygital.se](https://pavelli.fygital.se/)

## Project structure

| Path | Contents |
| --- | --- |
| `index.html` and `assets/` | Published portfolio and the assets it loads |
| `cases-src/wingspan.jsx` and `wingspan.css` | Editable Wingspan case |
| `cases-src/portfolio-shell.js` | Retained compiled app, with a placeholder for the Wingspan case |
| `cases-src/build.mjs` | Reproducible build for the case and its published entry points |
| `vikingmuseet/` | Independent student concept for The Viking Museum |
| `digital-fun.html` and `assets/digital-fun/` | Interactive experiments |
| `tests/` | Regression checks for scrolling, viewport handling and interactive experiments |

This repository began as an exported site. It does not contain the original
React source project. The retained shell keeps the existing portfolio working;
the Wingspan case is maintained in readable source. The museum prototype and
interactive experiments use their own HTML, CSS and JavaScript.

## Local development

Use Node.js 20 or later:

```sh
npm ci
npm run build
npm test
npm run check:build
python3 -m http.server 8000
```

Open `http://localhost:8000` to preview the site. GitHub Pages serves the
committed HTML and assets, so include the generated files when changing a case.
The build assigns content hashes and removes the entry files it replaces.
Earlier versions remain in Git history.

## Case context and credits

Each case describes the research, my contribution, collaboration, and the
limitations of the prototype. AI assistance is described in the relevant case;
generated concept imagery is labelled in its captions.

The Viking Museum prototype is an independent student concept, not a commission
from the museum or its official website. Links to the real museum are labelled
as external destinations. The Wingspan case distinguishes observed similarities
with the later website from confirmed project outcomes.

Client screenshots, brands, fonts and other third-party material retain their
respective rights. This repository does not grant a blanket reuse licence for
those assets.
