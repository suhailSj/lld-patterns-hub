// Plain-JS HTML "components" — just functions returning template-literal
// strings. No framework, no JSX, no build-time magic beyond string
// concatenation. This is the entire "component layer" of the site.
import { primaryNav, withBase } from '../site.config.mjs';

/**
 * The outer HTML shell shared by every page: <head>, header/nav, footer,
 * theme-init script, and the site's one JS file.
 */
export function renderShell({ title, description, activePath = '', bodyHtml }) {
  const pageTitle = title === 'LLD Patterns Hub' ? title : `${title} · LLD Patterns Hub`;

  const navLinks = primaryNav
    .map(
      (item) =>
        `<a href="${withBase(item.path)}"${activePath === item.path ? ' aria-current="page"' : ''}>${item.label}</a>`
    )
    .join('\n');

  const drawerLinks = primaryNav
    .map((item) => `<a class="drawer-link" href="${withBase(item.path)}">${item.label}</a>`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${pageTitle}</title>
<meta name="description" content="${description}" />
<meta name="theme-color" content="#4f46e5" />
<link rel="icon" type="image/svg+xml" href="${withBase('/favicon.svg')}" />
<link rel="stylesheet" href="${withBase('/styles.css')}" />
<meta property="og:title" content="${pageTitle}" />
<meta property="og:description" content="${description}" />
<meta property="og:type" content="website" />
<script>
(function () {
  var saved = localStorage.getItem('lld-theme');
  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
</script>
</head>
<body>
<a class="visually-hidden" href="#main-content">Skip to content</a>

<header class="site-header">
  <div class="container">
    <a class="brand" href="${withBase('/')}">
      <span class="logo-mark">🧠</span>
      <span>LLD Patterns Hub</span>
    </a>

    <nav class="nav-links" aria-label="Primary">
${navLinks}
    </nav>

    <div class="header-actions">
      <button id="theme-toggle" class="icon-btn" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">🌙</button>
      <button id="nav-toggle" class="icon-btn" type="button" aria-label="Toggle menu" aria-expanded="false">☰</button>
    </div>
  </div>

  <div id="nav-drawer">
${drawerLinks}
  </div>
</header>

<main id="main-content">
${bodyHtml}
</main>

<footer class="site-footer">
  <div class="container">
    <span>© ${new Date().getFullYear()} LLD Patterns Hub · Built for interview prep &amp; real-world design practice.</span>
    <span><a href="https://github.com/" target="_blank" rel="noopener noreferrer">View on GitHub</a></span>
  </div>
</footer>

<script src="${withBase('/site.js')}"></script>
</body>
</html>
`;
}

/** Breadcrumb + sidebar + prose article + prev/next pager, used by every pattern/principle page. */
export function renderPatternPage({ category, title, summary, tags = [], currentPath, sidebarItems, prev, next, bodyHtml }) {
  const sidebarLinks = sidebarItems
    .map(
      (item) =>
        `<li><a href="${withBase(item.path)}"${currentPath === item.path ? ' aria-current="page"' : ''}>${item.title}</a></li>`
    )
    .join('\n');

  const tagsHtml =
    tags.length > 0 ? `<div class="pattern-meta">${tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>` : '';

  const pager = `
<nav class="pattern-pager" aria-label="Pattern navigation">
${
  prev
    ? `<a href="${withBase(prev.path)}"><div class="dir">← Previous</div><div>${prev.title}</div></a>`
    : '<span></span>'
}
${
  next
    ? `<a href="${withBase(next.path)}" class="to-next"><div class="dir">Next →</div><div>${next.title}</div></a>`
    : '<span></span>'
}
</nav>`;

  return `
<div class="layout-shell">
  <aside class="sidebar" id="pattern-sidebar">
    <button class="sidebar-toggle" aria-expanded="false">
      <span>📖 ${category.label}</span>
      <span aria-hidden="true">▾</span>
    </button>
    <h4>${category.label}</h4>
    <ul class="sidebar-list">
${sidebarLinks}
    </ul>
  </aside>

  <div class="content">
    <p class="breadcrumb"><a href="${withBase('/')}">Home</a> / <a href="${withBase(category.path)}">${category.label}</a> / ${title}</p>

    <article class="prose">
      <h1>${title}</h1>
      ${tagsHtml}
      <p class="summary-lede">${summary}</p>
${bodyHtml}
    </article>

    ${pager}
  </div>
</div>`;
}

/** A simple centered prose page (About, Cheat Sheet) — no sidebar. */
export function renderSimplePage({ title, category, bodyHtml }) {
  return `
<div class="layout-shell no-sidebar">
  <div class="content">
    <p class="breadcrumb"><a href="${withBase('/')}">Home</a>${category ? ` / ${category}` : ''}</p>
    <article class="prose">
${bodyHtml}
    </article>
  </div>
</div>`;
}

/** One clickable card, used on the homepage grid and category index pages. */
export function renderPatternCard({ title, summary, path, tags = [] }) {
  const searchBlob = [title, summary, ...tags].join(' ').toLowerCase();
  const tagsHtml = tags.length
    ? `<div class="pattern-meta">${tags.slice(0, 3).map((t) => `<span class="tag">${t}</span>`).join('')}</div>`
    : '';
  return `<a class="card" href="${withBase(path)}" data-search="${searchBlob}">
  <h3>${title}</h3>
  <p>${summary}</p>
  ${tagsHtml}
</a>`;
}

/** A category's index page: intro + filter box + card grid of every page in it. */
export function renderCategoryIndex({ category, entries }) {
  const cards = entries.map((e) => renderPatternCard({ title: e.title, summary: e.summary, path: `${category.path}${e.slug}/`, tags: e.tags })).join('\n');
  return `
<div class="layout-shell no-sidebar">
  <div class="content">
    <p class="breadcrumb"><a href="${withBase('/')}">Home</a> / ${category.label}</p>
    <h1>${category.icon} ${category.label}</h1>
    <p class="summary-lede">${category.description}</p>
    <input class="filter-box" type="search" placeholder="Filter ${category.label.toLowerCase()}..." data-filter-target=".card-grid .card" aria-label="Filter ${category.label}" />
    <div class="card-grid">
${cards}
    </div>
  </div>
</div>`;
}
