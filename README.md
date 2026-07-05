# LLD Patterns Hub

A mobile-friendly, iPad-compatible website that teaches Low-Level Design (LLD): the SOLID principles, the classic
Gang-of-Four creational/structural/behavioral patterns, and the OOP fundamentals underneath them — with a Python
**and** Java implementation of the same realistic scenario on every pattern page.

Built for engineers preparing for design interviews, and for anyone who wants a working, example-driven refresher.

- **Live site:** `https://<your-username>.github.io/lld-patterns-hub/` (after you deploy — see below)
- **Stack:** [Astro](https://astro.build) + MDX content collections, hand-written CSS (no UI framework), zero
  client-side JS framework — just enough vanilla JS for tabs, dark mode, and the mobile nav.
- **Hosting:** GitHub Pages, deployed automatically by GitHub Actions on every push to `main`.

## What's included

- **30 pattern/principle pages**, each following the same structure: intent, problem statement, why the naive
  approach fails, solution overview, class design, step-by-step explanation, a Python tab, a Java tab, a real-world
  example, pros/cons, when to use/avoid, interview talking points, and related patterns.
  - 5 **SOLID** principles (`src/content/solid/`)
  - 5 **Creational** patterns — Singleton, Factory Method, Abstract Factory, Builder, Prototype (`src/content/creational/`)
  - 6 **Structural** patterns — Adapter, Decorator, Facade, Composite, Proxy, Bridge (`src/content/structural/`)
  - 7 **Behavioral** patterns — Strategy, Observer, Command, State, Chain of Responsibility, Template Method, Iterator (`src/content/behavioral/`)
  - 7 **Fundamentals** — composition vs. inheritance, OOP pillars, dependency injection, interfaces vs. abstract
    classes, immutability, cohesion & coupling, interview tips (`src/content/fundamentals/`)
- A **Cheat Sheet** page with side-by-side comparisons (Factory Method vs. Abstract Factory, Strategy vs. State,
  Decorator vs. Proxy, Composition vs. Inheritance) and a "which pattern do I need?" lookup table.
- Responsive layout (mobile / iPad / desktop), a collapsible sidebar + mobile nav drawer, dark mode, a Python/Java
  tab switcher that remembers your preference across pages, syntax-highlighted + copy-able code blocks, and a
  client-side filter box on each category index.

## Project structure

```
lld-patterns-hub/
├── .github/workflows/deploy.yml   # builds & deploys to GitHub Pages on every push to main
├── astro.config.mjs               # site/base URL, MDX + sitemap integrations, Shiki theme
├── src/
│   ├── components/                # CodeTabs, Callout, PatternCard, CategoryIndex, PatternPage, Nav bits
│   ├── content/                   # all educational content, one .mdx file per page
│   │   ├── solid/
│   │   ├── creational/
│   │   ├── structural/
│   │   ├── behavioral/
│   │   └── fundamentals/
│   ├── content.config.ts          # content collection schemas (title, order, summary, tags)
│   ├── data/categories.ts         # nav + category metadata used across the site
│   ├── layouts/                   # BaseLayout (header/footer/theme) and PatternLayout (sidebar/pager)
│   ├── pages/                     # route files: home, cheatsheet, about, category index + [slug] routes
│   ├── scripts/site.js            # single vanilla-JS file: theme toggle, mobile nav, tabs, copy buttons
│   ├── styles/global.css          # the entire design system (CSS variables, responsive rules)
│   └── utils/                     # withBase() URL helper, sidebar/pager helpers
└── public/favicon.svg
```

## Local development

Requires Node.js 22.12+ (Astro 7's minimum).

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs static site to dist/
npm run preview   # serve the production build locally
```

## Adding a new pattern or principle page

1. Create a new `.mdx` file under the right category, e.g. `src/content/structural/flyweight.mdx`.
2. Add frontmatter matching the schema in `src/content.config.ts`:
   ```yaml
   ---
   title: "Flyweight"
   order: 7
   summary: "One sentence describing the pattern."
   tags: ["Structural", "GoF", "your scenario"]
   ---
   ```
3. Import and use the shared components at the top of the file:
   ```mdx
   import CodeTabs from '../../components/CodeTabs.astro';
   import Callout from '../../components/Callout.astro';
   import { withBase } from '../../utils/url';
   ```
4. For a Python/Java tab pair, write two **flush-left** fenced code blocks inside `<CodeTabs>`:
   ````mdx
   <CodeTabs>

   ```python
   ...
   ```

   ```java
   ...
   ```

   </CodeTabs>
   ````
5. For cross-links to other content pages, always use `withBase()` (plain relative Markdown links resolve against
   the page's *route*, not the file's folder, and will break once the site is deployed under `/lld-patterns-hub/`):
   ```mdx
   See also <a href={withBase('/fundamentals/immutability/')}>Immutability</a>.
   ```
6. The new page automatically appears in its category's index page and sidebar — nothing else to wire up.

## Deploying to GitHub Pages (first-time setup)

The GitHub Actions workflow in `.github/workflows/deploy.yml` is already configured to build and deploy on every
push to `main`. You only need to do this once per repository:

1. **Update the site URL.** In `astro.config.mjs`, replace `your-username` with your actual GitHub username:
   ```js
   site: 'https://your-username.github.io',
   base: '/lld-patterns-hub/',
   ```
   (If you rename the repository, update `base` to match — it must start and end with `/`.)
2. **Push to GitHub** (see the exact `gh` commands below).
3. In your repository on GitHub, go to **Settings → Pages**, and under **Build and deployment → Source**, choose
   **GitHub Actions** (not "Deploy from a branch").
4. Push to `main` (or re-run the workflow from the **Actions** tab). The first successful run publishes the site at:
   ```
   https://your-username.github.io/lld-patterns-hub/
   ```

## Deploying somewhere else (Vercel / Netlify)

The site is a plain static Astro build, so it works on any static host:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- If you host it at a root domain (not a GitHub Pages project subpath), set `base: '/'` in `astro.config.mjs` and
  update `site` accordingly.

## License

MIT — see `LICENSE`.
