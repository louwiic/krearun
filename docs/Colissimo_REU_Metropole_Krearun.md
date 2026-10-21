# Colissimo — La Réunion → France métropolitaine

Document pour le développeur de Krearun. Vérification dans Colissimo Box le 21 octobre 2026.

## 1. Compte et périmètre vérifiés

- Le compte affiche un contrat **FACILITÉ**.
- La grille consultée est la grille **Tarifs Généraux Entreprises Colissimo Domicile au départ des DOM**, onglet **Vers la France**.
- Elle est applicable à compter du **1er janvier 2026** et accessible aux contrats **Facilité** et **Privilège**.
- La page confirme explicitement les envois depuis **La Réunion vers la France métropolitaine**.
- Il s’agit de tarifs généraux, pas d’une simulation de facture ni d’une preuve de tarifs négociés propres au compte.

## 2. Grille de base complète

Montants en **euros HT**, par colis, hors options et suppléments applicables.

| Poids jusqu’à | Sans signature HT | Avec signature HT |
|---|---:|---:|
| 0,50 kg | 10,86 € | 14,81 € |
| 1 kg | 16,46 € | 18,99 € |
| 2 kg | 22,43 € | 25,61 € |
| 3 kg | 28,41 € | 32,22 € |
| 4 kg | 34,39 € | 37,44 € |
| 5 kg | 38,61 € | 43,44 € |
| 6 kg | 46,37 € | 52,07 € |
| 7 kg | 52,32 € | 58,69 € |
| 8 kg | 56,96 € | 62,44 € |
| 9 kg | 62,64 € | 68,78 € |
| 10 kg | 69,45 € | 75,10 € |
| 15 kg | 97,31 € | 106,73 € |
| 20 kg | 125,22 € | 133,08 € |
| 25 kg | 156,65 € | 162,44 € |
| 30 kg | 189,29 € | 193,13 € |

Il n’y a pas de tranche 250 g dans cet onglet : un colis de 250 g relève de la tranche 500 g. Les bornes sont inclusives ; 501 g relève de la tranche 1 kg, et 10,01 kg de celle de 15 kg.

## 3. Suppléments relevés et limites

La page générale des suppléments 2026 indique notamment :

| Élément | Valeur publiée | Traitement conseillé |
|---|---|---|
| Participation à la décarbonation | 0,05 € HT/colis | Prévoir un paramètre distinct ; confirmer son application au flux et au contrat |
| Compensation évolution du SMIC | 1 % à compter du 1er août 2026 | Paramètre daté ; la page décrit une application sur la facture HT après remise, avec exclusions |
| Coefficient d’ajustement énergies (CAE) | Pourcentage variable chaque mois | Ne pas inventer de taux ; obtenir le taux du mois et confirmer le périmètre applicable |
| Colis non mécanisable | 6,50 € HT/colis | Contrôler dimensions, emballage et conditions d’admission |
| Colis non admis | 65,00 € HT/colis | Refuser côté application les colis hors conditions d’admission |

Le CAE est décrit comme routier ou aérien selon le transport ; les services optionnels, suppléments, frais divers, droits et taxes sont exclus de son assiette publiée. La compensation SMIC comporte également des exclusions. Ne pas appliquer mécaniquement un pourcentage à un total incluant tous les frais.

La page décrit aussi un poids volumétrique **L × l × h / 5 000**, dimensions en cm et résultat en kg, pour certains flux aériens. Son texte vise notamment les envois à destination de l’Outre-mer et de l’international : **l’application exacte au sens Réunion → métropole reste à confirmer** avant activation automatique.

Le supplément de 15 € pour mauvaise annonce douanière est présenté pour les envois **vers** certains DOM. Ne pas le généraliser au sens inverse. Les suppléments internationaux et ceux réservés au contrat Privilège ne doivent pas être ajoutés automatiquement à ce flux Facilité.

Le taux CAE du mois, les options payantes, la fiscalité applicable et les éventuelles conditions particulières du compte n’ont pas été établis. Les prix ci-dessus sont donc une **base HT**, pas un coût final garanti. Ne pas convertir automatiquement en TTC avec un taux supposé.

## 4. Consignes d’implémentation proposées

Ces consignes sont des recommandations techniques, distinctes des faits relevés sur le site.

