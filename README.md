# Cosmoplus

Boutique de cosmétiques Cosmoplus, avec 129 produits publiés et 2 brouillons conservés depuis WooCommerce. Le thème actuel reprend la présentation de Cosmetis sur l’accueil, le catalogue, les fiches produit, le panier, la commande et les pages d’information. Le catalogue, les prix en DA, les photos produit et les données Firebase restent ceux de Cosmoplus.

Le carrousel de l’accueil contient quatre campagnes (beauté, K-beauty, solaire et parfums), chacune avec une image dédiée à l’ordinateur et une autre au téléphone. Les huit images se trouvent dans `assets/home/`. Les prompts de création sont conservés dans `assets/home/hero-prompts.json` et `assets/home/mobile-hero-prompt.txt`.

## Accès

- Boutique : `/`
- Catalogue : `/robes-de-soiree/` (route historique, contenu cosmétique)
- Panier : `/panier/`
- Commande : `/commande/`
- Administration : `/admin/`

Le projet Firebase `cosmoplus-8797a` gère l’authentification et Firestore. Le catalogue initial est conservé dans `cosmoplus-catalog.js`. Les modifications faites dans l’administration sont enregistrées dans la collection `products` et appliquées au catalogue initial. Les commandes sont enregistrées dans `orders` lors du paiement à la livraison. L’accès de l’équipe est contrôlé par `staff` et `firestore.rules`. Le formulaire client utilise une connexion Firebase anonyme et ne demande ni compte ni vérification par e-mail.

Les frais de livraison affichés proviennent de `shipping-data.js`. Aucune intégration avec un transporteur n’est active. Les pages légales contiennent encore des informations d’exploitant à compléter avant l’ouverture commerciale.

## Mise à jour du catalogue

`woocommerce-products.json` contient les 129 produits publiés et `woocommerce-drafts.json` les 2 brouillons sans prix ni photo ; ceux-ci restent masqués dans la boutique. `node scripts/build-catalog.cjs` régénère `cosmoplus-catalog.js` à partir de ces fichiers. Ne lancez pas cette commande après des modifications de produits dans Firestore sans prévoir leur fusion ; les modifications en ligne restent indépendantes du fichier source.

## Développement

`node scripts/serve.cjs` sert le site en local. Le site statique se publie avec GitHub Pages à partir de la branche `main`, dossier racine, sur `cosmoplus.store`.

`home-cosmetis.js` et `home-cosmetis.css` définissent l’accueil, l’en-tête, le pied de page et les cartes produit partagés. `cosmetis-pages.js` et `cosmetis-pages.css` définissent les pages du catalogue et du parcours d’achat. `admin/cosmetis-admin.css` adapte l’apparence de l’administration.

Après création ou adaptation d’une page HTML, exécuter `node scripts/apply-cosmetis-theme.cjs` pour y installer les ressources du thème. Vérifications : `node scripts/check-home.cjs`, `node scripts/check-local-links.cjs` et `git diff --check`.
