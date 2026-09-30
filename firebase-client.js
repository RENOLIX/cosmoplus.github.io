// Firebase web configuration is public; Firestore rules control access.
window.KB_CATALOG_READY = true;
const KB_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAcseMpduy8ol-2hCsfN-y4u18Li98P_Rc',
  authDomain: 'cosmoplus-8797a.firebaseapp.com',
  projectId: 'cosmoplus-8797a',
  storageBucket: 'cosmoplus-8797a.firebasestorage.app',
  messagingSenderId: '679876791862',
  appId: '1:679876791862:web:986d4da1bbc245924f9297'
};
firebase.initializeApp(KB_FIREBASE_CONFIG);
const KB_DB = firebase.firestore();
const KB_AUTH = firebase.auth();
window.KB_FIREBASE_CONFIG = KB_FIREBASE_CONFIG;
window.KB = {db:KB_DB, auth:KB_AUTH, serverTime:() => firebase.firestore.FieldValue.serverTimestamp()};

// The published WooCommerce export is the initial catalogue. Firestore stores admin edits.
async function loadCosmoplusCatalog() {
  if (typeof PRODUCTS === 'undefined') return;
  PRODUCTS.splice(0, PRODUCTS.length, ...(window.COSMOPLUS_CATALOG || []).map(p => ({...p})));
  render();
  try {
    const docs = await KB_DB.collection('products').get();
    const imageIds = new Set();
    for (const doc of docs.docs) {
      const data = doc.data();
      for (const ref of [data.cover,...(data.images || [])]) if (typeof ref === 'string' && ref.startsWith('cpimg:')) imageIds.add(ref.slice(6));
    }
    const imageUrls = new Map();
    await Promise.all([...imageIds].map(async id => {
      const imageDoc = await KB_DB.collection('productImages').doc(id).get();
      if (imageDoc.exists) imageUrls.set(`cpimg:${id}`,imageDoc.data().data);
    }));
    for (const doc of docs.docs) {
      const data = doc.data();
      const item = PRODUCTS.find(p => p.id === doc.id);
      const normalized = {
        ...item, ...data, id:doc.id,
        images:(Array.isArray(data.images) ? data.images : [data.cover || item?.cover].filter(Boolean)).map(ref => imageUrls.get(ref) || ref),
        cover:imageUrls.get(data.cover) || data.cover || '',
        imageRef:data.cover || '',
        url:data.url || item?.url || `/produit/?id=${encodeURIComponent(doc.id)}`,
        sizes:['TU'], color:'', swatch:'#eee8e4'
      };
      normalized._source = {name:normalized.name,short:normalized.short || normalized.name,description:normalized.description || '',details:normalized.details || '',color:''};
      if (item) Object.assign(item, normalized); else PRODUCTS.push(normalized);
    }
    render();
  } catch (error) {
    console.warn('Catalogue Firebase indisponible ; export WooCommerce affiché.', error);
  }
}
document.addEventListener('DOMContentLoaded', loadCosmoplusCatalog);

async function loadShippingRates() {
  if (typeof SHIPPING_WILAYAS === 'undefined') return;
  try {
    const doc = await KB_DB.collection('settings').doc('shipping').get();
    if (!doc.exists) return;
    const rates = doc.data().rates || {};
    SHIPPING_WILAYAS.forEach((wilaya,index) => {
      const rate = rates[String(index + 1).padStart(2,'0')];
      if (!rate) return;
      if (Number.isInteger(rate.home) && rate.home > 0) wilaya.home = rate.home;
      if (Number.isInteger(rate.desk) && rate.desk >= 0) wilaya.desk = rate.desk;
    });
    render();
  } catch(error) { console.warn('Tarifs de livraison Firebase indisponibles.',error); }
}
document.addEventListener('DOMContentLoaded',loadShippingRates);
