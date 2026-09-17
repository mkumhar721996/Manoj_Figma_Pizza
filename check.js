const fs = require('fs');
const html = fs.readFileSync('/workspace/.arc/designs/MANOJ-FIGMA-PIZZA-STORY-027-design.html', 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
new Function(m[1]);
console.log('syntax OK, length', m[1].length);
