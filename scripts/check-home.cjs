const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname,'..');
const events = new Map(), storage = new Map();
const document = {
  body:{dataset:{page:'home'}}, documentElement:{lang:'fr',dir:'ltr'},
  addEventListener(type,handler){events.set(`document:${type}`,handler);},
  querySelector(){return null;}, querySelectorAll(){return [];}
};
const sandbox = {console,document,location:{hostname:'cosmoplus.store',search:''},URLSearchParams,Intl,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail;}},
  dispatchEvent(){},addEventListener(type,handler){events.set(`window:${type}`,handler);},setTimeout,clearTimeout};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
for (const name of ['shipping-data.js','catalog-data.js','store.js','translations.js','pro.js','catalog-ui.js','communes-data.js','cosmoplus-catalog.js','cosmoplus.js','home-cosmetis.js','cosmetis-pages.js','legal.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
}
const html = vm.runInContext('shellHeader()+homePage()+shellFooter()',context);
assert(!html.includes('undefined'),'A rendered value is undefined');
assert.equal((html.match(/class="cm-hero-picture"/g)||[]).length,4,'All banners need responsive pictures');
for (const campaign of ['cosmoplus','kbeauty','sun','perfume']) assert(html.includes(`hero-${campaign}-mobile.webp`),`Missing mobile campaign ${campaign}`);
assert.equal((html.match(/<h1>/g)||[]).length,1,'One page heading');
assert(html.includes('5 000 DA'),'Catalogue price is rendered in DA');
assert(html.includes('SKIN1004'),'Real catalogue products are rendered');
assert(html.includes('id="cart-toggle"') && html.includes('id="cart-drawer"'),'Existing cart controls retained');
assert(!html.includes('cosmetis.com'),'No outgoing reference-store links');
let assets = 0, links = 0;
function checkTargets(rendered) {
assert(!rendered.includes('undefined'),'A rendered value is undefined');
for (const match of rendered.matchAll(/(?:src|srcset|href)="([^"]+)"/g)) {
  const value = match[1];
  if (!value.startsWith('/')) continue;
  const file = path.join(root,decodeURIComponent(value.split(/[?#]/)[0]).slice(1));
  assert(fs.existsSync(file) || fs.existsSync(path.join(file,'index.html')),`Missing local target: ${value}`);
  value.startsWith('/assets/') ? assets++ : links++;
}
}
checkTargets(html);
const click = events.get('document:click');
const target = {closest:()=>({dataset:{favorite:'wc-3150'}})};
click({target});
assert.deepEqual(JSON.parse(storage.get('cosmoplus-favorites-v1')),['wc-3150'],'Favorite can be saved');
click({target});
assert.deepEqual(JSON.parse(storage.get('cosmoplus-favorites-v1')),[],'Favorite can be removed');
assert.equal(vm.runInContext('cpVisible().length',context),129,'Published catalogue preserved');
for (const category of vm.runInContext('CP_CATEGORIES.map(x=>x[0])',context)) {
  sandbox.location.search=`?categorie=${category}&tri=price-asc`;
  const rendered=vm.runInContext('collectionPage()',context);
  checkTargets(rendered);
  const ids=[...rendered.matchAll(/data-quick-add="([^"]+)"/g)].map(x=>x[1]);
  const expected=vm.runInContext(`cpVisible().filter(p=>p.category===${JSON.stringify(category)}).sort((a,b)=>a.price-b.price).map(p=>p.id)`,context);
  assert.deepEqual(ids,Array.from(expected),`Category and ascending-price filter: ${category}`);
}
sandbox.location.search='?q=centella';
assert(vm.runInContext('collectionPage()',context).includes('SKIN1004'),'Catalogue search returns the catalogue products');
sandbox.location.search='?min=9999999';
assert(vm.runInContext('collectionPage()',context).includes('Aucun produit'),'Empty filter is handled');
sandbox.location.search='';
for(const fn of ['newPage()','contactPage()','aboutPage()','profilePage()','legalPage()','cartPage()','checkoutPage()'])checkTargets(vm.runInContext(fn,context));
for(const id of vm.runInContext('cpVisible().map(p=>p.id)',context))checkTargets(vm.runInContext(`productPage(byId(${JSON.stringify(id)}))`,context));
vm.runInContext("saveCart([{id:'wc-3150',size:'TU',quantity:2}])",context);
assert.equal(vm.runInContext('cartCount()',context),2,'Cart retains quantities');
const cart=vm.runInContext('cartPage()',context),checkout=vm.runInContext('checkoutPage()',context);
checkTargets(cart);checkTargets(checkout);
assert(cart.includes('data-cart-remove="wc-3150"')&&cart.includes('data-cart-change="plus"'),'Cart exposes removal and quantity controls');
assert(checkout.includes('id="checkout-commune"')&&checkout.includes('value="desk"')&&checkout.includes('id="grand-total"'),'Checkout retains commune, shipping methods and total');
assert(!checkout.includes('Yalidine')&&!checkout.includes('Taille '),'No obsolete clothing or carrier copy');
vm.runInContext("saveCart([{id:'wc-3150',size:'TU',quantity:1},{id:'wc-3150',size:'TU',quantity:2}])",context);
assert.equal(vm.runInContext('cartCount()',context),3,'Repeated additions merge quantities');
function element(dataset={}) {
  const handlers=new Map(),classes=new Set();
  return {dataset,handlers,attributes:{},classList:{toggle(name,on){on?classes.add(name):classes.delete(name);},contains:name=>classes.has(name)},
    addEventListener:(type,handler)=>handlers.set(type,handler),setAttribute(name,value){this.attributes[name]=value;}};
}
const hero=element(),slides=Array.from({length:4},()=>element()),dots=Array.from({length:4},(_,i)=>element({go:String(i)}));
const next=element({direction:'1'}),previous=element({direction:'-1'}),pause=element();
hero.contains=()=>false;
document.querySelector=selector=>selector==='.cm-hero'?hero:selector==='.cm-hero-pause'?pause:null;
document.querySelectorAll=selector=>selector==='.cm-hero .hero-slide'?slides:selector==='.cm-hero-dots [data-go]'?dots:selector==='.cm-hero [data-direction]'?[next,previous]:[];
sandbox.clearInterval=()=>{};sandbox.setInterval=callback=>{sandbox.heroTick=callback;return 1;};sandbox.matchMedia=()=>({matches:false});
vm.runInContext('setupHero()',context);
const active=()=>slides.findIndex(slide=>slide.classList.contains('active'));
assert.equal(active(),0);sandbox.heroTick();assert.equal(active(),1,'Carousel automatically advances');
pause.handlers.get('click')();sandbox.heroTick();assert.equal(active(),1,'Pause stops automatic rotation');
pause.handlers.get('click')();dots[3].handlers.get('click')();assert.equal(active(),3,'Dots select a campaign');
next.handlers.get('click')();assert.equal(active(),0,'Next arrow wraps to the first campaign');
previous.handlers.get('click')();assert.equal(active(),3,'Previous arrow wraps to the last campaign');
hero.handlers.get('touchstart')({changedTouches:[{clientX:200,clientY:100}]});
hero.handlers.get('touchend')({changedTouches:[{clientX:50,clientY:103}]});assert.equal(active(),0,'Phone swipe advances the carousel');
assert(slides.slice(1).every(slide=>slide.inert&&slide.attributes['aria-hidden']==='true'),'Hidden campaigns are removed from keyboard focus');
console.log(`Storefront checks passed: ${assets} local image references, ${links} internal links, all 129 product pages, category/search/price filters, cart and checkout, four desktop/mobile campaigns and favorites.`);
