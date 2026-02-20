import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const diary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/diary' }),
  schema: z.object({
    title: z.string(),
    chapter: z.number(),
    chapterTitle: z.string().optional(),
    session: z.number(),
    summary: z.string().optional(),
    date: z.string().optional(),
    people: z.array(z.string()).optional(),
    places: z.array(z.string()).optional(),
    things: z.array(z.string()).optional(),
    factions: z.array(z.string()).optional(),
    events: z.array(z.string()).optional(),
  }),
});

const wiki = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/wiki' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['People', 'Places', 'Things', 'Factions', 'Events']),
    aliases: z.array(z.string()).optional(),
    firstAppearance: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    quote: z.string().optional(),
  }),
});

export const collections = { diary, wiki };
