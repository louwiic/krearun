# Commandes manuelles et migration CRM STD

Le backoffice `/admin/commandes` réunit les commandes boutique et manuelles :
recherche, filtres production/paiement/origine/date/mois, urgences, sélection et statut
en lot, saisie/modification manuelle, acomptes, reste à payer, notes privées,
liens, échéance, export CSV et import CRM avec aperçu.

Les filtres de production et de paiement acceptent plusieurs statuts cochés :
« À faire » ou « Prêt », par exemple, combinés avec « Non payé » ou « Acompte ».
Aucun choix signifie tous les statuts du groupe. La période s'applique à la date
d'origine de la commande : mois complet, intervalle inclusif, ou raccourcis
« Aujourd'hui » et « Ce mois-ci », à l'heure de La Réunion.
La liste est paginée par 10, 25, 50 ou 100 commandes. Les compteurs et l'export
portent sur tous les résultats filtrés, pas uniquement la page affichée.
La case d'en-tête sélectionne la page courante ; les sélections sont conservées
en changeant de page et effacées en changeant de filtre.

Le tableau utilise TanStack Table pour les tris ASC/DESC (texte français,
montants numériques et dates), appliqués avant la pagination. Maj + clic ajoute
un second critère. Le menu « Colonnes » affiche les coordonnées, échéances et
autres champs supplémentaires. La sélection reste attachée aux identifiants des
commandes, y compris après un changement de tri. L'export suit le tri courant.
DaisyUI est limité aux composants tableau et fenêtre modale, avec le préfixe
`crm-` et sans thèmes globaux afin de préserver la boutique.

« Voir tous les détails » ouvre une fiche en lecture seule : chaque article avec
ses coloris, variante, prénom, porte-clés, quantité et prix, les coordonnées,
notes client et internes, montants, dates et références. Les options produit
sont aussi visibles dans la liste et incluses dans la recherche et l'export CSV.
Ces améliorations d'affichage n'écrivent aucune donnée en base.

« Générer planche adresses · Prêt » produit un PDF local dans le navigateur
(pdf-lib chargé à la demande) à partir de toutes les commandes `ready`, toutes
pages/dates/origines et tous paiements confondus, sans appliquer les filtres ni
la sélection du tableau. Un bloc par commande, sans fusionner les clients.
La planche A4 portrait contient 8 cadres pointillés de 92,5 × 60 mm ; imprimer
à 100 % / taille réelle. Chaque étiquette contient uniquement le nom complet et
l'adresse de livraison, sans numéro de commande, produits, montants, téléphone ni notes.
Les noms/adresses incomplets, trop longs ou contenant des caractères non pris en
charge sont exclus et signalés avec un lien de correction ; rien n'est deviné
depuis la description ou les notes et aucun texte n'est tronqué. L'aperçu permet
d'ouvrir/imprimer ou de télécharger le PDF. Les URL temporaires sont libérées à
la fermeture. Aucun PDF client n'est stocké sur le serveur, aucune donnée/statut
n'est modifié et aucun message n'est envoyé. Il ne s'agit pas d'un affranchissement.

Production : À faire → En cours → Prêt → Expédiée → Terminée/livrée ; Annulée.
« À vérifier » isole les dossiers anciens dont l'avancement ne peut être déduit.
Le paiement est indépendant (non payé, acompte, payé, remboursé). Le statut
historique boutique `paid` reste compatible et apparaît « À faire » côté gestion.
Les montants boutique ne sont pas modifiables dans le formulaire manuel.
Les modifications rapides, saisies et imports n'envoient aucun e-mail et ne
touchent ni Stripe, ni les comptes clients, ni le stock. La fiche détail permet
de demander explicitement la notification d'expédition/livraison.

## Migration du schéma

Node 22, dans le projet avec les variables PocketBase de `.env` :

```sh
node --env-file=.env scripts/setup-order-management.mjs
node --env-file=.env scripts/setup-order-management.mjs --apply --backup-dir /chemin/prive/sauvegardes
```

Simulation par défaut. Le mode appliqué sauvegarde d'abord le schéma et toutes
les commandes (fichiers 0600), ajoute les champs sans supprimer les anciens et
contrôle que chaque valeur préexistante et chaque règle d'accès est inchangée.

## Import des données

Utiliser de préférence le bouton « Export complet Krearun » de CRM STD : il
exporte toutes les commandes du compte connecté, sans les filtres de l'écran,
avec leurs identifiants et leurs dates originales. Le backoffice accepte ce
JSON directement, avec un aperçu avant confirmation (5 Mo / 2 000 commandes).

Autre possibilité : le CSV complet exporté par un utilisateur connecté à CRM STD
(toutes périodes, tous statuts, toutes lignes sélectionnées), soit un JSON issu
de Firestore contenant un tableau `orders` avec l'ID original de chaque document.
Ne pas déposer les exports de clients dans Git ni dans `public/`.

```sh
node --env-file=.env --experimental-strip-types scripts/import-crm-orders.mjs --file /chemin/prive/export.json
node --env-file=.env --experimental-strip-types scripts/import-crm-orders.mjs --file /chemin/prive/export.json --apply --backup-dir /chemin/prive/sauvegardes
```

Le premier passage affiche seulement les compteurs, totaux et avertissements.
Le second sauvegarde la source et la destination avant d'importer. La source
Firebase n'est jamais modifiée. Chaque ligne conserve son objet original dans
`legacyData`, accessible seulement au superuser PocketBase, non envoyé au navigateur.
Commentaires/relances vont dans `internalNote`, jamais dans la note client.
Les quantités textuelles sont conservées sans inventer de références catalogue.
Les anciennes dates sont stockées dans `orderedAt` ; `created` reste la date
technique PocketBase. Une date illisible provoque un avertissement, pas une
suppression silencieuse de la valeur d'origine. Les libellés de paiement
accidentellement présents dans la colonne production sont placés « À vérifier »,
sans inventer d'avancement. Un client explicitement vide est conservé sous le
libellé « Client à renseigner », avec le même montant et les données originales.
Les avertissements sont conservés dans les notes privées et le tag « Import à vérifier ».
Les lignes sans client ne sont pas supprimées, même si elles paraissent vides
ou ressemblent à une ancienne ligne de total : leur nature doit être confirmée.
Tout autre statut inconnu ou un acompte
supérieur au total bloque l'import avant toute écriture.

L'index unique `(source, sourceId)` empêche les doublons. Une relance du même
fichier ignore les commandes importées, même si elles ont depuis été modifiées
dans le backoffice. Sans ID original dans le CSV, l'identité est le hash du
fichier et le numéro de ligne : conserver exactement le même fichier pour une
relance. Un export différent sans ID ne permet pas une déduplication fiable.
Les commandes ne sont jamais fusionnées d'après le nom ou le téléphone.

Après import : relancer la simulation (0 création), comparer les compteurs et
totaux à la source, et conserver les sauvegardes privées. Pour récupérer une
commande, utiliser l'export sauvegardé et son ID précis ; ne pas restaurer toute
la base si de nouvelles ventes ont eu lieu depuis.

## Tests

```sh
node --experimental-strip-types --test tests/*.test.mjs
npx tsc --noEmit
npm run build
```

Les tests d'actions utilisent un magasin en mémoire : aucune donnée de test ni
notification n'est envoyée en production.
