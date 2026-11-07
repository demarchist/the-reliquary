/**
 * Remark plugin that lets a Markdown entry write its pictures as /images/..., the same way an entry's `image` field does, whether
 * as ![alt](/images/x.jpg) or in a raw <img> inside a <figure>.  Without it each one would have to spell out the site's base path.
 */

import { visit } from 'unist-util-visit';

const BASE = '/the-reliquary';

export default function remarkBaseImages() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url.startsWith('/images/')) node.url = BASE + node.url;
    });
    visit(tree, 'html', (node) => {
      node.value = node.value.replace(/src="\/images\//g, `src="${BASE}/images/`);
    });
  };
}
