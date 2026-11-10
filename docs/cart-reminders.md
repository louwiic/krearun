# Rappels de panier

Deux réglages dans **Admin → Réglages → Rappels de panier** :

- Retour sur le même navigateur : panier existant et au moins 30 minutes depuis la dernière visite mémorisée. Bandeau sur le site, fermable, sans notification push.
- Email : demande volontaire dans le panier, case non précochée, texte d’accord versionné, confirmation de l’adresse par email. Un seul rappel environ une heure après confirmation. Aucune inscription à la newsletter.

Les demandes sont privées et séparées des statistiques : `cart_reminders` et `cart_reminder_claims`, provisionnées automatiquement avec toutes les règles publiques à `null`. Conservation de 30 jours, purge lors d’une demande ou du worker. Les liens personnels sont valides pendant cette période ; la confirmation initiale expire après 24 heures. Une adresse ne peut déclencher qu’une demande pendant les 30 jours de conservation, y compris après annulation, pour éviter les envois répétés. Aucun email ni texte libre n’est ajouté aux événements statistiques.

Chaque email possède un lien de désabonnement accessible sans connexion. Le GET affiche la confirmation, le POST retire l’accord pour cette demande. Le désabonnement en un clic des fournisseurs de messagerie est aussi pris en charge (`List-Unsubscribe` et `List-Unsubscribe-Post`). Les pages contenant un jeton n’incluent aucun collecteur statistique et utilisent `no-referrer` / `noindex`.

## Traitement planifié

Le worker existant `POST /api/assistant/worker` traite également les rappels après sa file WhatsApp et son nettoyage. Il faut que ce worker soit déjà planifié et opérationnel.

Alternative indépendante : planifier toutes les cinq minutes un **POST** vers `https://krearun.re/api/cart-reminders/worker`, avec l’en-tête `Authorization: Bearer <CART_REMINDER_WORKER_SECRET>`. Le secret se configure dans l’environnement serveur ; à défaut, ce point d’entrée accepte `ASSISTANT_WORKER_SECRET`. Ne jamais mettre le secret dans l’URL ou les journaux. Le déploiement du code ne crée pas à lui seul une tâche planifiée.

Les emails utilisent la configuration Resend / SMTP existante. Les essais automatisés utilisent des transports simulés et n’envoient aucun message réel.

Avant l’envoi, le worker vérifie les commandes payées à la même adresse et les sessions Stripe associées, y compris si le webhook n’a pas encore créé la commande. Si une vérification échoue, il n’envoie pas. La réservation par identifiant unique empêche deux workers d’envoyer le même rappel. Une tentative de livraison déjà réservée n’est pas retentée automatiquement en cas d’incertitude, pour éviter un doublon.

Le lien de reprise permet de remplacer le panier du navigateur après confirmation. Les produits, variantes, disponibilités, prix, poids et remises sont relus côté serveur ; les règles de couleur et de personnalisation sont revérifiées par le paiement. Les coordonnées et moyens de paiement ne sont pas copiés. Les articles devenus indisponibles sont exclus.

Le rappel est annulé sur achat reconnu à la même adresse ou sur paiement associé. Un achat à une autre adresse et sans association ne peut pas être reconnu. Un envoi déjà transmis au prestataire ne peut pas être rappelé après un désabonnement.

Sources de cadrage : [CNIL — prospection par email](https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique), [CNIL — messages relationnels et commerciaux](https://www.cnil.fr/fr/communication-electronique-quelles-regles).
