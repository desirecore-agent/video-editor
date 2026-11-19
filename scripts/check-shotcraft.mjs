/** Validate imported provenance and the discoverable source catalog without network or runtime dependencies. */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { SHOTCRAFT_FILES } from './shotcraft-files.mjs';

export function checkShotcraft(root) {
  const errors = [], base = 'skills/motion-graphics/references/shotcraft';
  const read = (p) => readFileSync(resolve(root, p));
  const need = (condition, message) => { if (!condition) errors.push(message); };
  try {
    const source = JSON.parse(read(`${base}/SOURCE.json`)), catalog = JSON.parse(read(`${base}/catalog.json`));
    need(source.commit === '075b548c2405a07b77129eb448b0b504fc60dea3' && source.commit === catalog.commit, 'Shotcraft source commit must be fixed.');
    need(source.license === 'Apache-2.0', 'Shotcraft Apache-2.0 source license is required.');
    need(source.files.length === 379 && new Set(source.files.map((f) => f.destination)).size === 379, 'The complete fixed Shotcraft source manifest is required.');
    need(SHOTCRAFT_FILES.length === new Set(SHOTCRAFT_FILES).size, 'Duplicate Shotcraft seed path.');
    for (const f of source.files) {
      need(SHOTCRAFT_FILES.includes(f.destination) && !f.destination.split('/').includes('..'), `Unsafe or unlisted Shotcraft source: ${f.destination}`);
      if (!SHOTCRAFT_FILES.includes(f.destination)) continue;
      const bytes = read(f.destination);
      need(bytes.length === f.bytes && createHash('sha256').update(bytes).digest('hex') === f.sha256, `Changed Shotcraft original: ${f.destination}`);
    }
    const library = JSON.parse(read(`${base}/upstream/gallery/api/library.json`));
    need(catalog.cards.length === 124 && catalog.counts.cards === 124, 'Shotcraft must contain the fixed 124-card catalog.');
    need(catalog.cards.reduce((n, c) => n + c.styles.length, 0) === 150 && catalog.counts.styles === 150, 'Shotcraft must contain 150 fixed styles.');
    need(new Set(catalog.cards.map((c) => c.name)).size === catalog.cards.length, 'Duplicate Shotcraft card.');
    for (const card of catalog.cards) {
      const original = library.cards.find((c) => c.name === card.name);
      need(original && original.source === card.document && original.category === card.category
        && JSON.stringify(original.styles.map((s) => s.key)) === JSON.stringify(card.styles.map((s) => s.key)), `Shotcraft card/style identity drift: ${card.name}`);
      if (original) {
        for (const key of ['summary', 'use', 'duration', 'energy', 'intention']) need(card[key] === (original[key] || ''), `Shotcraft catalog text drift: ${card.name}.${key}`);
        need(JSON.stringify(card.styles) === JSON.stringify(original.styles.map((s) => ({ key: s.key, label: s.label, description: s.description || '', use: s.use || '' }))), `Shotcraft variant text drift: ${card.name}`);
      }
      need(card.nativeStatus === 'reference-only', `Source catalog must not claim native verification: ${card.name}`);
      for (const name of [card.document, ...card.demos]) need(source.files.some((f) => f.path === name) && existsSync(resolve(root, `${base}/upstream/${name}`)), `Missing Shotcraft reference: ${name}`);
    }
    need(read('licenses/VideoShotcraft-Apache-2.0.txt').toString('utf8').includes('Apache License'), 'Complete Shotcraft Apache license is required.');
    need(read('NOTICE').toString('utf8').includes('Vincentwei1021/video-shotcraft'), 'Shotcraft attribution is required.');
  } catch (error) { errors.push(`Invalid Shotcraft source: ${error.message}`); }
  return errors;
}
