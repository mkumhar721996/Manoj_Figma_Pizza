export function findFixedWidthsWiderThan(css, viewportWidth) {
  const matches = [...css.matchAll(/(?:^|[\s{;])width:\s*(\d+)px/g)];
  return matches.filter((m) => Number(m[1]) > viewportWidth).map((m) => `${m[1]}px`);
}

export function hasMobileBreakpointBelow(css, viewportWidth) {
  const matches = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)];
  return matches.some((m) => Number(m[1]) >= viewportWidth);
}
