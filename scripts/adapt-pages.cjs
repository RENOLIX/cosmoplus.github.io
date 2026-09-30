const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function walk(dir) {
  for (const item of fs.readdirSync(dir, {withFileTypes:true})) {
    if (item.name === '.git' || item.name === 'node_modules') continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.name === 'index.html') {
      const prefix = '../'.repeat(path.relative(root, dir).split(path.sep).filter(Boolean).length);
      let html = fs.readFileSync(full, 'utf8');
      html = html.replaceAll('Khadidja Boutique', 'Cosmoplus').replaceAll('Khadidja boutique', 'Cosmoplus').replaceAll('Chargement de l’espace Khadidja','Chargement de l’espace Cosmoplus');
      html = html.replace(`${prefix}assets/logo-transparent.png`, `${prefix}assets/cosmoplus-favicon.svg`);
      html = html.replace(/<script src="[^"]*meta-pixel\.js[^"]*" defer><\/script>/g, '');
      html = html.replace(/<script src="[^"]*checkout-live\.js[^"]*" defer><\/script>/g, '');
      html = html.replaceAll('cosmoplus.css?v=1', 'cosmoplus.css?v=2').replaceAll('store.js?v=meta-1', 'store.js?v=cosmoplus-2').replaceAll('cosmoplus-catalog.js?v=1', 'cosmoplus-catalog.js?v=2').replaceAll('admin.js?v=catalog-1', 'admin.js?v=2');
      if (!dir.endsWith(`${path.sep}admin`) && !html.includes('cosmoplus.css')) html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}cosmoplus.css?v=2"></head>`);
      if (dir === root) html = html.replace('Cosmoplus | Robes de soirée pour femme', 'Cosmoplus | Soins, beauté et parfums').replace('Découvrez les robes de soirée Cosmoplus : modèles nude et bleu gris pour les grandes occasions.', 'Découvrez les produits de beauté Cosmoplus : soins, protection solaire, maquillage et parfums en Algérie.');
      const target = `<script src="${prefix}firebase-client.js?v=catalog-1" defer></script>`;
      const extra = dir.endsWith(`${path.sep}admin`) ? `<script src="${prefix}cosmoplus-catalog.js?v=2" defer></script>` : `<script src="${prefix}cosmoplus-catalog.js?v=2" defer></script><script src="${prefix}cosmoplus.js?v=1" defer></script>`;
      if (!html.includes('cosmoplus-catalog.js')) {
        if (!html.includes(target)) throw Error(`Missing script tag in ${full}`);
        html = html.replace(target, extra + target);
      }
      fs.writeFileSync(full, html);
    }
  }
}
walk(root);

