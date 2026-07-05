// Shared helpers for turning a content collection into sidebar nav items
// and a prev/next pager, so every category's [slug].astro route stays tiny.
interface EntryLike {
  id: string;
  data: { title: string; order: number };
}

export function buildSidebarItems(entries: EntryLike[], basePath: string) {
  return entries
    .map((e) => ({ id: e.id, title: e.data.title, path: `${basePath}${e.id}/`, order: e.data.order }))
    .sort((a, b) => a.order - b.order);
}

export function getPagerFor(entries: EntryLike[], currentId: string, basePath: string) {
  const sorted = [...entries].sort((a, b) => a.data.order - b.data.order);
  const idx = sorted.findIndex((e) => e.id === currentId);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  return {
    prev: prev ? { title: prev.data.title, path: `${basePath}${prev.id}/` } : null,
    next: next ? { title: next.data.title, path: `${basePath}${next.id}/` } : null,
  };
}
