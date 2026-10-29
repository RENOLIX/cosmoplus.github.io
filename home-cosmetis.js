// Cosmoplus homepage: reference layout adapted to the existing catalogue and checkout.
const cmCollection = (category = '') => `${CP_COLLECTION}${category ? `?categorie=${category}` : ''}`;
const cmSearch = value => `${CP_COLLECTION}?q=${encodeURIComponent(value)}`;
const cmHeart = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
const cmAccount = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="12" cy="6" r="4"/><path d="M3 22v-4a9 7 0 0 1 18 0v4Z"/></svg>';
const cmBaseHeader = shellHeader;
const cmCategories = [
  ['soins-visage','SOINS VISAGE','category-face.png'],
  ['corps','CORPS & HYGIÈNE','category-body.png'],
  ['cheveux','CHEVEUX','category-hair.png'],
  ['solaires','PROTECTION SOLAIRE','category-sun.png'],
  ['maquillage','MAQUILLAGE','category-makeup.png'],
  ['parfums','PARFUMS',null]
];
function cmFavorites() {
  try { return JSON.parse(localStorage.getItem('cosmoplus-favorites-v1') || '[]').filter(id => byId(id)); }
  catch { return []; }
}
shellHeader = function() {
  const original = cmBaseHeader();
  const commerce = original.slice(original.indexOf('<div class="drawer-overlay"'));
  return `<div class="cm-promo"><a href="/livraison-retours/"><strong>Livraison en Algérie</strong> à domicile et en bureau <span>· Voir les conditions</span></a><span class="cm-locale">FR&nbsp; | &nbsp;DA</span></div>
  <header class="site-header cm-header"><div class="cm-header-main">
    <button class="icon-button cm-menu" id="menu-toggle" aria-label="Ouvrir le menu">${svg('menu')}</button>
    <a class="cm-logo" href="/" aria-label="Cosmoplus, accueil">cosmoplus</a>
    <form class="header-search cm-search" id="header-search" role="search"><input name="q" type="search" placeholder="Rechercher dans toute la boutique…" aria-label="Rechercher un produit ou une marque"><button aria-label="Rechercher">${svg('search')}</button></form>
    <div class="cm-header-actions"><button class="icon-button cm-search-toggle" id="search-toggle" aria-label="Rechercher">${svg('search')}</button><button class="icon-button cm-wishlist-toggle" data-wishlist-toggle aria-label="Mes favoris">${cmHeart}<span class="cm-favorite-count" hidden></span></button><button class="icon-button bag-link" id="cart-toggle" aria-label="Ouvrir le panier">${svg('bag')}<span class="bag-count" data-cart-count>0</span></button><a class="icon-button cm-account" href="/profil/" aria-label="Mon compte">${cmAccount}</a></div>
  </div><nav class="main-nav cm-nav" id="main-nav" aria-label="Navigation principale"><a class="cm-nav-featured" href="/nouveautes/">Nouveautés</a><a href="${cmSearch('Centella')}">K-Beauty</a><details class="cm-brands-menu"><summary>Marques</summary><div>${['Vichy','La Roche-Posay','Eucerin','Avène','CeraVe','Bioderma','Nivea',"L’Oréal"].map(brand => `<a href="${cmSearch(brand)}">${cpSafe(brand)}</a>`).join('')}</div></details>${CP_CATEGORIES.map(([id,label]) => `<a href="${cmCollection(id)}">${label}</a>`).join('')}<a href="${cmCollection()}">Tous les produits</a></nav>
  <form class="search-panel" id="search-form" role="search" hidden><label for="search-input">Rechercher un produit</label><div><input id="search-input" name="q" type="search" placeholder="Produit, marque, soin…"><button type="submit">RECHERCHER</button></div></form></header>${commerce}
  <dialog class="cm-wishlist" id="cm-wishlist"><div class="cm-dialog-heading"><h2>Mes favoris</h2><button class="icon-button" data-close-wishlist aria-label="Fermer les favoris">${svg('close')}</button></div><div id="cm-wishlist-items"></div></dialog>`;
};
productCard = function(p) {
  const favorite = cmFavorites().includes(p.id), unavailable = KB_STOCK(p) === 0;
  return `<article class="product-card cm-product"><a href="${p.url}" class="card-image"><img src="${cpSafe(cpImage(p))}" alt="${cpSafe(p.name)}" loading="lazy" decoding="async"></a><div class="cm-price-row"><strong>${money(p.price)}</strong><button type="button" class="cm-favorite" data-favorite="${cpSafe(p.id)}" aria-label="Enregistrer ${cpSafe(p.name)} dans les favoris" aria-pressed="${favorite}">${cmHeart}</button></div><span class="cm-product-brand">${cpSafe(p.brand || cpCat(p.category))}</span><a class="cm-product-name" href="${p.url}">${cpSafe(p.name)}</a><button class="cm-buy" type="button" data-quick-add="${cpSafe(p.id)}" ${unavailable ? 'disabled' : ''}>${unavailable ? 'INDISPONIBLE' : 'AJOUTER AU PANIER'}</button></article>`;
};
function cmProducts(title, list, id) {
  return `<section class="cm-product-section cm-wrap" aria-labelledby="${id}-title"><h2 id="${id}-title">${title}</h2><div class="cm-carousel"><button class="cm-carousel-arrow cm-prev" data-scroll="${id}" data-step="-1" aria-label="Produits précédents">${svg('chevron')}</button><div class="cm-product-rail" id="${id}">${list.map(productCard).join('')}</div><button class="cm-carousel-arrow cm-next" data-scroll="${id}" data-step="1" aria-label="Produits suivants">${svg('chevron')}</button></div></section>`;
}
function cmEditorial(cards) {
  return `<section class="cm-editorials cm-wrap">${cards.map(([id,title,text,image,tag]) => `<article><a class="cm-editorial-image" href="${cmCollection(id)}"><img src="/assets/home/${image}" alt="Sélection ${cpSafe(title)}" loading="lazy"><div class="cm-editorial-overlay"><span>${tag}</span><strong>Les essentiels</strong><small>COSMOPLUS</small></div></a><h2><a href="${cmCollection(id)}">${title}</a></h2><p>${text}</p><a class="cm-button" href="${cmCollection(id)}">DÉCOUVRIR</a></article>`).join('')}</section>`;
}
function cmHeroImage(image, index, alt) {
  const mobile=image.replace(/\.(jpg|webp)$/,'-mobile.webp');
  return `<picture class="cm-hero-picture"><source media="(max-width: 680px)" srcset="/assets/home/${mobile}"><img class="cm-hero-photo" src="/assets/home/${image}" alt="${cpSafe(alt)}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}></picture>`;
}
homePage = function() {
  const all = cpVisible();
  const select = ids => ids.map(id => all.find(p => p.id === id)).filter(Boolean);
  const trending = select(['wc-3150','wc-3267','wc-3309','wc-3145','wc-3138','wc-3302']);
  const essentials = select(['wc-3211','wc-3254','wc-3120','wc-3095','wc-3277','wc-3070']);
  const brands = [['VICHY','Vichy','brand-vichy.png'],['LA ROCHE-POSAY','La Roche-Posay','brand-laroche.png'],['EUCERIN','Eucerin','brand-eucerin.png'],['AVÈNE','Avène','brand-avene.png']];
  const slides = [
    ['LA BEAUTÉ AU QUOTIDIEN','Votre rituel','beauté','Soins, cosmétiques & parfums','hero-cosmoplus.jpg',cmCollection(),'#ded9ef','#dbd5f0','CeraVe, La Roche-Posay et SKIN1004 chez Cosmoplus'],
    ['LE RITUEL K-BEAUTY','Le soin','coréen','SKIN1004 · Beauty of Joseon · K-Secret','hero-kbeauty.webp',cmSearch('Centella'),'#e5ebe2','#e2eae0','SKIN1004 Centella, Beauty of Joseon et K-Secret Seoul 1988'],
    ['PROTECTION AU QUOTIDIEN','Le réflexe','solaire','Eucerin · La Roche-Posay · Nivea','hero-sun.webp',cmCollection('solaires'),'#fbe7d5','#fae6d4','Protections solaires Eucerin, La Roche-Posay Anthelios et Nivea Sun'],
    ['VOTRE SIGNATURE OLFACTIVE','L’art du','parfum','Armani · Dior · Narciso Rodriguez','hero-perfume.webp',cmCollection('parfums'),'#f9e8ec','#f6e2e9','Giorgio Armani My Way, Miss Dior et Narciso Rodriguez For Her']
  ];
  return `<main class="cm-home"><section class="cm-hero" aria-label="À la une chez Cosmoplus" aria-roledescription="carrousel">${slides.map(([eyebrow,title,big,subtitle,img,url,color,mobileColor,alt],i) => `<div class="hero-slide ${i ? 'cm-product-campaign' : 'active'}" data-slide="${i}" style="--hero-color:${color};--hero-mobile-color:${mobileColor}">${cmHeroImage(img,i,alt)}<div class="cm-hero-copy"><h${i ? '2' : '1'}>${eyebrow}</h${i ? '2' : '1'}><p>${title}<strong>${big}</strong></p><span>${subtitle}</span><a class="cm-button" href="${url}">DÉCOUVRIR</a><small>Vos produits de beauté disponibles en Algérie · Prix en DA</small></div></div>`).join('')}<button class="cm-hero-arrow cm-prev" data-direction="-1" aria-label="Bannière précédente">${svg('chevron')}</button><button class="cm-hero-arrow cm-next" data-direction="1" aria-label="Bannière suivante">${svg('chevron')}</button></section><div class="cm-hero-dots">${slides.map((_,i) => `<button class="${i ? '' : 'active'}" data-go="${i}" aria-label="Afficher la bannière ${i+1}"></button>`).join('')}<button class="cm-hero-pause" aria-label="Mettre le défilement en pause" aria-pressed="false">Ⅱ</button></div>
  <nav class="cm-category-rail cm-wrap" aria-label="Découvrir les catégories">${cmCategories.map(([id,label,img]) => `<a href="${cmCollection(id)}"><img src="${img ? `/assets/home/${img}` : cpSafe(cpImage(byId('wc-3247')))}" ${img ? '' : 'class="cm-perfume-category"'} alt="" loading="lazy"><span>${label}</span></a>`).join('')}</nav>
  <section class="cm-brand-section cm-wrap" id="marques"><h2>Votre boutique de cosmétiques et de beauté</h2><div class="cm-featured-brands">${brands.map(([label,q,img]) => `<article><a href="${cmSearch(q)}"><img src="/assets/home/${img}" alt="${label}" loading="lazy"></a><h3>${label}</h3><a class="cm-button" href="${cmSearch(q)}">DÉCOUVRIR</a></article>`).join('')}</div></section>
  ${cmEditorial([
    ['soins-visage','Les essentiels visage','Trouvez le soin qui convient à votre peau et construisez votre routine beauté.','editorial-face.jpg','Soins visage'],
    ['cheveux','Les essentiels cheveux','Découvrez notre sélection pour prendre soin de vos cheveux au quotidien.','editorial-hair.jpg','Cheveux'],
    ['corps','Les essentiels corps','Hydratez, protégez et prenez soin de votre peau, de la tête aux pieds.','editorial-body.jpg','Corps & hygiène']
  ])}
  ${cmProducts('Les tendances',trending,'cm-trending')}
  ${cmEditorial([
    ['soins-visage','Hydratation & soins visage','Découvrez les soins hydratants et les sérums de notre catalogue pour votre routine quotidienne.','routine-face.jpg','Soins visage'],
    ['cheveux','Soins des cheveux','Retrouvez les produits capillaires Cosmoplus et choisissez votre soin selon les besoins de vos cheveux.','routine-hair.jpg','Cheveux'],
    ['solaires','Protection solaire','Protégez votre peau tout au long de l’année avec notre sélection de protections solaires.','routine-sun.jpg','Protection solaire']
  ])}
  ${cmProducts('Les incontournables',essentials,'cm-essentials')}
  ${cmProducts('Notre sélection',all.slice(0,10),'cm-selection')}
  <section class="cm-logo-strip cm-wrap" aria-label="Nos marques">${[['Avène','avene'],['Bioderma','bioderma'],['CeraVe','cerave'],['La Roche-Posay','laroche']].map(([brand,img]) => `<a href="${cmSearch(brand)}"><img src="/assets/home/logo-${img}.jpg" alt="${brand}" loading="lazy"></a>`).join('')}</section>
  <section class="cm-service-strip"><div>${svg('pin')}<p><strong>Livraison en Algérie</strong><span>À domicile ou en bureau</span></p></div><div>${svg('bag')}<p><strong>Paiement à la livraison</strong><span>Prix en dinars algériens</span></p></div><div>${svg('user')}<p><strong>À votre écoute</strong><a href="tel:+213550281852">0550 28 18 52</a></p></div></section>
  </main><button class="cm-backtop" aria-label="Revenir en haut">⌃</button><a class="cm-contact-bubble" href="/contact/" aria-label="Contacter Cosmoplus"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-9l-6 4v-4H4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/></svg></a>`;
};
shellFooter = function() {
  return `<footer class="cm-footer"><div class="cm-wrap cm-footer-grid"><div class="cm-footer-brand"><a class="cm-logo" href="/">cosmoplus</a><span>Votre beauté, au quotidien.</span><div class="cm-brand-seal">COSMOPLUS<br><small>SOINS · BEAUTÉ · PARFUMS</small></div></div><div class="cm-footer-links"><h2>Liens utiles</h2><a href="/a-propos/">À propos de nous</a><a href="/aide/">Questions fréquentes</a><a href="/conditions-generales-vente/">Conditions générales de vente</a><a href="/livraison-retours/">Livraison & retours</a><a href="/confidentialite/">Confidentialité</a><a href="/mentions-legales/">Mentions légales</a></div><div class="cm-footer-contact"><h2>Une question ? Contactez-nous</h2><strong>E-mail</strong><a href="mailto:cosmoplus318@gmail.com">cosmoplus318@gmail.com</a><strong>Téléphone</strong><a href="tel:+213550281852">0550 28 18 52</a><h2>Restons en contact</h2><p>Besoin d’un conseil pour votre routine ou votre commande ?</p><a class="cm-contact-link" href="/contact/">Écrivez à Cosmoplus <span>→</span></a></div></div><div class="cm-wrap cm-footer-bottom"><span>© COSMOPLUS ${new Date().getFullYear()} · Tous droits réservés.</span><span>PAIEMENT À LA LIVRAISON &nbsp;|&nbsp; DA</span></div></footer>`;
};
function cmRefreshFavorites() {
  const favorites = cmFavorites();
  document.querySelectorAll('[data-favorite]').forEach(button => button.setAttribute('aria-pressed',String(favorites.includes(button.dataset.favorite))));
  document.querySelectorAll('.cm-favorite-count').forEach(node => {node.textContent=favorites.length;node.hidden=!favorites.length;});
  const list = document.querySelector('#cm-wishlist-items');
  if (list) list.innerHTML = favorites.length ? favorites.map(id => {const p=byId(id);return `<article><a href="${p.url}"><img src="${cpSafe(cpImage(p))}" alt=""><span>${cpSafe(p.name)}<strong>${money(p.price)}</strong></span></a><button class="icon-button" data-remove-favorite="${cpSafe(id)}" aria-label="Retirer ${cpSafe(p.name)} des favoris">${svg('close')}</button></article>`;}).join('') : '<p class="cm-no-favorites">Enregistrez vos produits préférés en touchant le cœur.</p>';
}
window.addEventListener('kb:render',() => {
  document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click',() => {const rail=document.getElementById(button.dataset.scroll);rail.scrollBy({left:Number(button.dataset.step)*rail.clientWidth,behavior:'smooth'});}));
  document.querySelector('[data-wishlist-toggle]')?.addEventListener('click',() => document.querySelector('#cm-wishlist').showModal());
  document.querySelector('[data-close-wishlist]')?.addEventListener('click',() => document.querySelector('#cm-wishlist').close());
  document.querySelector('.cm-backtop')?.addEventListener('click',() => window.scrollTo({top:0,behavior:'smooth'}));
  cmRefreshFavorites();
  document.querySelector('.cm-header')?.classList.toggle('cm-scrolled',window.scrollY > 180);
});
window.addEventListener('scroll',() => document.querySelector('.cm-header')?.classList.toggle('cm-scrolled',window.scrollY > 180),{passive:true});
document.addEventListener('click',event => {
  const button=event.target.closest('[data-favorite],[data-remove-favorite]');if(!button)return;
  const id=button.dataset.favorite || button.dataset.removeFavorite;
  const favorites=new Set(cmFavorites());if(favorites.has(id))favorites.delete(id);else favorites.add(id);
  localStorage.setItem('cosmoplus-favorites-v1',JSON.stringify([...favorites]));cmRefreshFavorites();
});
setupHero = function() {
  clearInterval(window.cmHeroTimer);
  const hero=document.querySelector('.cm-hero'),slides=[...document.querySelectorAll('.cm-hero .hero-slide')],dots=[...document.querySelectorAll('.cm-hero-dots [data-go]')];if(!hero||!slides.length)return;
  let current=0,paused=false,hovered=false,start=null;
  const show=index=>{current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.classList.toggle('active',i===current);slide.setAttribute('aria-hidden',String(i!==current));slide.inert=i!==current;});dots.forEach((dot,i)=>{dot.classList.toggle('active',i===current);dot.setAttribute('aria-current',String(i===current));});};
  document.querySelectorAll('.cm-hero [data-direction]').forEach(button=>button.addEventListener('click',()=>show(current+Number(button.dataset.direction))));
  dots.forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.go))));
  hero.addEventListener('pointerenter',()=>{hovered=true;});hero.addEventListener('pointerleave',()=>{hovered=false;});
  hero.addEventListener('touchstart',event=>{const p=event.changedTouches[0];start={x:p.clientX,y:p.clientY};},{passive:true});
  hero.addEventListener('touchend',event=>{if(!start)return;const p=event.changedTouches[0],dx=p.clientX-start.x,dy=p.clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))show(current+(dx<0?1:-1));start=null;},{passive:true});
  const pauseButton=document.querySelector('.cm-hero-pause');pauseButton?.addEventListener('click',()=>{paused=!paused;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.setAttribute('aria-label',paused?'Reprendre le défilement':'Mettre le défilement en pause');pauseButton.textContent=paused?'▶':'Ⅱ';});
  show(0);
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)window.cmHeroTimer=setInterval(()=>{if(!paused&&!hovered&&!document.hidden&&!hero.contains(document.activeElement))show(current+1);},6500);
};
