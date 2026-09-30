const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname,'..');
const products = JSON.parse(fs.readFileSync(path.join(root,'woocommerce-products.json'),'utf8'));
for (const product of products) {
  const old = new URL(product.permalink);
  if (old.hostname !== 'cosmoplus.store' || !old.pathname.startsWith('/product/')) throw Error(`Unexpected old URL: ${old}`);
  const slug = decodeURIComponent(old.pathname.split('/').filter(Boolean).at(-1));
  if (!/^[a-z0-9-]+$/i.test(slug)) throw Error(`Unexpected slug: ${slug}`);
  const target = `/produit/?id=wc-${product.id}`;
  const dir = path.join(root,'product',slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="https://cosmoplus.store${target}"><title>Produit Cosmoplus</title></head><body><p><a href="${target}">Voir ce produit sur Cosmoplus</a></p></body></html>\n`);
}
console.log(`${products.length} anciens liens produit redirigés.`);
