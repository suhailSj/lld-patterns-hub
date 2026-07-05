// Central registry of the site's content categories.
// Used by the top nav, homepage feature grid, and category index pages.
export type CategoryKey = 'fundamentals' | 'solid' | 'creational' | 'structural' | 'behavioral';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  path: string;
  shortLabel: string;
  description: string;
  icon: string; // simple inline emoji/glyph, keeps the site dependency-free
}

export const categories: CategoryMeta[] = [
  {
    key: 'fundamentals',
    label: 'LLD Fundamentals',
    shortLabel: 'Fundamentals',
    path: '/fundamentals/',
    description:
      'Core object-oriented concepts every LLD answer rests on: composition vs. inheritance, the OOP pillars, dependency injection, immutability, cohesion and coupling.',
    icon: '🧱',
  },
  {
    key: 'solid',
    label: 'SOLID Principles',
    shortLabel: 'SOLID',
    path: '/solid/',
    description:
      'Five principles that keep object-oriented code easy to extend and hard to break, with a bad-vs-improved example for each.',
    icon: '🧭',
  },
  {
    key: 'creational',
    label: 'Creational Patterns',
    shortLabel: 'Creational',
    path: '/creational/',
    description: 'Patterns that control how and when objects get created: Singleton, Factory Method, Abstract Factory, Builder, Prototype.',
    icon: '🏗️',
  },
  {
    key: 'structural',
    label: 'Structural Patterns',
    shortLabel: 'Structural',
    path: '/structural/',
    description: 'Patterns for composing classes and objects into larger structures: Adapter, Decorator, Facade, Composite, Proxy, Bridge.',
    icon: '🧩',
  },
  {
    key: 'behavioral',
    label: 'Behavioral Patterns',
    shortLabel: 'Behavioral',
    path: '/behavioral/',
    description:
      'Patterns for how objects communicate and share responsibility: Strategy, Observer, Command, State, Chain of Responsibility, Template Method, Iterator.',
    icon: '🔄',
  },
];

export const primaryNav = [
  { label: 'Home', path: '/' },
  ...categories.map((c) => ({ label: c.shortLabel, path: c.path })),
  { label: 'Cheat Sheet', path: '/cheatsheet/' },
  { label: 'About', path: '/about/' },
];
