const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'woocommerce-products.json'), 'utf8'));
const drafts = JSON.parse(fs.readFileSync(path.join(root, 'woocommerce-drafts.json'), 'utf8'));
const decode = s => String(s || '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&(?:amp|nbsp|quot|apos|lt|gt|rsquo|lsquo);/g, x => ({'&amp;':'&','&nbsp;':' ','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&rsquo;':'’','&lsquo;':'‘'}[x]));
const localImage = src => src ? `/assets/products/${crypto.createHash('sha256').update(src).digest('hex').slice(0,20)}${path.extname(new URL(src).pathname).toLowerCase()}?v=products-1` : '';
function category(p) {
  const hay = `${p.name} ${(p.categories || []).map(c => c.name).join(' ')}`.toLowerCase();
  if (/parfum|fragrance|brume/.test(hay)) return 'parfums';
  if (/maquillage|fond de teint|mascara|rouge à lèvres/.test(hay)) return 'maquillage';
  if (/shampoo|cheveu|capill|anticaída/.test(hay)) return 'cheveux';
  if (/solaire|sun|spf|uv|écran total|protect &/.test(hay)) return 'solaires';
  if (/douche|déodorant|dentifrice|corps|savon|baume/.test(hay)) return 'corps';
  return 'soins-visage';
}
const products = source.map(p => ({
  id: `wc-${p.id}`, wpId: p.id, name: decode(p.name), short: decode(p.name),
  description: decode((p.description || p.short_description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()),
  details: '', color: '', swatch: '#eee8e4', sizes: ['TU'],
  price: Number(p.prices?.price || 0) / 10 ** Number(p.prices?.currency_minor_unit || 0),
  category: category(p), stock: p.is_in_stock === false ? 0 : null,
  images: (p.images || []).map(i => localImage(i.src)).filter(Boolean),
  cover: localImage(p.images?.[0]?.src), url: `/produit/?id=wc-${p.id}`, active: true,
  brand: decode(p.brands?.[0]?.name || ''),
  _source: null
}));
for (const p of drafts) products.push({
  id:`wc-${p.id}`,wpId:p.id,name:p.name,short:p.name,description:'',details:'',color:'',swatch:'#eee8e4',sizes:['TU'],
  price:0,category:category(p),stock:null,images:[],cover:'',url:`/produit/?id=wc-${p.id}`,active:false,draft:true,brand:'',_source:null
});
products.forEach(p => p._source = {name:p.name,short:p.short,description:p.description,details:p.details,color:p.color});
if (products.length !== 131 || products.filter(p => p.active).some(p => !p.images.length || !Number.isFinite(p.price))) throw Error('Catalogue incomplet');
fs.writeFileSync(path.join(root, 'cosmoplus-catalog.js'), `// Export WooCommerce public du 30 septembre 2026.\nwindow.COSMOPLUS_CATALOG = ${JSON.stringify(products)};\n`);
const mediaMap = Object.fromEntries(source.flatMap(p => (p.images || []).map(i => [i.src,localImage(i.src)])));
fs.appendFileSync(path.join(root,'cosmoplus-catalog.js'),`window.COSMOPLUS_MEDIA_MAP = ${JSON.stringify(mediaMap)};\n`);
console.log(`Generated ${products.length} products, including ${drafts.length} hidden drafts`);
