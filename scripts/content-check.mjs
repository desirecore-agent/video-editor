import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { SEED_FILES } from './seed-files.mjs';
/** Source-policy checks supplement the current platform Schema and skill parser. */
export function checkContent(root) {
  const read = (name) => readFileSync(resolve(root, name), 'utf8');
  const config = JSON.parse(read('agent.json'));
  const errors = [];
  const requireValue = (value, message) => { if (!value) errors.push(message); };
  requireValue(config.$schema === 'http://desirecore/schemas/agent-seed.json', 'Source must use agent-seed Schema.');
  requireValue(config.name === '视频剪辑师' && config.id === 'c5a424f2-d946-47fd-a12e-2602d0da37ed', 'New Agent identity must be preserved.');
  requireValue(config.avatar?.generationPolicy === 'manual' && config.avatar?.char === '剪', 'Bundled avatar must use manual policy with deterministic fallback.');
  const avatarPath = config.avatar?.image?.path;
  requireValue(avatarPath === 'assets/avatar.png' && SEED_FILES.includes(avatarPath), 'The portrait must be referenced and included in the distributable seed.');
  if (avatarPath === 'assets/avatar.png' && existsSync(resolve(root, avatarPath))) {
    const image = readFileSync(resolve(root, avatarPath));
    requireValue(image.length <= 2 * 1024 * 1024 && image.length > 33
      && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      && image.subarray(12, 16).toString('ascii') === 'IHDR' && image[25] === 6,
    'The bundled portrait must be a transparent RGBA PNG within the marketplace limit.');
  } else requireValue(false, 'The bundled portrait is missing.');
  requireValue(config.llm?.routingMode === 'smart' && config.llm?.smart?.profile?.tier === 'flagship', 'Seed must declare flagship Smart intent.');
  for (const key of ['provider', 'providerId', 'model']) requireValue(!Object.hasOwn(config.llm ?? {}, key), `Must not bind llm.${key}.`);
  for (const key of ['assigned', 'providerPolicy', 'allowedProviderIds', 'tier']) requireValue(!Object.hasOwn(config.llm?.smart ?? {}, key), `Must not persist smart.${key}.`);
  requireValue(Object.keys(config.mcp_servers ?? {}).length === 0, 'Seed must not configure MCP.');
  requireValue(config.compute_credentials?.allowed_providers?.length === 0, 'Seed must not grant compute credentials.');
  requireValue(!config.default_enabled?.tools?.length && !config.tool_permissions, 'Seed must not grant tools.');
  const skills = config.default_enabled?.skills ?? [];
  requireValue(JSON.stringify(skills) === JSON.stringify(['video-editing', 'edit-video', 'motion-graphics', 'remake-reel']), 'Expected four independent skills.');
  const activeFiles = ['README.md', 'README.en-US.md', 'USAGE.md', 'AGENTS.md', 'persona.md', 'principles.md', 'instructions.md'];
  for (const id of skills) {
    const name = `skills/${id}/SKILL.md`;
    if (!/^[a-z0-9-]+$/.test(id) || !existsSync(resolve(root, name))) { errors.push(`Missing or unsafe skill: ${id}`); continue; }
    activeFiles.push(name);
    const text = read(name);
    requireValue(text.startsWith('---\n') && text.match(/^name: (.+)$/m)?.[1] === id && /^description: \S.+$/m.test(text), `Incomplete skill metadata: ${id}`);
    requireValue(!/npx\s+(?:-y\s+)?fablecut|node\s+server\.js/.test(text.replace(/不[^。\n]*/g, '')), `Active skill starts an independent upstream runtime: ${id}`);
  }
  for (const name of ['persona.md', 'principles.md']) {
    const text = read(name);
    requireValue(JSON.stringify(text.match(/^## L[012]$/gm)) === JSON.stringify(['## L0', '## L1', '## L2']), `${name} must have exact ordered L0/L1/L2 headings.`);
    const chapters = (text.split('## L2\n')[1] ?? '').split(/^### /m).slice(1);
    const ids = [];
    for (const chapter of chapters) {
      try {
        const marker = JSON.parse(chapter.match(/<!-- prompt-section: (.+) -->/)?.[1] ?? 'null');
        requireValue(marker?.mode === 'on_demand' && marker?.id && marker?.desc, `Invalid L2 chapter in ${name}.`);
        if (marker?.id) ids.push(marker.id);
      } catch { errors.push(`Malformed L2 marker in ${name}.`); }
    }
    requireValue(ids.length > 0 && ids.length === new Set(ids).size, `${name} needs unique L2 sections.`);
  }
  for (const name of activeFiles) {
    const text = read(name);
    requireValue(!/\/(?:Users|Volumes)\//.test(text), `Machine path in ${name}.`);
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
      const destination = resolve(dirname(resolve(root, name)), decodeURIComponent(target.split('#')[0]));
      requireValue(!relative(root, destination).split(sep).includes('..') && existsSync(destination), `Broken local reference in ${name}: ${target}`);
    }
  }
  for (const name of SEED_FILES) requireValue(existsSync(resolve(root, name)), `Missing seed file: ${name}`);
  const source = JSON.parse(read('skills/video-editing/references/upstream/SOURCE.json'));
  requireValue(source.commit === '61bf46babca82214c162c0650e47a81c3530982c', 'Upstream source must be fixed.');
  for (const [name, expected] of Object.entries(source.files)) {
    const original = `skills/video-editing/references/upstream/${name.replace('SKILL.md', 'SKILL.original.md')}`;
    requireValue(createHash('sha256').update(readFileSync(resolve(root, original))).digest('hex') === expected, `Changed upstream original: ${original}`);
  }
  requireValue(read('licenses/FableCut-MIT.txt').includes('Copyright (c) 2026 ronak-create'), 'Full upstream MIT attribution is required.');
  const walk = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
      requireValue(!/^(?:CLAUDE\.md|CLAUDE\.local\.md)$/.test(entry.name), 'AGENTS.md is the only collaboration entrypoint.');
      if (entry.isDirectory()) walk(resolve(folder, entry.name));
    }
  };
  walk(root);
  return { config, errors, skills: skills.length };
}
