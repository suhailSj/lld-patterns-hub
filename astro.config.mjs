import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// NOTE: Replace "your-username" with your actual GitHub username before deploying.
// If you rename the repo, update `base` to match (must start and end with "/").
export default defineConfig({
  site: 'https://your-username.github.io',
  base: '/lld-patterns-hub/',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
