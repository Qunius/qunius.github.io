// Build the editable Wingspan case into the retained portfolio shell.
// The shell contains the rest of the published app; the original React project
// is not available in this repository. See README.md for the source boundaries.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = p => readFileSync(join(root, p), 'utf8');
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 8);
const marker = '/* WINGSPAN_CASE */';
const shell = read('cases-src/portfolio-shell.js');
if (shell.split(marker).length !== 2) {
  throw new Error('The portfolio shell must contain exactly one Wingspan marker.');
}

const { code } = transformSync(read('cases-src/wingspan.jsx'), {
  loader: 'jsx',
  jsxFactory: 'wxh',
  jsxFragment: 'c.Fragment',
  minifyWhitespace: true,
  minifySyntax: true,
  legalComments: 'none',
  target: 'es2020',
});
const bundle = shell.replace(marker, () => code);
const css = transformSync(read('cases-src/wingspan.css'), { loader: 'css', minify: true }).code;
const jsName = `assets/index-${hash(bundle)}.js`;
const cssName = `assets/wingspan-${hash(css)}.css`;

const currentHtml = read('index.html');
const oldJs = currentHtml.match(/src="\/(assets\/index-[A-Za-z0-9_-]+\.js)"/)?.[1];
const oldCss = currentHtml.match(/href="\/(assets\/wingspan-[A-Za-z0-9_-]+\.css)"/)?.[1];
if (!oldJs || !oldCss) throw new Error('Could not locate the portfolio entry points.');
const html = currentHtml.replace(`/${oldJs}`, `/${jsName}`).replace(`/${oldCss}`, `/${cssName}`);
const outputs = new Map([[jsName, bundle], [cssName, css], ['index.html', html]]);

if (process.argv.includes('--check')) {
  for (const [path, expected] of outputs) {
    if (!existsSync(join(root, path)) || read(path) !== expected) {
      throw new Error(`Published output is out of date: ${path}. Run npm run build.`);
    }
  }
  console.log('Published output matches its source.');
} else {
  for (const [path, content] of outputs) writeFileSync(join(root, path), content);
  // Only remove the two entry files that this build has just replaced.
  // Git history retains earlier builds without serving them as unused assets.
  for (const oldPath of [oldJs, oldCss]) {
    if (!outputs.has(oldPath) && existsSync(join(root, oldPath))) unlinkSync(join(root, oldPath));
  }
  console.log(jsName, `${Math.round(Buffer.byteLength(bundle) / 1024)} KB`);
  console.log(cssName, `${Math.round(Buffer.byteLength(css) / 1024)} KB`);
}
