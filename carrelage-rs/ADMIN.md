# Gestion des devis

## Usage IA

Le bandeau admin suit les appels de ce site à partir de son activation (pas d'import d'historique ni accès au solde OpenAI). Coût estimé en USD hors taxes, tarifs GPT-5 mini standards vérifiés le 15 septembre 2026 : entrée 0,25 $/M, cache 0,025 $/M, sortie 2 $/M. Le raisonnement est déjà inclus dans les tokens de sortie. Les images sont incluses dans les tokens d'entrée rapportés par OpenAI. Le coût et la version du tarif sont figés par appel ; les erreurs de parsing restent facturées si l'API a renvoyé des tokens.

Fichiers privés : `.data/ai-usage` par défaut, voisin de `QUOTES_DATA_DIR`, ou `AI_USAGE_DATA_DIR` personnalisé. Inclure ce dossier dans les sauvegardes. Aucun plan, prompt ou renseignement client n'y est stocké. Une entrée est créée avant l'appel puis remplacée atomiquement après la réponse. Si le suivi ne peut pas démarrer, aucun appel payant n'est lancé. Les erreurs réseau et les arrêts de processus restent marqués à coût inconnu (exclus des sommes). Mois calculés dans le fuseau Indian/Reunion. Les refus HTTP 400/401/403/404/429 sont estimés à zéro ; la facture du fournisseur reste la référence. Les refus locaux (authentification, clé absente, limite locale) ne sont pas des tentatives API.


- Interface : `/admin`, connexion : `/admin/login`.
- Mot de passe serveur : `ADMIN_PASSWORD`, dans `.env.local` en local. Jamais dans le bundle client.
- Session de 8 heures, cookie HttpOnly. Configurer HTTPS et une limitation des tentatives au reverse proxy avant publication.
- Dossiers et photos : fichiers JSON privés dans `QUOTES_DATA_DIR` (par défaut `.data/quotes`). Prévoir un disque persistant et des sauvegardes. Ne pas déployer ce stockage sur un filesystem éphémère/serverless.
- Enregistrement explicite ; un avertissement protège les modifications non sauvegardées lors d'un changement de dossier ou de fermeture de page.
- Les métrés rectangulaires utilisent longueur × largeur. Pour une pièce irrégulière, laisser ces dimensions vides et saisir une surface validée manuellement. La sélection des pièces alimente uniquement la ligne de pose au sol.
- Les autres prestations ont une quantité et un prix saisis manuellement. Les calculs monétaires sont arrondis au centime par ligne. Aucun tarif métier n'est prérempli.
- Photos JPG, PNG et WebP, 5 Mo maximum. Choisir une pièce puis cliquer sur la photo pour placer son repère ; cliquer sur un repère pour inclure/exclure la pièce.
- Analyse active : OpenAI GPT-5 mini, clé `OPENAI_API_KEY` dans `.env.local`. Le bouton "Analyser avec GPT-5 mini" envoie uniquement la photo, jamais les champs client du dossier. Attention : la photo elle-même peut contenir des coordonnées client. Les anciennes variables OVH sont conservées mais ne sont pas utilisées par la route active.
- API : `https://api.openai.com/v1/chat/completions`, modèle `gpt-5-mini`, raisonnement `low`, maximum 8 000 tokens de génération (raisonnement inclus), `store: false`. Clé exclusivement côté serveur. Appels sur clic avec confirmation d'envoi. Pas de relance automatique facturable. Délai maximal 100 secondes, une analyse simultanée et 10 tentatives par heure par processus (limite de test, pas un plafond de facturation global pour un déploiement multi-instance).
- L'IA propose des pièces et des cotes, jamais des prix. Ne pas déduire de métrés depuis les pixels. Les mesures inconnues restent vides ; les pièces irrégulières nécessitent une surface relevée. Vérifier chaque proposition puis cocher "Mesures vérifiées" avant ajout. L'ajout ne remplace pas le dossier et ne sélectionne aucune pièce pour le chiffrage. Les valeurs proposées peuvent être fausses même lorsqu'elles sont complètes.
- Export JSON de sauvegarde et impression via navigateur. Le document est une estimation HT, pas encore un devis définitif avec TVA, mentions contractuelles, signature ou facturation.
- La gestion actuelle privilégie un seul opérateur. En cas d'édition concurrente d'un dossier, le dernier enregistrement remplace le précédent.
