// Central site configuration — plain data, no framework involved.
//
// BASE must match how GitHub Pages serves this repo: a project site
// (the default for any repo that isn't named "<username>.github.io")
// is served under a /<repo-name>/ subpath, so every internal link the
// build script generates gets this prefix.
export const BASE = '/lld-patterns-hub';

export const categories = [
  {
    key: 'fundamentals',
    label: 'LLD Fundamentals',
    shortLabel: 'Fundamentals',
    path: '/fundamentals/',
    icon: '🧱',
    description:
      'Core object-oriented concepts every LLD answer rests on: composition vs. inheritance, the OOP pillars, dependency injection, immutability, cohesion and coupling.',
  },
  {
    key: 'solid',
    label: 'SOLID Principles',
    shortLabel: 'SOLID',
    path: '/solid/',
    icon: '🧭',
    description:
      'Five principles that keep object-oriented code easy to extend and hard to break, with a bad-vs-improved example for each.',
  },
  {
    key: 'creational',
    label: 'Creational Patterns',
    shortLabel: 'Creational',
    path: '/creational/',
    icon: '🏗️',
    description: 'Patterns that control how and when objects get created: Singleton, Factory Method, Abstract Factory, Builder, Prototype.',
  },
  {
    key: 'structural',
    label: 'Structural Patterns',
    shortLabel: 'Structural',
    path: '/structural/',
    icon: '🧩',
    description: 'Patterns for composing classes and objects into larger structures: Adapter, Decorator, Facade, Composite, Proxy, Bridge.',
  },
  {
    key: 'behavioral',
    label: 'Behavioral Patterns',
    shortLabel: 'Behavioral',
    path: '/behavioral/',
    icon: '🔄',
    description:
      'Patterns for how objects communicate and share responsibility: Strategy, Observer, Command, State, Chain of Responsibility, Template Method, Iterator.',
  },
];

export const primaryNav = [
  { label: 'Home', path: '/' },
  ...categories.map((c) => ({ label: c.shortLabel, path: c.path })),
  { label: 'Cheat Sheet', path: '/cheatsheet/' },
  { label: 'About', path: '/about/' },
];

export function withBase(p) {
  const clean = p.startsWith('/') ? p : `/${p}`;
  return `${BASE}${clean}`;
}
