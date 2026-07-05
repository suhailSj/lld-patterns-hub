import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Shared frontmatter schema used by every pattern/principle page.
const patternSchema = z.object({
  title: z.string(),
  order: z.number(),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
  // Optional: a short "identify it" hint shown on cards/cheat sheet.
  useWhen: z.string().optional(),
});

const solid = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/solid' }),
  schema: patternSchema,
});

const creational = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/creational' }),
  schema: patternSchema,
});

const structural = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/structural' }),
  schema: patternSchema,
});

const behavioral = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/behavioral' }),
  schema: patternSchema,
});

const fundamentals = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/fundamentals' }),
  schema: patternSchema,
});

export const collections = { solid, creational, structural, behavioral, fundamentals };
