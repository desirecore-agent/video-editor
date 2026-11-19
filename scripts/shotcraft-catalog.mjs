/** Resolve only demo paths actually mentioned by a card, without guessing a style-to-file mapping. */
export function referencedDemos(document, sourcePaths) {
  const mentions = [...document.matchAll(/demos\/[\w/-]+(?:\.tsx)?/g)].map(([s]) => s.replace(/\/$/, ''));
  return sourcePaths.filter((p) => p.startsWith('demos/') && mentions.some((m) => p === m || p.startsWith(m + '/')));
}
