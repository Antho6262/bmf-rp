# BMF — Black Mafia Family

Site de gestion de faction (GTA RP), basé sur la même stack que Volta/Kronen Krieg.

## Déploiement
1. Push ce dossier tel quel dans un repo GitHub → active **GitHub Pages** (branche `main`, racine `/`).
2. Firebase (projet `bmf-rp`) : rules déjà collées via la console (voir `firebase-rules.json`), Auth anonyme à activer si pas encore fait (Authentication → Sign-in method → Anonyme).
3. Ouvre `setup.html` sur le site déployé pour créer le premier compte (administrateur).
4. Dans **Admin → Actions**, crée au minimum une action nommée exactement **"Fleeca"** pour activer la logique d'équipe (coéquipiers sans minimum, sans action comptée dans leurs stats).
5. Dans **Admin → Grades**, crée tes grades.
6. Dans **Admin → Config**, renseigne le webhook Discord, le taux de blanchiment, la fréquence radio et les events si besoin.

## Différences vs le contexte Kronen Krieg fourni
Pour rester strictement dans le périmètre demandé :
- Pages retirées : Armurerie, Stock, Labo (dépendait du stock), Prostitué.
- Nouvelle page **Radio** : affichage stylé (tuner animé) de la fréquence, modifiable dans Admin → Config.
- **Visibilité** et **Permissions** ont été fusionnées en une seule matrice grade × page (Admin → Permissions), plutôt que deux matrices séparées, pour rester simple.
- **Quotas** gérés uniquement dans Admin → Quotas (pas de page `quotas.html` séparée).

Tout le reste (semaines automatiques, badges/records, alertes Discord quotas, recherche Ctrl+F, journal d'audit, mode TV, tracker temps réel, taxes avec code + expiration, paye Propre par défaut, blanchiment avec annulation) est repris du fonctionnement Kronen Krieg.

## Identité visuelle
Noir/or, typographie Cinzel (titres) + Inter (texte) + JetBrains Mono (chiffres), logo extrait du visuel fourni.
