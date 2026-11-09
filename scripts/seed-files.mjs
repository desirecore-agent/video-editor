/** Exact distributable source list. Runtime, preferences and authoring tools never enter a seed. */
export const SEED_ROOT = 'video-editor';
export const SEED_FILES = Object.freeze([
  'agent.json', 'assets/avatar.png', 'assets/README.md', 'persona.md', 'principles.md', 'instructions.md',
  'README.md', 'README.en-US.md', 'USAGE.md', 'LICENSE', 'NOTICE',
  'licenses/FableCut-MIT.txt',
  'skills/video-editing/SKILL.md',
  'skills/video-editing/scripts/video-editing.mjs',
  'skills/video-editing/references/upstream/SOURCE.json',
  'skills/video-editing/references/upstream/skills/edit-video/SKILL.original.md',
  'skills/video-editing/references/upstream/skills/motion-graphics/SKILL.original.md',
  'skills/video-editing/references/upstream/skills/remake-reel/SKILL.original.md',
  'skills/edit-video/SKILL.md', 'skills/motion-graphics/SKILL.md', 'skills/remake-reel/SKILL.md',
]);