1. Créer une zone d’expédition « La Réunion → France métropolitaine ». Ne pas confondre ce sens avec métropole → Réunion, intra-Réunion ou international.
2. Stocker les poids en grammes entiers et les prix en centimes entiers. Inclure l’emballage dans le poids du colis.
3. Choisir la première borne supérieure ou égale au poids facturable ; refuser un poids nul/négatif ou supérieur à 30 kg pour cette grille.
4. Séparer les modes avec et sans signature. Ne pas déduire un supplément signature constant : les écarts varient selon la tranche.
5. Conserver une date d’effet et une source par grille. Rendre les tarifs et suppléments modifiables dans le backoffice.
6. Distinguer le coût transporteur estimé du prix de livraison facturé au client (marge, emballage, livraison offerte ou promotion).
7. Enregistrer sur la commande le poids, le mode, la version de grille, le tarif de base et chaque supplément utilisé.
8. Valider avec une première facture réelle que les coûts estimés correspondent au contrat, puis ajuster les paramètres.

### Données prêtes à reprendre

```json
{
  "currency": "EUR",
  "taxBasis": "HT",
  "effectiveFrom": "2026-01-01",
  "checkedOn": "2026-10-21",
  "origin": "RE",
  "destinationZone": "FR_METROPOLITAN",
  "contractObserved": "FACILITE",
  "service": "COLISSIMO_DOMICILE",
  "rates": [
    {"maxGrams":500,"withoutSignatureCents":1086,"withSignatureCents":1481},
    {"maxGrams":1000,"withoutSignatureCents":1646,"withSignatureCents":1899},
    {"maxGrams":2000,"withoutSignatureCents":2243,"withSignatureCents":2561},
    {"maxGrams":3000,"withoutSignatureCents":2841,"withSignatureCents":3222},
    {"maxGrams":4000,"withoutSignatureCents":3439,"withSignatureCents":3744},
    {"maxGrams":5000,"withoutSignatureCents":3861,"withSignatureCents":4344},
    {"maxGrams":6000,"withoutSignatureCents":4637,"withSignatureCents":5207},
    {"maxGrams":7000,"withoutSignatureCents":5232,"withSignatureCents":5869},
    {"maxGrams":8000,"withoutSignatureCents":5696,"withSignatureCents":6244},
    {"maxGrams":9000,"withoutSignatureCents":6264,"withSignatureCents":6878},
    {"maxGrams":10000,"withoutSignatureCents":6945,"withSignatureCents":7510},
    {"maxGrams":15000,"withoutSignatureCents":9731,"withSignatureCents":10673},
    {"maxGrams":20000,"withoutSignatureCents":12522,"withSignatureCents":13308},
    {"maxGrams":25000,"withoutSignatureCents":15665,"withSignatureCents":16244},
    {"maxGrams":30000,"withoutSignatureCents":18929,"withSignatureCents":19313}
  ]
}
```

Les identifiants de ce JSON sont internes à l’application : ils ne constituent pas les codes produits officiels des API Colissimo.

### Vérifications utiles

| Cas | Résultat de base attendu |
|---|---|
| 250 g sans signature | 10,86 € HT |
| 500 g sans signature | 10,86 € HT |
| 501 g sans signature | 16,46 € HT |
| 1 000 g avec signature | 18,99 € HT |
| 10 001 g sans signature | 97,31 € HT |
| Plus de 30 kg | Hors grille, bloquer ce mode |

## 5. API et création d’étiquettes

Cette recherche porte sur les tarifs. Aucun appel API n’a été exécuté, aucune étiquette n’a été générée et aucun envoi n’a été acheté.

Les droits effectifs pour `generateLabel`, `checkGenerateLabel` et `getLabel`, le mode d’authentification et les codes produits adaptés au départ de La Réunion doivent être validés séparément dans la documentation technique et par un test autorisé. La présence d’un contrat Facilité ne suffit pas à prouver ces droits.

Ne pas supposer que la génération d’une étiquette renvoie le prix final facturé. Conserver toute clé API côté serveur uniquement, sans l’exposer dans le navigateur, les logs ou ce document.

## 6. Sources

- Grille : https://www.colissimo.entreprise.laposte.fr/offres-et-services/tarifs-generaux/tarifs-colissimo-domicile-au-depart-des-dom — onglet « Vers la France ».
- Suppléments : https://www.colissimo.entreprise.laposte.fr/offres-et-services/tarifs-generaux/supplements-tarifaires-colissimo
- Type de contrat observé : https://www.colissimo.entreprise.laposte.fr/mon-compte

La page des tarifs consultée depuis le compte présente des tarifs généraux. Les conditions particulières et la facture du compte restent à rapprocher de cette grille avant de promettre un coût transporteur exact.
