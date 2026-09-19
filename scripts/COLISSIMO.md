# Colissimo dans Krearun

Depuis les détails d’une commande, ouvrir **Expédier avec Colissimo** (également accessible dans la fenêtre des détails de la liste).

## Configuration

1. Disposer d’un contrat Colissimo compatible avec le lieu de départ et les destinations. Obtenir la clé de connexion Web Services dans le profil Colissimo Box.
2. Définir côté serveur les variables `COLISSIMO_*` décrites dans `.env.example`. Ne jamais utiliser de variable `NEXT_PUBLIC_` pour la clé. Utiliser `RE` comme pays expéditeur pour La Réunion et renseigner son adresse réelle.
3. Créer la collection privée, une seule fois par environnement :

   ```sh
   node --env-file=.env scripts/setup-colissimo.mjs
   ```

   Ce script crée uniquement `colissimo_shipments` si elle n’existe pas. Il ne modifie pas les commandes. Les règles d’accès PocketBase sont nulles (superuser uniquement) et un index unique sur `orderId` empêche les achats concurrents.
4. Conserver `COLISSIMO_MODE=test`, puis tester une commande réelle : nom/adresse, service du contrat, poids emballé, date et douane si nécessaire. Le bouton appelle `checkGenerateLabel`, sur l’API officielle, et ne génère ni étiquette, ni suivi, ni email. Ce mode n’est pas le sandbox SOAP.
5. Après validation des accès et du service pour les départs de La Réunion, passer `COLISSIMO_MODE=production` et redémarrer/redéployer l’application. Le formulaire demande une confirmation avant l’affranchissement réel.

L’API utilisée est SLS REST **3.1** avec authentification `apiKey` en en-tête. Pas de mot de passe Colissimo stocké en base. L’application ne présume pas du tarif contractuel : les frais de livraison de la commande ne sont pas un devis Colissimo.

## Utilisation

- Choisir le produit compatible avec son contrat et la destination (DOM, DOS, COM, CDS ou ECO). Le contrôle Colissimo est exécuté avant toute génération réelle.
- Renseigner le **poids emballé**. Pour la douane, renseigner aussi les descriptions, quantités, poids et valeurs unitaires réelles après réduction, codes HS, pays de fabrication et référence de facture.
- Cette première intégration demande une CN23 pour tous les envois entre pays/territoires différents, dont RE → FR. Elle couvre les ventes de marchandises (catégorie 3), et demande le retour payant en cas de non-livraison. Les cas contractuels spéciaux se traitent dans ColiShip.
- Les étiquettes PDF A4/10×15, CN23 et éventuels documents proforma sont enregistrés dans la collection privée. Le téléchargement passe par une route administrateur avec `Cache-Control: private, no-store`. Aucun PDF n’est placé dans le bucket public des photos.
- Le numéro de suivi est copié dans la commande. Le statut ne change pas et aucun email n’est envoyé à ce stade.
- Au dépôt, utiliser le bloc **Production**, statut **Expédiée**, avec la notification client cochée. L’email d’expédition existant transmet le suivi.
- Le lien de suivi ouvre La Poste. La synchronisation automatique des événements de suivi, les retours, les points relais au checkout, les étiquettes multiples pour une commande et l’annulation d’un affranchissement ne font pas partie de cette version.

## Incident / reprise

Une seule expédition est créée par commande. Le bouton désactivé côté navigateur est complété par l’index unique en base. Après un refus explicite Colissimo, la réservation est supprimée pour permettre une correction. Après une coupure, un délai dépassé ou une erreur de persistance, elle est conservée : **ne jamais relancer automatiquement un achat**.

La réponse MIME originale est conservée en base avant son décodage. Si disponible, **Récupérer l’étiquette existante** permet de la relire après deux minutes, sans nouvel appel d’affranchissement. Une fois les PDF enregistrés, la réponse brute est effacée. Si seule la copie du suivi échoue, utiliser **Rattacher le suivi**.

Si aucune réponse exploitable n’a pu être conservée, vérifier la référence `KR-<numéro de commande>` dans Colissimo Box / ColiShip. Si le colis existe, récupérer ses documents dans Colissimo et reporter le suivi dans Krearun. Ne supprimer la réservation privée `colissimo_shipments` qu’après confirmation chez Colissimo qu’aucun affranchissement n’a été créé. Une demande restée `generating` doit également être considérée comme incertaine.

## Validation technique

```sh
node --experimental-strip-types --test tests/colissimo.test.mjs
npx tsc --noEmit
```

Les tests isolés couvrent les unités, les territoires, la douane, le MIME binaire, l’authentification, le mode test, les soumissions concurrentes et la conservation du verrou en cas de panne. Ils n’affranchissent aucun colis. Un test connecté nécessite la clé du contrat.

Référence officielle : https://www.applications.colissimo.entreprise.laposte.fr/doc-colissimo/redoc-sls/fr
