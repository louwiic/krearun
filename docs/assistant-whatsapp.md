# Assistant privé Kréarun

## État et fonctions

Écran : `/admin/assistant`. Première version textuelle : consulter les commandes, rechercher des produits/brouillons, lire le stock de filament, préparer une fiche produit, modifier un prix/stock/disponibilité et changer le statut de production avec suivi.

Les écritures sont proposées et sauvegardées dans `assistant_actions` : récapitulatif, bouton **Confirmer la modification** ou réponse WhatsApp `CONFIRMER <identifiant>`. Elles expirent après 30 minutes, sont liées à la conversation et vérifient les données avant l’écriture. Une proposition ne peut être prise en charge qu’une fois, y compris après une coupure réseau. Ne pas relancer une écriture dont le résultat est incertain sans vérifier la fiche.

Les nouvelles fiches sont des **brouillons sans photo** ; compléter les photos dans Produits avant publication. Les variantes et ventes privées se règlent depuis leurs interfaces dédiées. Les photos entrantes WhatsApp et messages vocaux ne sont pas traités dans cette version. Pas d’email client, suppression, remboursement ou changement du paiement par l’assistant.

## 1. Provisionner le stockage

Depuis le dépôt avec les accès PocketBase serveur :

```sh
node scripts/setup-assistant.mjs
```

Crée trois collections privées à règles `null` et index uniques : `assistant_runs`, `assistant_actions`, `assistant_locks`. Le script est idempotent, ne crée ni produit ni commande et n’active aucun fournisseur.

## 2. Activer OpenAI dans Coolify

Sur https://platform.openai.com : activer la facturation API et créer une clé **de projet**, avec l’accès au modèle et à Responses. ChatGPT Plus ne finance pas cette API. Ne pas coller la clé dans une conversation, un ticket ou le dépôt.

Dans les variables serveur Coolify, renseigner :

```dotenv
OPENAI_API_KEY=<clé de projet>
ASSISTANT_ENABLED=true
ASSISTANT_MONTHLY_REQUEST_LIMIT=300
ASSISTANT_WORKER_SECRET=<secret aléatoire long>
```

Redéployer. Ouvrir `/admin/assistant`, puis tester « Quelles sont les dernières commandes ? ». Les indicateurs « Configuré » indiquent la présence des variables, pas leur validité chez le fournisseur. Une clé invalide, un manque de crédits ou un modèle inaccessible produisent un message d’erreur sans afficher de secret.

Modèle fixé à `gpt-5.4-mini`. Référence tarifaire au 4 novembre 2026 : 0,75 USD/M de tokens entrants, 4,50 USD/M sortants. Estimation prudente sans remise cache ; hors taxes, WhatsApp, images et hébergement. Les requêtes utilisent `store:false` ; ce réglage ne dispense pas de vérifier les conditions de conservation OpenAI applicables au compte. Seules les données nécessaires sont envoyées (pas de mot de passe, secret de paiement ou numéro de carte).

## 3. Connecter WhatsApp Business Cloud API

Créer une application Meta avec le produit WhatsApp et un numéro Business approprié. On peut démarrer avec le numéro de test Meta et son destinataire vérifié. Choisir la version Graph prise en charge affichée dans l’application Meta. Vérifier les conditions Meta applicables à l’assistant métier avant activation commerciale.

Renseigner côté serveur :

```dotenv
WHATSAPP_ACCESS_TOKEN=<jeton système autorisé à envoyer avec ce numéro>
WHATSAPP_APP_SECRET=<secret de l’application Meta>
WHATSAPP_PHONE_NUMBER_ID=<identifiant technique du numéro Business>
WHATSAPP_VERIFY_TOKEN=<secret aléatoire de validation du webhook>
WHATSAPP_GRAPH_VERSION=<version Graph supportée, vXX.0>
WHATSAPP_ADMIN_NUMBERS=+262692123456
```

