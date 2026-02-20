/**
 * populate-crosslinks.ts
 *
 * Scans all wiki entries to build a lookup map, then scans diary markdown
 * for mentions of wiki entity names/aliases. Populates the diary frontmatter
 * arrays (people, places, things, factions, events) and generates
 * src/data/wiki-lookup.json for the remark plugin.
 *
 * Usage: npx tsx scripts/populate-crosslinks.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const WIKI_DIR = path.join(ROOT, 'src', 'content', 'wiki');
const DIARY_DIR = path.join(ROOT, 'src', 'content', 'diary');
const LOOKUP_OUT = path.join(ROOT, 'src', 'data', 'wiki-lookup.json');

interface WikiEntry {
  slug: string;
  title: string;
  aliases: string[];
  category: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFrontmatter(raw: string): { frontmatter: Record<string, any>; body: string; rawFrontmatter: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { frontmatter: {}, body: raw, rawFrontmatter: '' };

  const rawFm = match[1];
  const body = raw.slice(match[0].length);
  const frontmatter: Record<string, any> = {};

  let currentKey = '';
  let inArray = false;

  for (const line of rawFm.split(/\r?\n/)) {
    // Array item
    if (inArray && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      if (!Array.isArray(frontmatter[currentKey])) frontmatter[currentKey] = [];
      frontmatter[currentKey].push(val);
      continue;
    }

    // Key: value
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      inArray = false;

      if (val === '' || val === '[]') {
        // Could be start of array or empty value
        frontmatter[currentKey] = val === '[]' ? [] : '';
        inArray = val === '';
        continue;
      }

      // Inline array: ["a", "b"]
      if (val.startsWith('[')) {
        const items = val.slice(1, -1).split(',').map(s =>
          s.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
        ).filter(Boolean);
        frontmatter[currentKey] = items;
        continue;
      }

      // Scalar
      frontmatter[currentKey] = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
  }

  return { frontmatter, body, rawFrontmatter: rawFm };
}

function serializeFrontmatter(fm: Record<string, any>): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(fm)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) continue; // omit empty arrays
      lines.push(`${key}:`);
      for (const item of val) {
        lines.push(`  - "${item}"`);
      }
    } else {
      // Quote strings that contain special chars
      const strVal = String(val);
      if (/[:#\[\]{}|>&*!,]/.test(strVal) || strVal.startsWith('"')) {
        lines.push(`${key}: "${strVal.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${strVal}`);
      }
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// 1. Build wiki lookup
const wikiFiles = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith('.md'));
const wikiEntries: WikiEntry[] = [];

for (const file of wikiFiles) {
  const raw = fs.readFileSync(path.join(WIKI_DIR, file), 'utf-8');
  const { frontmatter } = parseFrontmatter(raw);
  const slug = file.replace(/\.md$/, '');
  wikiEntries.push({
    slug,
    title: frontmatter.title || slug,
    aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [],
    category: frontmatter.category || 'Things',
  });
}

console.log(`Loaded ${wikiEntries.length} wiki entries`);

// Build name → slug lookup (title and aliases)
// Also build category map for slug → category
const nameToSlug = new Map<string, string>();
const slugToCategory = new Map<string, string>();

for (const entry of wikiEntries) {
  slugToCategory.set(entry.slug, entry.category);
  // Map title → slug
  nameToSlug.set(entry.title.toLowerCase(), entry.slug);
  // Map each alias → slug
  for (const alias of entry.aliases) {
    nameToSlug.set(alias.toLowerCase(), entry.slug);
  }
}

// Build regex for matching names in text (longest first to avoid partial matches)
const allNames = [...nameToSlug.keys()].sort((a, b) => b.length - a.length);
// Filter out very short names (< 3 chars) to avoid false positives
const filteredNames = allNames.filter(n => n.length >= 3);
const namePattern = new RegExp(
  '\\b(' + filteredNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi'
);

// Category → frontmatter key mapping
const categoryToKey: Record<string, string> = {
  People: 'people',
  Places: 'places',
  Things: 'things',
  Factions: 'factions',
  Events: 'events',
};

// 2. Scan diary entries and populate frontmatter
const diaryFiles = fs.readdirSync(DIARY_DIR).filter(f => f.endsWith('.md')).sort();
let updatedCount = 0;

for (const file of diaryFiles) {
  const filePath = path.join(DIARY_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);

  // Find all wiki entity mentions in the body text
  const foundSlugs = new Set<string>();
  const bodyLower = body.toLowerCase();

  for (const [name, slug] of nameToSlug.entries()) {
    if (name.length < 3) continue;
    if (bodyLower.includes(name)) {
      foundSlugs.add(slug);
    }
  }

  // Group by category
  const grouped: Record<string, string[]> = {
    people: [],
    places: [],
    things: [],
    factions: [],
    events: [],
  };

  for (const slug of foundSlugs) {
    const cat = slugToCategory.get(slug);
    if (cat) {
      const key = categoryToKey[cat];
      if (key) grouped[key].push(slug);
    }
  }

  // Sort each group
  for (const key of Object.keys(grouped)) {
    grouped[key].sort();
  }

  // Check if anything changed
  let changed = false;
  for (const key of Object.keys(grouped)) {
    const existing = Array.isArray(frontmatter[key]) ? frontmatter[key] : [];
    const newVal = grouped[key];
    if (JSON.stringify(existing.sort()) !== JSON.stringify(newVal)) {
      changed = true;
      break;
    }
  }

  if (!changed) continue;

  // Update frontmatter
  const newFm: Record<string, any> = {};
  // Preserve original keys in order
  const preserveKeys = ['title', 'chapter', 'chapterTitle', 'session', 'summary', 'date'];
  for (const key of preserveKeys) {
    if (frontmatter[key] !== undefined && frontmatter[key] !== '') {
      newFm[key] = frontmatter[key];
    }
  }

  // Add entity arrays (only non-empty)
  for (const key of ['people', 'places', 'things', 'factions', 'events']) {
    if (grouped[key].length > 0) {
      newFm[key] = grouped[key];
    }
  }

  // Write back
  const newContent = `---\n${serializeFrontmatter(newFm)}\n---${body}`;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  updatedCount++;
}

console.log(`Updated ${updatedCount} diary entries with cross-links`);

// 3. Generate wiki-lookup.json
const lookupData: Record<string, { slug: string; title: string; category: string }> = {};

for (const entry of wikiEntries) {
  // Map title
  lookupData[entry.title.toLowerCase()] = {
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
  };
  // Map aliases
  for (const alias of entry.aliases) {
    lookupData[alias.toLowerCase()] = {
      slug: entry.slug,
      title: entry.title,
      category: entry.category,
    };
  }
}

fs.writeFileSync(LOOKUP_OUT, JSON.stringify(lookupData, null, 2), 'utf-8');
console.log(`Wrote wiki lookup to ${LOOKUP_OUT} (${Object.keys(lookupData).length} entries)`);
