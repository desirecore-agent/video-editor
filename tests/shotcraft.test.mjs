import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkShotcraft } from '../scripts/check-shotcraft.mjs';
import { buildSeedArchive } from '../scripts/package-seed.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = 'skills/motion-graphics/references/shotcraft';
const cli = 'skills/motion-graphics/scripts/shotcraft.mjs';
const run = (where, ...args) => spawnSync(process.execPath, [resolve(where, cli), ...args], { encoding: 'utf8', windowsHide: true });

test('lookup resolves a real card/style and rejects invented variants', () => {
  const found = JSON.parse(run(root, 'find', '纸卡 标题').stdout);
  assert.ok(found.total > 0);
  const actual = run(root, 'show', 'marker-underline-title', 'marker-underline-title');
  assert.equal(actual.status, 0, actual.stderr);
  const card = JSON.parse(actual.stdout);
  assert.equal(card.nativeStatus, 'reference-only');
  assert.ok(card.demoFiles.some((f) => f.endsWith('MarkerUnderlineTitle.tsx')));
  assert.ok(card.documentFile.endsWith('marker-underline-title.md'));
  assert.notEqual(run(root, 'show', 'marker-underline-title', 'invented-style').status, 0);
  assert.notEqual(run(root, 'find', 'paper', '--category', 'invented-category').status, 0);
});

test('source hashes and capability claims fail on damaged originals or catalog drift', (t) => {
  const directory = mkdtempSync(resolve(tmpdir(), 'shotcraft-policy-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const name of [base, 'licenses', 'NOTICE']) cpSync(resolve(root, name), resolve(directory, name), { recursive: true });
  assert.deepEqual(checkShotcraft(directory), []);
  const doc = `${base}/upstream/references/shots/typography/marker-underline-title.md`;
  writeFileSync(resolve(directory, doc), 'damaged source');
  assert.ok(checkShotcraft(directory).some((e) => e.includes('Changed Shotcraft original')));
  const catalog = JSON.parse(readFileSync(resolve(directory, base, 'catalog.json'), 'utf8'));
  catalog.cards[0].nativeStatus = 'verified';
  writeFileSync(resolve(directory, base, 'catalog.json'), JSON.stringify(catalog));
  assert.ok(checkShotcraft(directory).some((e) => e.includes('must not claim native verification')));
});

test('distributed ZIP alone contains a working offline lookup and exact selected demo', (t) => {
  const directory = mkdtempSync(resolve(tmpdir(), 'shotcraft-import-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bytes = buildSeedArchive(root).bytes;
  // Read stored ZIP entries, without borrowing the source tree or installing dependencies.
  for (let offset = 0; bytes.readUInt32LE(offset) === 0x04034b50;) {
    const size = bytes.readUInt32LE(offset + 18), nameLength = bytes.readUInt16LE(offset + 26), extra = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
    const start = offset + 30 + nameLength + extra, destination = resolve(directory, name);
    assert.ok(!name.split('/').includes('..'));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes.subarray(start, start + size));
    offset = start + size;
  }
  const installed = resolve(directory, 'video-editor');
  assert.equal(run(installed, 'find', 'underline').status, 0);
  const result = run(installed, 'show', 'paper-title-card', 'paper-title-card');
  assert.equal(result.status, 0, result.stderr);
  const card = JSON.parse(result.stdout);
  assert.ok(readFileSync(card.demoFiles[0], 'utf8').includes('PAPER_TITLE_CARD_DURATION'));
  assert.ok(readFileSync(resolve(installed, 'licenses/VideoShotcraft-Apache-2.0.txt'), 'utf8').includes('Apache License'));
});