`WHATSAPP_ADMIN_NUMBERS` doit contenir **le numéro WhatsApp personnel autorisé à commander l’assistant**, pas le numéro du bot. Plusieurs administrateurs sont séparés par des virgules. Ne pas supposer que le téléphone commercial public est celui du propriétaire ; le confirmer explicitement.

Après redéploiement, renseigner dans l’application Meta :

- Callback : `https://krearun.re/api/whatsapp/webhook`
- Verify token : la valeur de `WHATSAPP_VERIFY_TOKEN`
- Abonnement : événements `messages`, application abonnée au bon compte WhatsApp Business.

Les POST sont vérifiés par HMAC SHA-256 sur le corps brut. Seuls les messages textuels récents provenant des numéros autorisés et du bon `phone_number_id` sont acceptés. Les messages de statut et numéros inconnus sont ignorés. Les messages sont persistés avant acquittement ; l’identifiant WhatsApp unique empêche les doublons lors des nouvelles livraisons Meta.

Test privé : « Trouve le produit NOS », puis « Quel est le statut de la commande #… ? ». Tester d’abord une lecture. Pour les modifications, vérifier le récapitulatif puis répondre exactement `CONFIRMER <identifiant>` ou `ANNULER <identifiant>`. Cette connexion n’envoie aucun message aux clients.

## 4. Traitement et nettoyage à planifier

Planifier **chaque minute** dans l’ordonnanceur du serveur/Coolify un POST vers `https://krearun.re/api/assistant/worker` avec l’en-tête `Authorization: Bearer <ASSISTANT_WORKER_SECRET>`. Stocker le secret dans le gestionnaire de secrets de la tâche, pas dans une URL ou les journaux. Timeout recommandé 120 secondes. Le corps peut être vide.

La réception déclenche aussi le traitement via `after`, mais cela ne remplace pas la tâche planifiée : celle-ci vide la file si un redéploiement interrompt le callback et nettoie les données âgées de plus de 30 jours (100 lignes/collection/pass). Sans tâche, pas de garantie de nettoyage en arrière-plan. Les verrous du quota du mois courant restent conservés jusqu’à sa fin.

`processing` bloqué après coupure et `delivery_uncertain` exigent une vérification manuelle : les appels IA et envois Meta ambigus ne sont pas rejoués automatiquement. La réponse peut avoir été envoyée malgré une coupure ; consulter l’admin avant de recommencer. Les envois s’arrêtent après 23 heures ; ce worker n’envoie ni modèle marketing ni relance hors fenêtre.

## Coût et limites

Quota durable partagé : 300 **demandes IA/mois** par défaut, tous administrateurs et canaux confondus. Les commandes explicites de confirmation/annulation ne consomment pas de demande IA. Une demande échouée après réservation compte. Au maximum 4 appels Responses/demande, 1 200 tokens sortants/appel et contexte borné à 42 000 caractères. Pas de recherche web ni génération d’images payantes dans les outils. Le quota n’est pas un plafond en euros ; l’estimation mensuelle affiche les tokens reçus du fournisseur (les appels interrompus sans réponse peuvent être facturés sans mesure locale).

La limite de consommation locale ne remplace pas les contrôles de facturation OpenAI. Les coûts WhatsApp, le numéro, l’hébergement et les éventuels frais d’intermédiaire restent distincts.

## Vérification avant usage réel

1. Clé OpenAI et facturation actives ; test lecture depuis l’admin.
2. Application Meta, numéro, token et permissions corrects ; numéro personnel confirmé dans l’allowlist.
3. Webhook vérifié et tâche minute active ; test d’un message, puis même identifiant renvoyé : une seule réponse.
4. Proposition de modification : aucune écriture avant confirmation, une seule après, mauvais propriétaire et proposition expirée refusés.
5. Redéploiement et interruption réseau : pas de double écriture ou d’envoi client.

Références :

- https://developers.openai.com/api/docs/guides/function-calling
- https://developers.openai.com/api/docs/models/gpt-5.4-mini
- https://developers.facebook.com/documentation/business-messaging/whatsapp/overview
