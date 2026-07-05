import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// NOTE: Replace "your-username" with your actual GitHub username before deploying to GitHub Pages.
// If you rename the repo, update `base` to match (must start and end with "/").
//
// `base` auto-adapts to the host: GitHub Pages serves this project under a
// /lld-patterns-hub/ subpath, but Vercel/Netlify serve it at the domain root —
// both platforms set their own env var automatically, so no manual edits are
// needed when switching hosts.
const isRootHost = Boolean(process.env.VERCEL || process.env.NETLIFY);

export default defineConfig({
  site: isRootHost ? undefined : 'https://your-username.github.io',
  base: isRootHost ? '/' : '/lld-patterns-hub/',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
