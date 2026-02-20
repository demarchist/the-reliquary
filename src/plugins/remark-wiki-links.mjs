/**
 * Remark plugin that transforms [[Entity Name]] and [[Entity Name|display text]]
 * into links to wiki pages.
 */

import { visit } from 'unist-util-visit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lookupPath = path.join(__dirname, '..', 'data', 'wiki-lookup.json');

let lookup = null;

function loadLookup() {
  if (lookup) return lookup;
  try {
    lookup = JSON.parse(fs.readFileSync(lookupPath, 'utf-8'));
  } catch {
    lookup = {};
  }
  return lookup;
}

const WIKI_LINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export default function remarkWikiLinks() {
  return (tree) => {
    const data = loadLookup();

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null) return;

      const value = node.value;
      if (!value.includes('[[')) return;

      const children = [];
      let lastIndex = 0;

      for (const match of value.matchAll(WIKI_LINK_RE)) {
        const entityName = match[1].trim();
        const displayText = match[2]?.trim() || entityName;
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;

        // Add text before match
        if (matchStart > lastIndex) {
          children.push({ type: 'text', value: value.slice(lastIndex, matchStart) });
        }

        // Look up entity
        const entry = data[entityName.toLowerCase()];
        if (entry) {
          children.push({
            type: 'link',
            url: `/the-reliquary/wiki/${entry.slug}/`,
            children: [{ type: 'text', value: displayText }],
            data: {
              hProperties: { className: ['wiki-link'] },
            },
          });
        } else {
          // Unresolved — render as styled span
          children.push({
            type: 'html',
            value: `<span class="wiki-link-missing">${displayText}</span>`,
          });
        }

        lastIndex = matchEnd;
      }

      // Add remaining text
      if (lastIndex < value.length) {
        children.push({ type: 'text', value: value.slice(lastIndex) });
      }

      if (children.length > 0) {
        parent.children.splice(index, 1, ...children);
      }
    });
  };
}
