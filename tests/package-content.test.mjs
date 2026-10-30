import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, writeFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { checkContent } from '../scripts/content-check.mjs';
import { buildSeedArchive } from '../scripts/package-seed.mjs';
import { SEED_FILES, SEED_ROOT } from '../scripts/seed-files.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const directory = mkdtempSync(resolve(tmpdir(), 'video-editor-seed-'));
  cpSync(root, directory, { recursive: true, filter: (name) => !name.includes(`${root}/.git`) && !name.includes(`${root}/dist`) });
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function zipEntries(bytes) {
  const entries = [];
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    const length = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26), extra = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
    const dataOffset = offset + 30 + nameLength + extra;
    entries.push({ name, data: bytes.subarray(dataOffset, dataOffset + length) });
    offset = dataOffset + length;
  }
  assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
  return entries;
}

test('source policies, layered prompts and exact upstream originals are valid', () => {
  assert.deepEqual(checkContent(root).errors, []);
});

test('archive is deterministic and contains only explicit distributable source', (t) => {
  const directory = fixture(t);
  writeFileSync(resolve(directory, 'exec-approvals.json'), '{"forbidden":"approval"}');
  writeFileSync(resolve(directory, 'provider-secret.txt'), 'not-a-real-secret');
  const archive = buildSeedArchive(directory);
  assert.deepEqual(archive.bytes, buildSeedArchive(directory).bytes);
  const entries = zipEntries(archive.bytes);
  assert.deepEqual(entries.map(({ name }) => name), SEED_FILES.map((name) => `${SEED_ROOT}/${name}`));
  assert.equal(entries.length, 19);
  for (const { name, data } of entries) {
    assert.ok(!name.includes('..') && !name.startsWith('/'));
    const record = archive.entries.find((entry) => entry.name === name);
    assert.equal(record.sha256, createHash('sha256').update(data).digest('hex'));
  }
  const config = JSON.parse(entries.find(({ name }) => name.endsWith('/agent.json')).data.toString('utf8'));
  assert.equal(config.id, 'c5a424f2-d946-47fd-a12e-2602d0da37ed');
  assert.deepEqual(config.mcp_servers, {});
});

test('whitelisted symlinks and absent files fail closed', (t) => {
  const directory = fixture(t);
  unlinkSync(resolve(directory, 'instructions.md'));
  if (process.platform !== 'win32') {
    symlinkSync(resolve(directory, 'principles.md'), resolve(directory, 'instructions.md'));
    assert.throws(() => buildSeedArchive(directory), /symlinks/);
    unlinkSync(resolve(directory, 'instructions.md'));
  }
  assert.throws(() => buildSeedArchive(directory), /ENOENT/);
});

test('source check detects accidental model grants and damaged provenance', (t) => {
  const directory = fixture(t);
  const result = checkContent(directory);
  result.config.llm.model = 'unwanted-fixed-model';
  writeFileSync(resolve(directory, 'agent.json'), JSON.stringify(result.config));
  assert.ok(checkContent(directory).errors.some((error) => error.includes('llm.model')));
  writeFileSync(resolve(directory, 'skills/video-editing/references/upstream/skills/edit-video/SKILL.original.md'), 'modified');
  assert.ok(checkContent(directory).errors.some((error) => error.includes('Changed upstream original')));
});
