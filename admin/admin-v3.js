const SITE_BASE = location.hostname === 'renolix.github.io' ? '/cosmoplus.github.io' : '';
const root = document.querySelector('#admin-root');
const $ = selector => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => `${new Intl.NumberFormat('fr-DZ').format(Number(value) || 0)} DA`;
const CATEGORIES = [['soins-visage','Soins visage'],['solaires','Protection solaire'],['corps','Corps & hygiène'],['cheveux','Cheveux'],['maquillage','Maquillage'],['parfums','Parfums']];
const base = window.COSMOPLUS_CATALOG || [];
const STATUS = {nouvelle:'Nouvelle',injoignable:'Injoignable',expediee:'Expédiée',livree:'Livrée',annulee:'Annulée'};
let currentUser = null, role = null, tab = 'dashboard', products = [], orders = [], staff = [];
let editor = null, editorPhotos = [], orderId = null, unsubscribe = null, shippingRates = {};
const imageCache = new Map();
const imageId = ref => typeof ref === 'string' && ref.startsWith('cpimg:') ? ref.slice(6) : null;
const photoUrl = ref => imageId(ref) ? (imageCache.get(imageId(ref)) || '') : (window.COSMOPLUS_MEDIA_MAP?.[ref] || ref || '');
const categoryName = id => CATEGORIES.find(item => item[0] === id)?.[1] || 'Beauté';
const initialProduct = p => ({...p, cover:p.cover || p.images?.[0] || '', images:p.images || [p.cover].filter(Boolean)});

