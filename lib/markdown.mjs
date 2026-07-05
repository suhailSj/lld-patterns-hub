// Markdown -> HTML rendering, in one place. Plain markdown-it + highlight.js —
// no framework, two well-known npm packages doing exactly what they say.
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const md = new MarkdownIt({
  html: true, // allow raw HTML blocks (<div class="callout">, <a href=...>, <div class="pros-cons">)
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    const highlighted = hljs.highlight(code, { language }).value;
    // data-language is what the client-side tab-switcher (site.js) and the
    // wrapTabPairs() post-processor below key off of.
    return `<pre class="hljs" data-language="${language}"><code>${highlighted}</code></pre>`;
  },
});

/**
 * Finds every pair of adjacent Python + Java code blocks (produced by two
 * back-to-back fenced code blocks in the source markdown) and wraps them in
 * the same .code-tabs markup the CSS/site.js expect, so authors just write
 * two plain fenced code blocks — no custom JSX component needed.
 */
function wrapTabPairs(html) {
  const pairPattern =
    /(<pre class="hljs" data-language="python">[\s\S]*?<\/pre>)\s*(<pre class="hljs" data-language="java">[\s\S]*?<\/pre>)/g;

  return html.replace(pairPattern, (_match, pythonBlock, javaBlock) => {
    return `<div class="code-tabs">
  <div class="code-tabs-header" role="tablist">
    <button class="tab-btn" type="button" data-lang="python" role="tab">🐍 Python</button>
    <button class="tab-btn" type="button" data-lang="java" role="tab">☕ Java</button>
  </div>
  <div class="code-tabs-body">
    ${pythonBlock}
    ${javaBlock}
  </div>
</div>`;
  });
}

export function renderMarkdown(source) {
  const rawHtml = md.render(source);
  return wrapTabPairs(rawHtml);
}
