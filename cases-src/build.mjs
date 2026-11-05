// Compiles wingspan.jsx and wingspan.css and splices the case into the published bundle.
// This repository has no React source, so the deployed bundle is the base.
//
//   npm i --no-save esbuild && node cases-src/build.mjs
//
// The base file below is kept untouched. Earlier bundles stay in assets/ for rollback.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const BASE = 'assets/index-b6e6d566.js';

const read = p => readFileSync(join(root, p), 'utf8');
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 8);

let bundle = read(BASE);
const start = bundle.indexOf('function Cg(){return c.jsxs("article"');
const end = bundle.indexOf('function Hg(){return c.jsxs("article"');
if (start < 0 || end <= start) throw new Error('Could not locate the Wingspan case');

const { code } = transformSync(read('cases-src/wingspan.jsx'), {
  loader: 'jsx',
  jsxFactory: 'wxh',
  jsxFragment: 'c.Fragment',
  minifyWhitespace: true,
  minifySyntax: true,
  legalComments: 'none',
  target: 'es2020',
});
bundle = bundle.slice(0, start) + code + bundle.slice(end);

for (const [from, to] of [
  ['context:"Grupprojekt med designförslag"', 'context:"Grupprojekt med verklig kund"'],
  ['"UI · Visuell identitet"', '"UI och visuell identitet"'],
  ['"Etik i design · UX/UI"', '"Etik i design och UX/UI"'],
  ['"Kursprojekt / 2026 · 1,5 vecka"', '"Kursprojekt / 2026 / 1,5 vecka"'],
  ['"Pavel Li · Portfolio"', '"Pavel Li / Portfolio"'],
]) {
  if (!bundle.includes(from)) throw new Error(`Missing string: ${from}`);
  bundle = bundle.replace(from, to);
}

const css = transformSync(read('cases-src/wingspan.css'), { loader: 'css', minify: true }).code;
const jsName = `assets/index-${hash(bundle)}.js`;
const cssName = `assets/wingspan-${hash(css)}.css`;
writeFileSync(join(root, jsName), bundle);
writeFileSync(join(root, cssName), css);

let html = read('index.html');
html = html.replace(/\/assets\/index-[A-Za-z0-9_-]+\.js/, `/${jsName}`);
html = html.replace(/\s*<link rel="stylesheet" href="\/assets\/wingspan-[a-z0-9]+\.css">/, '');
html = html.replace('</head>', `  <link rel="stylesheet" href="/${cssName}">\n  </head>`);
writeFileSync(join(root, 'index.html'), html);

console.log(jsName, `${Math.round(bundle.length / 1024)} KB`);
console.log(cssName, `${Math.round(css.length / 1024)} KB`);
