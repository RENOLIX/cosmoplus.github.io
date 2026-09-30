const fs = require('fs');
const path = require('path');
const source = JSON.parse(fs.readFileSync(path.join(__dirname,'..','woocommerce-products.json'),'utf8'));
const root = path.join(__dirname,'..');
const host = 'https://cosmoplus-1-1362ac4.ingress-bonde.ewp.live';
const images = [...new Set(source.flatMap(p => (p.images || []).map(i => i.src).filter(Boolean)))];
const failed = [];
let completed = 0, cursor = 0;
async function download(src) {
  const sourceUrl = new URL(src);
  if (sourceUrl.hostname !== 'cosmoplus.store' || !sourceUrl.pathname.startsWith('/wp-content/uploads/')) throw Error(`Unexpected source: ${src}`);
  const target = path.resolve(root,...sourceUrl.pathname.split('/').slice(1).map(decodeURIComponent));
  if (!target.startsWith(path.resolve(root) + path.sep)) throw Error(`Invalid destination: ${target}`);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  if (fs.existsSync(target) && fs.statSync(target).size > 1000) { completed++; return; }
  const url = `${host}${sourceUrl.pathname}${sourceUrl.search}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url,{signal:AbortSignal.timeout(30000)});
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw Error(`${response.status} ${response.headers.get('content-type')}`);
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length < 1000) throw Error('Image trop petite');
      fs.writeFileSync(target,data); completed++; return;
    } catch(error) { if (attempt === 2) failed.push({src,error:String(error)}); }
  }
}
async function worker() { while (cursor < images.length) { const index = cursor++; await download(images[index]); if (completed % 20 === 0) console.log(`${completed}/${images.length} images récupérées`); } }
Promise.all(Array.from({length:5},worker)).then(() => {
  console.log(`${completed}/${images.length} images disponibles`);
  if (failed.length) { console.error(JSON.stringify(failed,null,2)); process.exitCode = 1; }
});
