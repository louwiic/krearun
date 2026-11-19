# Bibliothèque 3D dans l’administration

`/admin/bibliotheque-3d` propose les projets illustrés, les catégories et un
explorateur paginé de tous les fichiers/dossiers, y compris cachés et non indexés.
Les liens symboliques sont listés sans parcourir leurs destinations.
Chaque entrée expose son chemin Mac et une commande `open` protégée pour le shell.

## Synchronisation depuis le Mac

Dans le projet, lancer `npm run library:sync`. Le dossier source par défaut est
`3D/Bibliotheque_3D` dans le dossier personnel de l’utilisateur. Un autre dossier
peut être fourni avec `npm run library:sync -- /chemin/vers/la/bibliotheque`.

La commande copie localement les aperçus et documents de l’index, recense tous les
fichiers sans les déplacer, puis publie une archive dans la collection privée
PocketBase `library_snapshots`. Les modèles eux-mêmes ne sont pas téléversés. Les miniatures intégrées aux 3MF
sont extraites sans modifier les originaux, puis incluses dans le même stockage
privé. L’explorateur affiche aussi l’aperçu du projet courant.
La collection a toutes ses règles verrouillées et son fichier protégé. Elle est
créée lors de la première synchronisation avec les identifiants PocketBase du
projet. Les anciens instantanés restent conservés.

**Ne jamais versionner `assets/library-3d`** : ce dossier contient les chemins,
les aperçus et les documents privés du Mac. Il est exclu de Git et du contexte
Docker. En production, les routes admin chargent le dernier instantané depuis
PocketBase, avec un cache privé d’une minute. Aucun identifiant ni jeton de fichier
PocketBase n’est envoyé au navigateur. Les aperçus passent par l’API admin.

## Ouverture native des 3MF

Sur le Mac, dans le projet : `npm run library:bridge`. Laisser ce Terminal ouvert.
La passerelle écoute exclusivement sur `127.0.0.1:8791` et ouvre les `.3mf` dans
l’application associée par macOS. Utiliser le même `AUTH_SECRET` que le site.

Le bouton admin demande un ticket signé, valable une minute et limité à un fichier.
La passerelle vérifie la signature, l’expiration, l’origine et le chemin réel.
Elle refuse les traversées de dossiers et les liens pointant hors de la bibliothèque.
Elle ne propose aucune fonction de suppression ou de modification des fichiers.
Le navigateur peut demander une autorisation d’accès au réseau local.
`Ctrl+C` arrête la passerelle ; la relancer après un redémarrage du Mac.

Si la passerelle est arrêtée, les boutons de copie du chemin et de la commande
restent utilisables. L’application qui ouvre le 3MF peut modifier le fichier
après son ouverture si l’utilisateur l’enregistre : les fichiers ouverts sont
les originaux du Mac.
