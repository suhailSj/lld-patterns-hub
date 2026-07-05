# LLD Patterns Hub

A mobile-friendly, iPad-compatible website that teaches Low-Level Design (LLD): the SOLID principles, the classic
Gang-of-Four creational/structural/behavioral patterns, and the OOP fundamentals underneath them — with a Python
**and** Java implementation of the same realistic scenario on every pattern page.

- **Stack:** plain Node.js. No framework. A ~150-line build script (`build.mjs`) reads Markdown files and writes
  static HTML using three small, well-known npm packages: `gray-matter` (frontmatter), `markdown-it` (Markdown →
  HTML), and `highlight.js` (code syntax highlighting).
- **Output:** the generated site is committed straight into `docs/`. GitHub Pages serves that folder directly —
  **there is no CI build step, no GitHub Action, and no Node-version dependency in the deploy path at all.**
- **Live site:** `https://<your-username>.github.io/lld-patterns-hub/` (after you enable Pages — see below)

## Why this shape

Earlier drafts of this project used Astro. It was swapped out for a plain Node script because a framework brings a
large, opaque dependency tree and its own Node-version/CI requirements — exactly the kind of thing that broke the
GitHub Actions deploy repeatedly. This version has 3 runtime dependencies total, and the entire generator is one
file you can read top to bottom in a few minutes (`build.mjs`).

## Project structure

```
lld-patterns-hub/
├── build.mjs                # the whole static site generator — run this to produce docs/
├── serve.mjs                 # zero-dependency local preview server (no extra package needed)
├── site.config.mjs           # BASE path + category/nav metadata (the only file you'd edit to rebrand)
├── lib/markdown.mjs          # markdown-it + highlight.js setup, and the Python/Java tab-pairing logic
├── templates/
│   ├── layout.mjs            # HTML shell, header/nav, pattern-page sidebar/pager — plain template-literal functions
│   └── pages.mjs             # Home, Cheat Sheet, About, 404 content
├── content/                  # all 30 pattern/principle pages, one plain Markdown file each
│   ├── solid/
│   ├── creational/
│   ├── structural/
│   ├── behavioral/
│   └── fundamentals/
├── assets/                   # styles.css, site.js, favicon.svg — copied as-is into docs/
└── docs/                     # BUILD OUTPUT — committed, this is what GitHub Pages serves
```

There is no build tool, no bundler, no JSX, no virtual DOM, and no client-side framework. `assets/site.js` is the
only JavaScript that ships to the browser, and it's plain vanilla JS (theme toggle, mobile nav, Python/Java tab
switching, copy-to-clipboard buttons, and the category filter box).

## Local development

Requires Node.js 18+ (nothing newer — this project deliberately doesn't depend on any framework's minimum-version
requirements).

```bash
npm install        # installs 3 small packages: gray-matter, markdown-it, highlight.js
npm run build      # reads content/**/*.md, writes docs/
npm run serve      # serves docs/ at http://localhost:4321/lld-patterns-hub/
npm start          # build + serve in one step
```

`serve.mjs` mimics the `/lld-patterns-hub/` path prefix GitHub Pages will use in production, so what you see locally
matches what ships.

## Adding a new pattern or principle page

1. Create a new Markdown file under the right category, e.g. `content/structural/flyweight.md`.
2. Add frontmatter:
   ```yaml
   ---
   title: "Flyweight"
   order: 7
   summary: "One sentence describing the pattern."
   tags: ["Structural", "GoF", "your scenario"]
   ---
   ```
3. Write the body in plain Markdown. Two things are handled automatically by the build script:
   - **Python/Java tabs:** just write two fenced code blocks back to back (a ` ```python ` block immediately
     followed by a ` ```java ` block, separated by a blank line). `build.mjs` detects the adjacent pair and wraps
     them in the tabbed UI — no special syntax needed.
   - **Callout boxes:** use raw HTML directly in the Markdown file — it passes through untouched:
     ```html
     <div class="callout tip">
     <div class="callout-title">💡 Interview tip</div>

     Your tip text, in Markdown, goes here.

     </div>
     ```
     (`tip`, `warn`, or `pitfall` are the supported types — see `assets/styles.css`.)
4. For links to other content pages, use the `__BASE__` placeholder, which the build script resolves to the
   configured site base automatically:
   ```html
   See also <a href="__BASE__/fundamentals/immutability/">Immutability</a>.
   ```
5. Run `npm run build` — the new page appears in its category's index and sidebar automatically.

## Deploying to GitHub Pages (no Actions workflow needed)

Because `docs/` is committed and already contains the built site, you don't need a CI build step at all:

1. Push this repository to GitHub (see the exact `gh` commands in the project's setup notes, or just `git push` if
   the remote is already configured).
2. On GitHub, go to your repo's **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, select `main` and the `/docs` folder, then **Save**.
5. GitHub publishes the site within a minute or two at:
   ```
   https://<your-username>.github.io/lld-patterns-hub/
   ```

Whenever you add or edit content, just run `npm run build` again, commit the updated `docs/` folder, and push —
GitHub Pages picks up the change automatically on the next push to `main`. No workflow file, no Node-version
pinning, no Actions minutes used.

### If you rename the repo or use a custom domain

Edit `BASE` in `site.config.mjs` (must start with `/`, e.g. `/my-new-repo-name`) and re-run `npm run build`. For a
custom domain or a user/org root site (`<username>.github.io`), set `BASE = ''`.

## License

MIT — see `LICENSE`.
