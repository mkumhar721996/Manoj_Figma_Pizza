export function findDuplicateIds(html) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  const duplicates = new Set();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

export function getHeadingLevels(html) {
  return [...html.matchAll(/<h([1-6])[ >]/g)].map((m) => Number(m[1]));
}

export function hasSkippedHeadingLevel(levels) {
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] - levels[i - 1] > 1) return true;
  }
  return false;
}

export function countLandmarks(html, tag) {
  const pattern = new RegExp(`<${tag}[ >]`, 'g');
  return [...html.matchAll(pattern)].length;
}

export function linksMissingAccessibleName(html) {
  const anchors = [...html.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
  return anchors.filter((m) => m[2].replace(/<[^>]+>/g, '').trim() === '').map((m) => m[1]);
}
