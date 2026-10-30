import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { APPLICATION_SOURCE_ID, parseArguments, locateApplication } from '../skills/video-editing/scripts/video-editing.mjs';
const wrapper = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/video-editing/scripts/video-editing.mjs');
function fixture(t) {
  const base = mkdtempSync(resolve(tmpdir(), 'video-editor-wrapper-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const appRoot = resolve(base, 'installed app');
  mkdirSync(resolve(appRoot, 'desirecore'), { recursive: true });
  const manifest = { schemaVersion: 1, definition: { id: APPLICATION_SOURCE_ID, name: '视频剪辑', version: '0.1.0', entrypoints: [{ id: 'editor', serviceRef: 'video-editing:editor' }] } };
  writeFileSync(resolve(appRoot, 'desirecore/app-release.json'), JSON.stringify(manifest));
  writeFileSync(resolve(appRoot, 'desirecore/cli.mjs'), 'console.log(JSON.stringify(process.argv.slice(2))); if(process.argv.includes("stale-generation")) process.exitCode=23;');
  return { appRoot, manifest, base };
}
test('argument boundary preserves application flags without a shell', () => {
  assert.deepEqual(parseArguments(['--app-root', 'app', '--', 'status', '--runtime-file', 'runtime file.json']), { appRoot: 'app', locate: false, forwarded: ['status', '--runtime-file', 'runtime file.json'] });
  assert.throws(() => parseArguments(['--app-root']), /directory/);
  assert.throws(() => parseArguments(['--locate', '--', 'status']), /cannot/);
});
test('locator requires explicit installed material and rejects upstream or another app', (t) => {
  const { appRoot, manifest } = fixture(t);
  assert.throws(() => locateApplication({ env: {}, cwd: appRoot }), /Set VIDEO_EDITING_ROOT/);
  assert.equal(locateApplication({ env: { VIDEO_EDITING_ROOT: appRoot } }).sourceId, APPLICATION_SOURCE_ID);
  manifest.definition.id = '98951c8f-3f46-4215-aea7-db5d06abc942';
  writeFileSync(resolve(appRoot, 'desirecore/app-release.json'), JSON.stringify(manifest));
  assert.throws(() => locateApplication({ appRoot }), /not the expected/);
});
test('CLI receives runtime-file arguments exactly and its failure is propagated', (t) => {
  const { appRoot, base } = fixture(t);
  const runtime = resolve(base, 'actual runtime.json');
  const args = ['status', '--runtime-file', runtime, 'literal;$(should-not-run)'];
  const result = spawnSync(process.execPath, [wrapper, '--app-root', appRoot, '--', ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), args);
  const stale = spawnSync(process.execPath, [wrapper, '--app-root', appRoot, '--', 'identity', '--runtime-file', 'stale-generation'], { encoding: 'utf8' });
  assert.equal(stale.status, 23);
});
test('locate performs no application execution and no-command fails without starting', (t) => {
  const { appRoot } = fixture(t);
  writeFileSync(resolve(appRoot, 'desirecore/cli.mjs'), 'throw new Error("must not execute")');
  const located = spawnSync(process.execPath, [wrapper, '--app-root', appRoot, '--locate'], { encoding: 'utf8' });
  assert.equal(located.status, 0);
  assert.equal(JSON.parse(located.stdout).version, '0.1.0');
  const empty = spawnSync(process.execPath, [wrapper, '--app-root', appRoot], { encoding: 'utf8' });
  assert.equal(empty.status, 1);
  assert.match(empty.stderr, /Pass a domain command/);
  assert.doesNotMatch(empty.stderr, /must not execute/);
});
test('locator rejects a CLI symlink outside installed material', { skip: process.platform === 'win32' }, (t) => {
  const { appRoot, base } = fixture(t);
  const outside = resolve(base, 'outside.mjs');
  writeFileSync(outside, 'throw new Error("outside")');
  unlinkSync(resolve(appRoot, 'desirecore/cli.mjs'));
  symlinkSync(outside, resolve(appRoot, 'desirecore/cli.mjs'));
  assert.throws(() => locateApplication({ appRoot }), /escapes/);
});

// Metadata lookup alone does not attach or grant any application permission.
test('locator prefers the real fixed-root manifest and never falls back from an invalid fixed release', (t) => {
  const { appRoot, manifest } = fixture(t);
  writeFileSync(resolve(appRoot, 'app-release.json'), JSON.stringify(manifest));
  unlinkSync(resolve(appRoot, 'desirecore/app-release.json'));
  assert.equal(locateApplication({ appRoot }).version, '0.1.0');
  writeFileSync(resolve(appRoot, 'desirecore/app-release.json'), JSON.stringify(manifest));
  const foreign = structuredClone(manifest);
  foreign.definition.id = '98951c8f-3f46-4215-aea7-db5d06abc942';
  writeFileSync(resolve(appRoot, 'app-release.json'), JSON.stringify(foreign));
  assert.throws(() => locateApplication({ appRoot }), /not the expected/);
});
