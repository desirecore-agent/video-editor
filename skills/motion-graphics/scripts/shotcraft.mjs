#!/usr/bin/env node
/** Read-only, offline lookup of the fixed source catalog. No renderer or application lifecycle actions. */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '../references/shotcraft');
const catalog = JSON.parse(readFileSync(resolve(base, 'catalog.json'), 'utf8'));
const [action, value = '', styleOrFlag, categoryValue] = process.argv.slice(2);
if (action === 'find') {
  if (styleOrFlag && styleOrFlag !== '--category') throw new Error('Expected --category <category>');
  if (styleOrFlag && !Object.hasOwn(catalog.categories, categoryValue)) throw new Error('Unknown category');
  const words = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const ranked = catalog.cards.filter((c) => !categoryValue || c.category === categoryValue).map((c) => {
    const text = [c.name, c.summary, c.use, c.intention, ...c.styles.map((s) => `${s.key} ${s.label} ${s.description} ${s.use}`)].join(' ').toLowerCase();
    return { c, score: words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0) };
  }).filter((r) => !words.length || r.score > 0).sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
  console.log(JSON.stringify({ commit: catalog.commit, total: ranked.length, cards: ranked.slice(0, 20).map(({ c }) => ({ name: c.name, category: c.category, summary: c.summary, styles: c.styles.map((s) => s.key), nativeStatus: c.nativeStatus })) }, null, 2));
} else if (action === 'show') {
  const card = catalog.cards.find((c) => c.name === value);
  if (!card) throw new Error('Unknown card; use find to resolve the actual name');
  const style = styleOrFlag ? card.styles.find((s) => s.key === styleOrFlag) : null;
  if (styleOrFlag && !style) throw new Error('Style does not belong to this card');
  console.log(JSON.stringify({ commit: catalog.commit, ...card, ...(style ? { selectedStyle: style } : {}),
    documentFile: resolve(base, 'upstream', card.document), demoFiles: card.demos.map((p) => resolve(base, 'upstream', p)),
    demoLocatorScope: 'card', requiresVariantResolution: card.styles.length !== 1 || card.demos.length !== 1,
    note: 'demoFiles are candidates referenced by this card. Resolve the selected style against its document/registration and exact source before use; this is not native or visual validation.' }, null, 2));
} else {
  throw new Error('Usage: node scripts/shotcraft.mjs find <keywords> [--category <category>] | show <card> [style-key]');
}
