# Cosmoplus

Boutique de cosmétiques adaptée du site Khadidja, avec 129 produits publiés et 2 brouillons conservés depuis WooCommerce. Le code conserve la structure visuelle de la boutique de référence et affiche les produits, prix en DA et photos de fiches issus de Cosmoplus. Les 12 images de cartes et les bannières sont des créations éditoriales distinctes ; elles ne remplacent pas les photos des fiches produit.

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

`node scripts/serve.cjs` sert le site en local. Le site statique se publie avec GitHub Pages à partir de la branche `main`, dossier racine. `node scripts/adapt-pages.cjs` insère les ressources Cosmoplus dans les pages copiées de Khadidja.
