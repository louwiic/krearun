# Porte-clés prénom

- Boutique : `/boutique/porte-cles-prenom`, accessible depuis la boutique, Personnaliser et le pied de page.
- Admin : `/admin/porte-cles`, lien « Porte-clés prénom ». Le générateur historique de prénoms 3D est conservé.
- Prix serveur fixe : 12 € par pièce, livraison incluse dans les destinations déjà prises en charge par le panier (La Réunion et France métropolitaine). Dans un panier mixte, les frais des autres articles restent calculés normalement.
- Chewy, Lilita One et Pacifico, hébergées localement avec leurs licences. Relief bicolore ou lettres unies ; prénom de 1 à 18 caractères ; accents, espaces et tirets acceptés si la police les contient.
- Couleurs : exclusivement la palette active de l’inventaire. Nom et hexadécimal relus côté serveur avant création du paiement. Aucune valeur de prix ou couleur libre envoyée par le navigateur n’est acceptée comme référence.

## Fabrication

Gabarit automatique : corps de texte de 80 × 25 mm maximum, œillet de diamètre extérieur 10 mm avec trou traversant de 4 mm. Épaisseur du fond 2,4 mm, relief 1,2 mm. Des ponts relient les lettres séparées, points et accents au fond. Les modèles unis conservent les contreformes traversantes des lettres. Les polygones sont assemblés sur une grille de 0,0001 mm via Clipper avant extrusion.

Après paiement confirmé, le webhook génère le 3MF dans `name_keychain_files`, collection privée avec fichier protégé. Chaque ligne de commande possède une clé unique `order:<id>:<index>` : les répétitions du webhook réessaient les fichiers manquants sans créer une nouvelle commande. Le fichier est accessible dans la commande admin et dans le générateur. La quantité à imprimer est celle de la ligne de commande ; le fichier contient une seule pièce.

L’admin peut générer et enregistrer un 3MF sans commande, ou télécharger les STL du fond et des lettres séparément. Les 3MF contiennent les couleurs du choix client et des pièces alignées. Les polices sont incluses explicitement dans les traces de déploiement des routes de paiement, webhook et export.

Tests : validation de prénom/police/couleurs disponibles, prix serveur et livraison, connexité du fond, œillet traversant, volumes et maillages fermés des exports. Le contrôle dans le trancheur et un premier tirage restent nécessaires pour valider le filament et le profil de la machine.

Sources des polices : [Chewy](https://github.com/google/fonts/tree/main/apache/chewy), [Lilita One](https://github.com/google/fonts/tree/main/ofl/lilitaone), [Pacifico](https://github.com/google/fonts/tree/main/ofl/pacifico). Les photos fournies sont utilisées comme références visuelles ; l’aperçu présente le modèle réellement généré.
