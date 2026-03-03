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
    race: z.string().optional(),
    class: z.string().optional(),
    affiliation: z.string().optional(),
    home: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/chapters' }),
  schema: z.object({
    chapter: z.number(),
    summary: z.string(),
  }),
});

const interludes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/interludes' }),
  schema: z.object({
    title: z.string(),
    interlude: z.number(),
    session: z.number(),
    summary: z.string().optional(),
    people: z.array(z.string()).optional(),
    places: z.array(z.string()).optional(),
    things: z.array(z.string()).optional(),
    factions: z.array(z.string()).optional(),
    events: z.array(z.string()).optional(),
  }),
});

const interludeGroups = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/interlude-groups' }),
  schema: z.object({
    interlude: z.number(),
    afterChapter: z.number(),
    title: z.string(),
    summary: z.string(),
  }),
});

const history = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/history' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    summary: z.string(),
    people: z.array(z.string()).optional(),
    places: z.array(z.string()).optional(),
    things: z.array(z.string()).optional(),
    factions: z.array(z.string()).optional(),
    events: z.array(z.string()).optional(),
  }),
});

export const collections = { diary, wiki, chapters, history, interludes, interludeGroups };
