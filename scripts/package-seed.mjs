#!/usr/bin/env node
/** Deterministic ZIP (stored entries) from an explicit clean-source allowlist. No dependencies. */
import { readFileSync, lstatSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { SEED_FILES, SEED_ROOT } from './seed-files.mjs';
import { checkContent } from './content-check.mjs';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function readSeedFiles(root = sourceRoot) {
  const actualRoot = realpathSync(root);
  return SEED_FILES.map((name) => {
    let current = actualRoot;
    for (const part of name.split('/')) {
      current = resolve(current, part);
      const entry = lstatSync(current);
      if (entry.isSymbolicLink()) throw new Error(`Seed source cannot contain symlinks: ${name}`);
    }
    if (!lstatSync(current).isFile()) throw new Error(`Not a regular seed file: ${name}`);
    if (relative(actualRoot, realpathSync(current)).split(sep).includes('..')) throw new Error(`Source escapes seed: ${name}`);
    return { name: `${SEED_ROOT}/${name}`, data: readFileSync(current) };
  });
}
export function buildSeedArchive(root = sourceRoot) {
  const entries = readSeedFiles(root);
  const local = [], central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const encoded = Buffer.from(name, 'utf8');
    const checksum = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(33, 12); // 1980-01-01, stable archive timestamps
    header.writeUInt32LE(checksum, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(encoded.length, 26);
    local.push(header, encoded, data);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x0800, 8); record.writeUInt16LE(33, 14);
    record.writeUInt32LE(checksum, 16); record.writeUInt32LE(data.length, 20); record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(encoded.length, 28); record.writeUInt32LE(offset, 42);
    central.push(record, encoded); offset += header.length + encoded.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return { bytes: Buffer.concat([...local, directory, end]), entries: entries.map(({ name, data }) => ({ name, size: data.length, sha256: createHash('sha256').update(data).digest('hex') })) };
}
export function main(args = process.argv.slice(2)) {
  if (args.length !== 2 || args[0] !== '--output') throw new Error('Usage: node scripts/package-seed.mjs --output <new.zip>');
  const checks = checkContent(sourceRoot);
  if (checks.errors.length) throw new Error(checks.errors.join('\n'));
  const output = resolve(args[1]);
  const { bytes, entries } = buildSeedArchive();
  writeFileSync(output, bytes, { flag: 'wx' });
  console.log(JSON.stringify({ output, root: SEED_ROOT, files: entries.length, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`video-editor package: ${error.message}`); process.exitCode = 1; }
}