function notify(message, bad = false) {
  const node = $('#admin-feedback');
  if (!node) return;
  node.textContent = message; node.hidden = false; node.className = `feedback${bad ? ' error' : ''}`;
  node.scrollIntoView({block:'nearest'});
}
function brand() { return `<a class="admin-brand" href="${SITE_BASE}/"><span><strong>COSMOPLUS</strong><em>BEAUTÉ</em></span></a>`; }
function login(message = '') {
  root.innerHTML = `<div class="login-wrap"><div class="login-card">${brand()}<span class="eyebrow">ESPACE PRIVÉ</span><h1>Administration</h1><p>Connectez-vous avec votre compte de la boutique.</p><form id="login-form"><label class="field">E-mail<input type="email" name="email" autocomplete="username" required></label><label class="field">Mot de passe<input type="password" name="password" autocomplete="current-password" required></label><button class="primary" type="submit">SE CONNECTER</button></form><div id="admin-feedback" class="feedback error" ${message ? '' : 'hidden'}>${esc(message)}</div><p><a href="${SITE_BASE}/">← Retour à la boutique</a></p></div></div>`;
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget, button = form.querySelector('button'); button.disabled = true;
    try { await KB.auth.signInWithEmailAndPassword(form.elements.email.value.trim(), form.elements.password.value); }
    catch { notify('Connexion impossible : vérifiez votre e-mail et votre mot de passe.', true); button.disabled = false; }
  });
}
function frame(content) {
  const tabs = [['dashboard','Vue d’ensemble'],['orders','Commandes'],['products','Produits'],['shipping','Livraison'],['staff','Équipe']].filter(([id]) => role === 'admin' || !['shipping','staff'].includes(id));
  root.innerHTML = `<div class="admin-layout"><aside class="admin-sidebar">${brand()}<span class="sidebar-caption">GESTION DE LA BOUTIQUE</span><nav class="admin-nav">${tabs.map(([id,label]) => `<button data-tab="${id}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}</nav><div class="sidebar-foot"><a href="${SITE_BASE}/">Voir la boutique ↗</a><button id="logout" class="ghost">Déconnexion</button></div></aside><div class="admin-main"><header class="admin-top"><span>COSMOPLUS · ADMINISTRATION</span><span>${esc(currentUser.email)}</span></header><main id="admin-content">${content}</main></div></div>`;
  root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { cleanupPhotos(); tab = button.dataset.tab; editor = null; orderId = null; render(); }));
  $('#logout').addEventListener('click', () => KB.auth.signOut());
  bind();
}
function heading(kicker, title, side = '') { return `<div class="admin-title"><div><small>${kicker}</small><h1>${title}</h1></div>${side}</div><div id="admin-feedback" class="feedback" hidden></div>`; }
function productRow(p) {
  const image = photoUrl(p.cover || p.images?.[0]);
  const canPublish = Number(p.price) > 0 && !!image;
  return `<article class="data-row product-row"><div class="product-thumb">${image ? `<img src="${esc(image)}" alt="">` : '<span>Sans photo</span>'}</div><div class="grow"><h3>${esc(p.name)}</h3><p>${esc(categoryName(p.category))} · ${money(p.price)}</p><span class="status ${p.active === false ? 'annulee' : 'livree'}">${p.active === false ? 'Masqué' : 'En ligne'}</span></div>${role === 'admin' ? `<div class="actions"><button class="ghost" data-edit="${esc(p.id)}">Modifier</button>${p.active !== false || canPublish ? `<button class="danger" data-hide="${esc(p.id)}">${p.active === false ? 'Réactiver' : 'Masquer'}</button>` : ''}</div>` : ''}</article>`;
}
function orderRow(o) { return `<article class="data-row"><div class="grow"><h3>${esc(o.customer?.name || 'Client')}</h3><p>${esc(o.customer?.phone || '')} · ${esc(o.delivery?.wilaya || '')} · ${money(o.total)}</p></div><span class="status ${esc(o.status)}">${esc(STATUS[o.status] || o.status)}</span><button class="ghost" data-order="${esc(o.id)}">Ouvrir</button></article>`; }
function dashboard() {
  const active = products.filter(p => p.active !== false), newOrders = orders.filter(o => o.status === 'nouvelle');
  return `${heading('COSMOPLUS','Vue d’ensemble')}<div class="panel-grid"><div class="metric"><span>Produits en ligne</span><strong>${active.length}</strong></div><div class="metric"><span>Nouvelles commandes</span><strong>${newOrders.length}</strong></div><div class="metric"><span>Commandes totales</span><strong>${orders.length}</strong></div></div><section class="card dashboard-orders"><h2>Dernières commandes</h2>${orders.slice(0,5).map(orderRow).join('') || '<p>Aucune commande.</p>'}</section>`;
}
function productsView() {
  if (editor) return productForm();
  return `${heading('CATALOGUE','Produits',role === 'admin' ? '<button class="primary" id="new-product">+ AJOUTER UN PRODUIT</button>' : '')}<div class="toolbar"><input id="product-search" type="search" placeholder="Rechercher un produit…" aria-label="Rechercher un produit"></div><div class="data-list" id="product-list">${products.map(productRow).join('')}</div>`;
}
function photoTiles() {
  return editorPhotos.map((photo, index) => `<div class="photo-tile"><img src="${esc(photo.preview)}" alt="Photo ${index + 1}"><button type="button" data-remove-photo="${index}" aria-label="Supprimer la photo ${index + 1}">×</button>${index === 0 ? '<span>Principale</span>' : ''}</div>`).join('');
}
function productForm() {
  const p = editor === 'new' ? {} : products.find(item => item.id === editor) || {};
  return `${heading('CATALOGUE',editor === 'new' ? 'Ajouter un produit' : 'Modifier le produit','<button class="ghost" id="cancel-edit-top">← Retour aux produits</button>')}<form id="product-form" class="card form-grid"><label class="field">Nom du produit *<input name="name" required value="${esc(p.name)}"></label><label class="field">Prix en DA *<input type="number" name="price" required min="0" step="1" value="${esc(p.price)}"></label><label class="field">Catégorie<select name="category">${CATEGORIES.map(([id,label]) => `<option value="${id}" ${p.category === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="field">Stock (laisser vide si inconnu)<input type="number" name="stock" min="0" step="1" value="${p.stock == null ? '' : esc(p.stock)}"></label><label class="field full">Description<textarea name="description" rows="4">${esc(p.description)}</textarea></label><section class="field full photo-section"><span>Photos du produit *</span><p class="note">Choisissez des photos depuis votre téléphone ou votre ordinateur. La première photo est affichée en couverture.</p><div id="photo-list" class="photo-grid">${photoTiles()}</div><label class="upload-button">+ TÉLÉVERSER DES PHOTOS<input id="photo-upload" type="file" accept="image/*" multiple></label></section><label class="field">Visibilité<select name="active"><option value="true" ${p.active !== false ? 'selected' : ''}>En ligne</option><option value="false" ${p.active === false ? 'selected' : ''}>Masqué</option></select></label><div class="form-actions"><button class="primary" type="submit">ENREGISTRER</button><button class="ghost" type="button" id="cancel-edit">Annuler</button></div></form>`;
}
function ordersView() { return orderId ? orderDetail() : `${heading('SUIVI DES ACHATS','Commandes')}<div class="data-list">${orders.map(orderRow).join('') || '<div class="empty">Aucune commande.</div>'}</div>`; }
function orderDetail() {
  const o = orders.find(item => item.id === orderId); if (!o) return ordersView();
  return `${heading('COMMANDE',`#${esc(o.id.slice(0,8))}`,'<button class="ghost" id="back-orders">← Toutes les commandes</button>')}<div class="card order-detail-page"><h2>${esc(o.customer?.name || 'Client')}</h2><p>${esc(o.customer?.phone || '')}</p><p>${esc(o.delivery?.wilaya || '')} · ${esc(o.delivery?.commune || '')} · ${o.delivery?.method === 'bureau' ? 'Bureau' : 'À domicile'}</p><p>${esc(o.delivery?.address || o.delivery?.office || '')}</p><div class="data-list">${(o.items || []).map(i => `<div class="data-row"><img src="${esc(photoUrl(i.image))}" alt=""><div class="grow"><h3>${esc(i.name)}</h3><p>Quantité : ${Number(i.quantity)}</p></div><strong>${money(i.unitPrice * i.quantity)}</strong></div>`).join('')}</div><p>Sous-total : ${money(o.subtotal)} · Livraison : ${money(o.shippingFee)} · <strong>Total : ${money(o.total)}</strong></p><label class="field">Statut<select id="order-status">${Object.entries(STATUS).map(([id,label]) => `<option value="${id}" ${o.status === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${o.notes ? `<p>Note : ${esc(o.notes)}</p>` : ''}</div>`;
}
function shippingView() {
  return `${heading('LIVRAISON EN ALGÉRIE','Tarifs par wilaya')}<form id="shipping-form"><div class="card shipping-intro"><h2>Frais de livraison</h2><p>Modifiez les tarifs en DA. Un tarif bureau à 0 rend le retrait en bureau indisponible pour cette wilaya.</p><button class="primary" type="submit">ENREGISTRER LES TARIFS</button></div><div class="shipping-table"><div class="shipping-table-head"><strong>Wilaya</strong><strong>À domicile</strong><strong>Stop desk / bureau</strong></div>${SHIPPING_WILAYAS.map((w,index) => { const code = String(index + 1).padStart(2,'0'), rate = shippingRates[code] || w; return `<div class="shipping-rate"><label><b>${code}</b> ${esc(w.name)}</label><div><input type="number" name="home-${code}" aria-label="Livraison à domicile ${esc(w.name)}" min="1" step="1" required value="${esc(rate.home)}"><span>DA</span></div><div><input type="number" name="desk-${code}" aria-label="Stop desk ${esc(w.name)}" min="0" step="1" required value="${esc(rate.desk)}"><span>DA</span></div></div>`; }).join('')}</div><div class="shipping-save"><button class="primary" type="submit">ENREGISTRER LES TARIFS</button></div></form>`;
}
function staffView() {
  return `${heading('MON ESPACE','Équipe')}<section class="card"><h2>Créer un accès</h2><p>Connexion e-mail et mot de passe sans validation par e-mail.</p><form id="staff-form" class="form-grid"><label class="field">E-mail *<input name="email" type="email" required></label><label class="field">Mot de passe initial *<input name="password" type="password" minlength="12" required></label><label class="field">Rôle<select name="role"><option value="employee">Employé</option><option value="admin">Administrateur</option></select></label><button class="primary" type="submit">CRÉER LE COMPTE</button></form></section><section class="card staff-list"><h2>Accès existants</h2>${staff.map(s => `<div class="data-row"><div class="grow"><h3>${esc(s.email)}</h3><p>${s.role === 'admin' ? 'Administrateur' : 'Employé'}</p></div>${s.id !== currentUser.uid ? `<button class="danger" data-revoke="${esc(s.id)}">Retirer l’accès</button>` : ''}</div>`).join('')}</section>`;
}
function render() {
  if (!currentUser) return login();
  frame(tab === 'products' ? productsView() : tab === 'orders' ? ordersView() : tab === 'shipping' && role === 'admin' ? shippingView() : tab === 'staff' && role === 'admin' ? staffView() : dashboard());
}
function cleanupPhotos() { for (const photo of editorPhotos) if (photo.temporary) URL.revokeObjectURL(photo.preview); editorPhotos = []; }
function startEdit(id) {
  cleanupPhotos(); editor = id;
  const p = id === 'new' ? null : products.find(item => item.id === id);
  editorPhotos = (p?.images || [p?.cover].filter(Boolean)).map(ref => ({ref,preview:photoUrl(ref)}));
  render();
}
function refreshPhotos() { const node = $('#photo-list'); if (node) node.innerHTML = photoTiles(); }
function bind() {
  root.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => startEdit(button.dataset.edit)));
  root.querySelectorAll('[data-hide]').forEach(button => button.addEventListener('click', async () => { const p = products.find(item => item.id === button.dataset.hide); try { await KB.db.collection('products').doc(p.id).set({active:p.active === false,updatedAt:KB.serverTime()},{merge:true}); await loadProducts(); } catch(error) { notify(error.message,true); } }));
  $('#new-product')?.addEventListener('click', () => startEdit('new'));
  for (const id of ['#cancel-edit','#cancel-edit-top']) $(id)?.addEventListener('click', () => { cleanupPhotos(); editor = null; render(); });
  $('#product-search')?.addEventListener('input', event => { const q = event.target.value.toLocaleLowerCase('fr'); $('#product-list').innerHTML = products.filter(p => p.name.toLocaleLowerCase('fr').includes(q)).map(productRow).join(''); bindProductRows(); });
  $('#photo-upload')?.addEventListener('change', event => { for (const file of event.target.files) { if (!file.type.startsWith('image/')) { notify('Choisissez uniquement des images.',true); continue; } editorPhotos.push({file,preview:URL.createObjectURL(file),temporary:true}); } event.target.value = ''; refreshPhotos(); });
  $('#photo-list')?.addEventListener('click', event => { const button = event.target.closest('[data-remove-photo]'); if (!button) return; const [photo] = editorPhotos.splice(Number(button.dataset.removePhoto),1); if (photo?.temporary) URL.revokeObjectURL(photo.preview); refreshPhotos(); });
  $('#product-form')?.addEventListener('submit', saveProduct);
  root.querySelectorAll('[data-order]').forEach(button => button.addEventListener('click', () => { orderId = button.dataset.order; render(); }));
  $('#back-orders')?.addEventListener('click', () => { orderId = null; render(); });
  $('#order-status')?.addEventListener('change', async event => { try { await KB.db.collection('orders').doc(orderId).update({status:event.target.value,updatedAt:KB.serverTime()}); notify('Statut enregistré.'); } catch(error) { notify(error.message,true); } });
  $('#shipping-form')?.addEventListener('submit', saveShipping);
  $('#staff-form')?.addEventListener('submit', createStaff);
  root.querySelectorAll('[data-revoke]').forEach(button => button.addEventListener('click', async () => { if (!confirm('Retirer cet accès ?')) return; try { await KB.db.collection('staff').doc(button.dataset.revoke).delete(); await loadStaff(); } catch(error) { notify(error.message,true); } }));
}
function bindProductRows() { root.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => startEdit(button.dataset.edit))); root.querySelectorAll('[data-hide]').forEach(button => button.addEventListener('click', async () => { const p = products.find(item => item.id === button.dataset.hide); try { await KB.db.collection('products').doc(p.id).set({active:p.active === false,updatedAt:KB.serverTime()},{merge:true}); await loadProducts(); } catch(error) { notify(error.message,true); } })); }

