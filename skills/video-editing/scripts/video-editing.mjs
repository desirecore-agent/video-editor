#!/usr/bin/env node
/** Explicit installed-material locator. The application CLI owns live generation checks. */
import { existsSync, readFileSync, realpathSync, lstatSync } from 'node:fs';
import { dirname, isAbsolute, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export const APPLICATION_SOURCE_ID = '0171a763-ad35-4b94-98b9-204782817b44';
export function parseArguments(args) {
  let appRoot, locate = false;
  const forwarded = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') { forwarded.push(...args.slice(index + 1)); break; }
    if (arg === '--app-root') {
      if (appRoot || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error('--app-root requires one directory.');
      appRoot = args[++index];
    } else if (arg === '--locate') { locate = true; }
    else forwarded.push(arg);
  }
  if (locate && forwarded.length) throw new Error('--locate cannot also execute application commands.');
  return { appRoot, locate, forwarded };
}
export function locateApplication({ appRoot, env = process.env, cwd = process.cwd() } = {}) {
  const configured = appRoot ?? env.VIDEO_EDITING_ROOT;
  if (typeof configured !== 'string' || !configured.trim()) throw new Error('Set VIDEO_EDITING_ROOT or --app-root to the installed material root returned by DesireCore. No software was downloaded or started.');
  const directory = realpathSync(isAbsolute(configured) ? configured : resolve(cwd, configured));
  // Fixed installed releases carry their manifest at the executing root.
  // The nested source draft is useful for --locate/--help only; the app CLI
  // separately verifies all fixed payload bytes before attaching to a runtime.
  const fixedManifest = resolve(directory, 'app-release.json');
  const manifestPath = existsSync(fixedManifest) ? fixedManifest : resolve(directory, 'desirecore/app-release.json');
  const cliPath = resolve(directory, 'desirecore/cli.mjs');
  if (!existsSync(manifestPath) || !existsSync(cliPath)) throw new Error('Video-editing requires a root app-release.json (or source draft) and desirecore/cli.mjs.');
  const manifestStat = lstatSync(manifestPath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.size > 4 * 1024 * 1024) throw new Error('Application manifest must be a regular bounded file.');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.definition?.id !== APPLICATION_SOURCE_ID
    || manifest.definition?.name !== '视频剪辑'
    || !/^\d+\.\d+\.\d+$/.test(manifest.definition?.version ?? '')
    || !manifest.definition?.entrypoints?.some((entry) => entry.id === 'editor' && entry.serviceRef === 'video-editing:editor')) {
    throw new Error('Material is not the expected 视频剪辑 application.');
  }
  const cli = realpathSync(cliPath);
  if (!lstatSync(cli).isFile() || isAbsolute(relative(directory, cli)) || relative(directory, cli).split(sep).includes('..')) throw new Error('Application CLI escapes the material root.');
  return { appRoot: directory, cli, sourceId: APPLICATION_SOURCE_ID, version: manifest.definition.version };
}
export async function main(args = process.argv.slice(2)) {
  const { appRoot, locate, forwarded } = parseArguments(args);
  const application = locateApplication({ appRoot });
  if (locate) { process.stdout.write(`${JSON.stringify(application)}\n`); return 0; }
  if (!forwarded.length) throw new Error('Pass a domain command after --; use --locate for a read-only material lookup.');
  const child = spawn(process.execPath, [application.cli, ...forwarded], { cwd: process.cwd(), env: process.env, stdio: 'inherit', shell: false });
  const onInterrupt = () => child.kill('SIGINT'), onTerminate = () => child.kill('SIGTERM');
  process.once('SIGINT', onInterrupt); process.once('SIGTERM', onTerminate);
  try {
    return await new Promise((resolveExit, reject) => {
      child.once('error', reject);
      child.once('exit', (code, signal) => resolveExit(code ?? (signal === 'SIGINT' ? 130 : 143)));
    });
  } finally {
    process.removeListener('SIGINT', onInterrupt); process.removeListener('SIGTERM', onTerminate);
  }
}
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]))) {
  main().then((code) => { process.exitCode = code; }).catch((error) => { console.error(`video-editor: ${error.message}`); process.exitCode = 1; });
}
