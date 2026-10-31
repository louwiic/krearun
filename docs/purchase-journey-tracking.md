# Parcours d’achat

Page admin : `/admin/parcours-achat`. Collection privée `purchase_events`, créée par `node scripts/setup-purchase-journeys.mjs`. Toutes les règles PocketBase restent verrouillées ; le serveur gère les écritures et la consultation.

Le suivi commence après accord de mesure d’audience. Un UUID de session dans `sessionStorage` regroupe un onglet et expire après 30 minutes sans action. Une session n’est pas une personne unique et les autres appareils/onglets ne sont pas rapprochés. Les anciennes statistiques de produits ne permettent pas de reconstruire les parcours antérieurs.

| Événement | Déclenchement |
| --- | --- |
| `visit` | Navigation visible, type de page dans une liste fermée ; aucune URL brute |
| `product_view` | Fiche produit visible à 50 % pendant une seconde |
| `add_to_cart` | Augmentation de la quantité d’un produit dans le panier hydraté |
| `cart_updated` | Modification ou vidage du panier |
| `view_cart` | Ouverture du tiroir ou arrivée sur `/panier` |
| `begin_checkout` | Soumission valide du formulaire de commande |
| `checkout_error` | Échec de préparation, sans détail d’erreur ni coordonnées |
| `payment_started` | Session Stripe effectivement créée côté serveur |

Les paiements confirmés proviennent des commandes payées/refundées enregistrées par le serveur, rapprochées par identifiant Stripe. Une page de succès côté navigateur ne suffit jamais à confirmer une vente. Le filtre de dates sélectionne les sessions actives sur la période ; la classification regarde tout leur parcours disponible pour éviter de présenter comme abandonné un panier payé ensuite.

Les quantités et références sont validées, les prix sont relus côté serveur. Les montants de paniers sont indicatifs, hors livraison/remises/options. L’événement serveur de paiement utilise les prix effectivement validés au checkout. Un panier vide ou seulement ajouté sans consultation ne devient pas un panier en attente. Le délai d’attente est de 30 minutes après la dernière action mesurée.

Chaque événement utilise un UUID unique (index unique), réutilisé pour une nouvelle tentative. Les envois navigateur sont séquencés, échouent sans interrompre les achats, et sont ignorés pour les administrateurs/robots. Le point d’entrée impose origine autorisée, taille maximale, débit limité et liste fermée des événements client. Le navigateur ne peut pas écrire de paiement confirmé ni de référence Stripe.

Aucune adresse e-mail, nom de client, texte personnalisé, adresse IP ou URL complète n’est conservé dans ces statistiques. Les événements de plus de 30 jours sont exclus de la lecture et supprimés lors de la collecte/consultation suivante ; le nettoyage est tenté quotidiennement, sans bloquer les achats en cas d’échec.

## Relances futures

Aucun message, tâche planifiée ou envoi automatique n’est activé. Cette mesure d’audience n’autorise pas une prospection et n’enregistre pas de contact. Pour une future fonction de récupération, prévoir un panier opérationnel distinct, un contact avec consentement/gestion d’opposition adaptés, un lien de reprise signé, l’exclusion des achats confirmés, l’idempotence des envois et leur historique. Ne pas réutiliser une session anonyme comme preuve d’accord à une relance.
