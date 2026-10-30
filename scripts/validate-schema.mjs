import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const [platformRoot, agentRoot] = process.argv.slice(2);
const requirePlatform = createRequire(resolve(platformRoot, 'package.json'));
const Ajv = requirePlatform('ajv');
const addFormats = requirePlatform('ajv-formats');
const { agentSeedConfigSchema } = await import(pathToFileURL(resolve(platformRoot, 'packages/schemas/src/agent/agent-config.ts')).href);
const { parseSkillMarkdown } = await import(pathToFileURL(resolve(platformRoot, 'packages/agent-service/src/skills/parser.ts')).href);
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(agentSeedConfigSchema);
const config = JSON.parse(readFileSync(resolve(agentRoot, 'agent.json'), 'utf8'));
if (!validate(config)) throw new Error(`Agent seed Schema rejected source: ${JSON.stringify(validate.errors)}`);
for (const id of config.default_enabled?.skills ?? []) {
  const parsed = parseSkillMarkdown(readFileSync(resolve(agentRoot, 'skills', id, 'SKILL.md'), 'utf8'), id, 'zh-CN');
  if (!parsed.valid || parsed.metadata.name !== id || !parsed.metadata.description) throw new Error(`Skill ${id}: ${JSON.stringify(parsed.validationErrors ?? parsed.metadata)}`);
}
const platformSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: platformRoot, encoding: 'utf8' }).trim();
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sourceFiles = Object.fromEntries(['packages/schemas/src/agent/agent-config.ts', 'packages/agent-service/src/skills/parser.ts'].map((file) => [file, sha256(resolve(platformRoot, file))]));
console.log(JSON.stringify({ agentSeedSchema: 'passed', skillParser: 'passed', skills: config.default_enabled.skills.length, node: process.version, platformRoot, platformSha, sourceFiles, agentConfigSha256: sha256(resolve(agentRoot, 'agent.json')) }));
