#!/usr/bin/env node
// The entire static site generator. Plain Node.js, no framework:
//   read Markdown -> render HTML -> wrap in a template string -> write a file.
// Run with: npm run build   (outputs to ./docs, which GitHub Pages serves directly)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import { BASE, categories } from './site.config.mjs';
import { renderMarkdown } from './lib/markdown.mjs';
import { renderShell, renderPatternPage, renderCategoryIndex } from './templates/layout.mjs';
import { renderHome, renderAbout, renderCheatsheet, render404 } from './templates/pages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, 'content');
const OUT_DIR = path.join(__dirname, 'docs');
const ASSETS_DIR = path.join(__dirname, 'assets');

function finalize(html) {
  // Resolve the __BASE__ placeholder left by cross-links inside markdown files.
  return html.replaceAll('__BASE__', BASE);
}

function writeFile(relPath, html) {
  const fullPath = path.join(OUT_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, finalize(html), 'utf-8');
}

function copyAsset(name) {
  fs.copyFileSync(path.join(ASSETS_DIR, name), path.join(OUT_DIR, name));
}

// ---------- 1. Load and render every content entry ----------
function loadCategory(categoryKey) {
  const dir = path.join(CONTENT_DIR, categoryKey);
  if (!fs.existsSync(dir)) return [];

  const entries = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title,
        order: data.order ?? 0,
        summary: data.summary ?? '',
        tags: data.tags ?? [],
        bodyHtml: renderMarkdown(content),
      };
    })
    .sort((a, b) => a.order - b.order);

  return entries;
}

const contentByCategory = Object.fromEntries(categories.map((c) => [c.key, loadCategory(c.key)]));

// ---------- 2. Clean output dir ----------
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- 3. Pattern/principle pages + category indexes ----------
let totalPages = 0;

for (const category of categories) {
  const entries = contentByCategory[category.key];
  const sidebarItems = entries.map((e) => ({ title: e.title, path: `${category.path}${e.slug}/` }));

  entries.forEach((entry, i) => {
    totalPages++;
    const prev = i > 0 ? { title: entries[i - 1].title, path: `${category.path}${entries[i - 1].slug}/` } : null;
    const next = i < entries.length - 1 ? { title: entries[i + 1].title, path: `${category.path}${entries[i + 1].slug}/` } : null;

    const body = renderPatternPage({
      category,
      title: entry.title,
      summary: entry.summary,
      tags: entry.tags,
      currentPath: `${category.path}${entry.slug}/`,
      sidebarItems,
      prev,
      next,
      bodyHtml: entry.bodyHtml,
    });

    const html = renderShell({ title: entry.title, description: entry.summary, activePath: category.path, bodyHtml: body });
    writeFile(`${category.key}/${entry.slug}/index.html`, html);
  });

  const indexBody = renderCategoryIndex({ category, entries });
  const indexHtml = renderShell({ title: category.label, description: category.description, activePath: category.path, bodyHtml: indexBody });
  writeFile(`${category.key}/index.html`, indexHtml);
}

// ---------- 4. Static pages ----------
writeFile('index.html', renderShell({ title: 'LLD Patterns Hub', activePath: '/', bodyHtml: renderHome({ totalPages }) }));
writeFile(
  'cheatsheet/index.html',
  renderShell({
    title: 'Pattern Comparison / Cheat Sheet',
    description: 'Side-by-side comparisons of commonly confused LLD patterns, plus a lookup table for choosing the right pattern fast.',
    activePath: '/cheatsheet/',
    bodyHtml: renderCheatsheet(),
  })
);
writeFile(
  'about/index.html',
  renderShell({
    title: 'About / Resources',
    description: 'What LLD Patterns Hub is, how to use it for interview prep, and where to go deeper.',
    activePath: '/about/',
    bodyHtml: renderAbout(),
  })
);
writeFile('404.html', renderShell({ title: 'Page not found', bodyHtml: render404() }));

// ---------- 5. Static assets ----------
copyAsset('styles.css');
copyAsset('site.js');
copyAsset('favicon.svg');

// ---------- 6. .nojekyll (tells GitHub Pages not to run its own Jekyll build) ----------
fs.writeFileSync(path.join(OUT_DIR, '.nojekyll'), '');

console.log(`Built ${totalPages} pattern/principle pages + 4 static pages into ./docs`);
