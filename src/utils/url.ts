// Prefixes an absolute site path (e.g. "/solid/") with the configured
// Astro `base` (e.g. "/lld-patterns-hub/") so links work both in local
// dev (base "/") and once deployed to GitHub Pages under a repo subpath.
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL; // always ends with "/"
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return base + cleanPath;
}
