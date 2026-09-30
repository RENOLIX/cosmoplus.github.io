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
    for (const doc of docs.docs) {
      const data = doc.data();
      const item = PRODUCTS.find(p => p.id === doc.id);
      const normalized = {
        ...item, ...data, id:doc.id,
        images:Array.isArray(data.images) && data.images.length ? data.images : [data.cover || item?.cover].filter(Boolean),
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
