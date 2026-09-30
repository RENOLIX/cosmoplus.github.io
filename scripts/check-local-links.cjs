const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const missing = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const file = path.join(dir,entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = fs.readFileSync(file,'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const value = match[1];
      if (/^(?:https?:|data:|blob:|mailto:|tel:|#|javascript:)/.test(value)) continue;
      const local = value.split(/[?#]/)[0];
      if (!local) continue;
      const target = local.startsWith('/') ? path.join(root,local.slice(1)) : path.resolve(dir,local);
      if (!fs.existsSync(target) && !fs.existsSync(path.join(target,'index.html'))) missing.push(`${path.relative(root,file)} -> ${value}`);
    }
  }
}
visit(root);
if (missing.length) { console.error(missing.join('\n')); process.exitCode = 1; }
else console.log('Tous les liens locaux présents dans les fichiers HTML sont valides.');