async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file);
  try {
    for (const edge of [1400,1100,850,650]) {
      const scale = Math.min(1, edge / Math.max(bitmap.width,bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      for (const quality of [.82,.68,.52]) {
        const data = canvas.toDataURL('image/webp',quality);
        if (data.startsWith('data:image/webp;') && data.length < 750000) return data;
        const jpeg = canvas.toDataURL('image/jpeg',quality);
        if (jpeg.length < 750000) return jpeg;
      }
    }
    throw Error('Cette image est trop grande. Choisissez une photo moins lourde.');
  } finally { bitmap.close(); }
}
async function saveProduct(event) {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type="submit"]'); button.disabled = true;
  const created = [];
  try {
    const id = editor === 'new' ? KB.db.collection('products').doc().id : editor, old = products.find(p => p.id === id), v = form.elements;
    const refs = [];
    if (!editorPhotos.length && v.active.value === 'true') throw Error('Ajoutez au moins une photo avant de publier le produit.');
    for (const photo of editorPhotos) {
      if (photo.ref) { refs.push(photo.ref); continue; }
      const data = await compressPhoto(photo.file), doc = KB.db.collection('productImages').doc();
      await doc.set({productId:id,data,contentType:data.slice(5,data.indexOf(';')),createdAt:KB.serverTime()});
      created.push(doc.id); refs.push(`cpimg:${doc.id}`);
    }
    const price = Number(v.price.value);
    if (!Number.isInteger(price) || price < 0 || v.active.value === 'true' && price === 0) throw Error('Saisissez un prix supérieur à 0 DA avant publication.');
    const data = {name:v.name.value.trim(),short:v.name.value.trim(),price,category:v.category.value,stock:v.stock.value === '' ? null : Number(v.stock.value),description:v.description.value.trim(),cover:refs[0] || '',images:refs,active:v.active.value === 'true',url:old?.url || `/produit/?id=${encodeURIComponent(id)}`,updatedAt:KB.serverTime()};
    await KB.db.collection('products').doc(id).set(data,{merge:true});
    const removed = (old?.images || []).filter(ref => imageId(ref) && !refs.includes(ref));
    await Promise.all(removed.map(ref => KB.db.collection('productImages').doc(imageId(ref)).delete().catch(console.warn)));
    cleanupPhotos(); editor = null; await loadProducts(); notify('Produit enregistré.');
  } catch(error) {
    await Promise.all(created.map(id => KB.db.collection('productImages').doc(id).delete().catch(console.warn)));
    notify(error.message,true); button.disabled = false;
  }
}
async function saveShipping(event) {
  event.preventDefault(); const form = event.currentTarget, buttons = form.querySelectorAll('[type="submit"]'); buttons.forEach(b => b.disabled = true);
  try {
    const rates = {};
    SHIPPING_WILAYAS.forEach((w,index) => { const code = String(index + 1).padStart(2,'0'), home = Number(form.elements[`home-${code}`].value), desk = Number(form.elements[`desk-${code}`].value); if (!Number.isInteger(home) || home < 1 || !Number.isInteger(desk) || desk < 0) throw Error(`Tarif invalide pour ${w.name}.`); rates[code] = {home,desk}; });
    await KB.db.collection('settings').doc('shipping').set({rates,updatedAt:KB.serverTime()});
    shippingRates = rates; notify('Les tarifs de livraison sont enregistrés et appliqués au checkout.');
  } catch(error) { notify(error.message,true); }
  finally { buttons.forEach(b => b.disabled = false); }
}
async function createStaff(event) {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type="submit"]'); button.disabled = true; let secondary;
  try { const v = form.elements; secondary = firebase.initializeApp(KB_FIREBASE_CONFIG,`staff-create-${Date.now()}`); const result = await secondary.auth().createUserWithEmailAndPassword(v.email.value.trim(),v.password.value); await KB.db.collection('staff').doc(result.user.uid).set({email:v.email.value.trim(),role:v.role.value,createdAt:KB.serverTime()}); await secondary.auth().signOut(); await secondary.delete(); secondary = null; form.reset(); await loadStaff(); notify('Compte créé, sans validation par e-mail.'); }
  catch(error) { notify(error.message,true); button.disabled = false; if (secondary) { await secondary.auth().signOut().catch(()=>{}); await secondary.delete().catch(()=>{}); } }
}
async function loadProducts() {
  const docs = await KB.db.collection('products').get(), edits = new Map(docs.docs.map(doc => [doc.id,doc.data()]));
  products = base.map(initialProduct).map(p => ({...p,...edits.get(p.id),images:Array.isArray(edits.get(p.id)?.images) ? edits.get(p.id).images : p.images}));
  for (const doc of docs.docs) if (!products.some(p => p.id === doc.id)) products.push({id:doc.id,...doc.data()});
  const ids = new Set(products.flatMap(p => [p.cover,...(p.images || [])].map(imageId).filter(Boolean)));
  await Promise.all([...ids].filter(id => !imageCache.has(id)).map(async id => { const doc = await KB.db.collection('productImages').doc(id).get(); if (doc.exists) imageCache.set(id,doc.data().data); }));
  products.sort((a,b) => a.name.localeCompare(b.name,'fr')); render();
}
async function loadShipping() { const doc = await KB.db.collection('settings').doc('shipping').get(); shippingRates = doc.exists ? (doc.data().rates || {}) : {}; if (tab === 'shipping') render(); }
async function loadStaff() { if (role !== 'admin') return; const docs = await KB.db.collection('staff').get(); staff = docs.docs.map(doc => ({id:doc.id,...doc.data()})); render(); }
function loadOrders() { unsubscribe?.(); unsubscribe = KB.db.collection('orders').orderBy('createdAt','desc').limit(200).onSnapshot(snapshot => { orders = snapshot.docs.map(doc => ({id:doc.id,...doc.data()})); render(); },error => notify(`Commandes indisponibles : ${error.message}`,true)); }
KB.auth.onAuthStateChanged(async user => {
  unsubscribe?.(); if (!user || user.isAnonymous) { currentUser = null; role = null; login(); return; }
  root.innerHTML = '<div class="boot">Vérification de votre accès…</div>';
  try {
    const doc = await KB.db.collection('staff').doc(user.uid).get();
    if (!doc.exists || !['admin','employee'].includes(doc.data().role)) { await KB.auth.signOut(); login('Ce compte n’a pas encore accès à l’administration.'); return; }
    currentUser = user; role = doc.data().role; await loadProducts();
    if (role === 'admin') await Promise.all([loadStaff(),loadShipping()]);
    loadOrders();
  } catch(error) { root.innerHTML = `<div class="login-wrap"><div class="login-card">${brand()}<h1>Accès indisponible</h1><p>${esc(error.message)}</p></div></div>`; }
});
