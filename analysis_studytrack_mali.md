# 🔍 Analyse Professionnelle Complète — StudyTrack Mali

> **Audit réalisé par un dev fullstack senior** | 53 fichiers analysés | ~4800 lignes de code source

---

## 📋 Vue d'Ensemble du Projet

**StudyTrack Mali** est une application de productivité pour étudiants maliens, construite avec :

- **Frontend** : React 19 + TypeScript + MUI 7 + Framer Motion
- **State** : Zustand (tasks, habits) + React Context (pomodoro, audio)
- **Backend** : Firebase (Auth + Firestore) + Gemini AI (coach IA)
- **Mobile** : Capacitor (Android)
- **Build** : Vite 8

### Fonctionnalités couvertes

| Module    | Fichiers                        | Description                                               |
| --------- | ------------------------------- | --------------------------------------------------------- |
| Auth      | 1 composant                     | Email/password Firebase                                   |
| Dashboard | 6 composants                    | Stats, graphiques, streak, quote, AI insights, newsletter |
| Tâches    | 5 composants                    | CRUD, Kanban, filtres, sous-tâches, rappels               |
| Habitudes | 1 composant                     | Suivi hebdo, streaks, checkboxes                          |
| Pomodoro  | 2 composants + context + worker | Timer travail/pause, alarme, notifications                |
| Notes     | 2 composants                    | Notes texte + vocales, audio player                       |
| Journal   | 7 composants                    | Rapports daily/weekly/monthly, timeline, mood             |
| Dépenses  | 1 composant                     | Revenus/dépenses, graphiques Recharts                     |
| Coach IA  | 1 composant + hook + service    | Chat Gemini, insights contextuels                         |

---

## 🚨 PROBLÈMES CRITIQUES DE SÉCURITÉ

> [!CAUTION]
> Ces problèmes doivent être corrigés **IMMÉDIATEMENT** avant tout déploiement public.

### 1. 🔴 `serviceAccountKey.json` exposé dans le repo

Le fichier [serviceAccountKey.json](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/serviceAccountKey.json) contient la **clé privée complète** du service account Firebase Admin. Même s'il est dans `.gitignore`, le fait qu'il soit présent dans un dossier nommé `studytrack-mali-main` (probablement téléchargé depuis GitHub) signifie qu'il **a potentiellement été commité dans l'historique Git**.

**Impact** : Accès complet administrateur à votre projet Firebase — lecture/écriture de toutes les données, suppression de comptes, etc.

**Action immédiate** :

- Révoquer cette clé dans la console Firebase → Project Settings → Service accounts
- Générer une nouvelle clé
- Vérifier l'historique Git : `git log --all -- serviceAccountKey.json`
- Ne JAMAIS inclure ce fichier côté client

### 2. 🔴 Clé API Firebase hardcodée dans le code source

Dans [firebase.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/firebase.tsx#L6-L9) :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCRXQYiWlIaZi3Mmkf1Zqy2TVfCCL8IdaA",
  authDomain: "studytrack-mali.firebaseapp.com",
  projectId: "studytrack-mali",
};
```

Cette clé est visible par quiconque inspecte le code. **Bien que les clés API Firebase côté client soient techniquement "publiques"**, sans **Firestore Security Rules strictes** et **App Check**, n'importe qui peut :

- Créer des comptes illimités
- Écrire des données arbitraires dans votre Firestore
- Consommer votre quota Firebase

### 3. 🔴 Clé API Gemini dans `.env.local`

[.env.local](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/.env.local) contient la clé Gemini. Si ce fichier a été poussé sur GitHub (même brièvement), la clé est compromise.

### 4. 🟠 Aucune règle Firestore visible / Pas de validation côté serveur

Aucun fichier `firestore.rules` n'est présent. Sans règles, les données sont potentiellement accessibles sans restrictions.

---

## 🏗️ ARCHITECTURE — Ce qui marche bien

### ✅ Points forts

1. **Code splitting via `React.lazy()`** — Toutes les pages sont lazy-loaded dans [App.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/App.tsx#L30-L37), ce qui réduit le bundle initial
2. **Zustand pour le state global** — Choix intelligent, plus léger que Redux, avec des subscriptions granulaires (selectors dans chaque composant)
3. **Web Worker pour le Pomodoro** — Le timer utilise un worker ([PomodoroContext.tsx:L121](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/context/PomodoroContext.tsx#L121)), donc ne se bloque pas quand l'onglet est inactif
4. **Offline persistence Firestore** — `enableIndexedDbPersistence()` activé dans [firebase.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/firebase.tsx#L17)
5. **Cache AI responses** — Cache localStorage 12h pour les insights dans [aiService.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/utils/aiService.tsx#L36-L57)
6. **Global Audio Player** — Le player audio est dans un Context qui persiste entre les navigations ([AudioPlayerContext.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/context/AudioPlayerContext.tsx))
7. **`memo()` sur toutes les pages** — Dashboard, TasksPage, HabitTracker, NotesPage, JournalPage

---

## ⚠️ ARCHITECTURE — Problèmes détectés

### 1. `enableIndexedDbPersistence` est déprécié

```diff
- import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
+ import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
```

L'API correcte avec Firebase v12+ est :

```javascript
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

Cela résout aussi le problème multi-onglets mentionné dans le catch.

### 2. Double appel `useStreak(tasks)` dans App.tsx

Le hook `useStreak` est appelé **deux fois** avec les mêmes `tasks` :

- [App.tsx:L124](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/App.tsx#L124) dans `App()`
- [App.tsx:L55](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/App.tsx#L55) dans `AppShell()`

L'appel dans `AppShell` n'est utilisé par rien (il passe juste `currentStreak` dans le composant qui le recalcule). **Redondance à supprimer.**

### 3. `startReportScheduler` recapturées des closures figées

Dans [App.tsx:L129](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/App.tsx#L128-L131) :

```javascript
useEffect(() => {
  if (user) startReportScheduler(user.uid, tasks, habits, currentStreak);
  return () => stopReportScheduler();
}, [user, tasks, habits, currentStreak]);
```

Chaque changement de `tasks`/`habits`/`currentStreak` **relance le scheduler complet** (clearTimeout + setTimeout + exécution immédiate). Avec des snapshots Firestore en temps réel, cela se produit à chaque ajout/modification de tâche. Le scheduler génère donc des requêtes Firestore inutiles très fréquemment.

### 4. Mélange TypeScript / JavaScript

Les fichiers sont en `.tsx` mais n'utilisent **aucun type TypeScript réel**. Tout est typé `any` implicitement :

- `getTheme = (mode) =>` — pas de type sur `mode`
- `set`, `get` dans les stores — pas de types Zustand
- Props de composants — aucune interface

Le `tsconfig.json` est configuré mais les types ne sont pas exploités. C'est du JavaScript avec une extension `.tsx`.

### 5. `firebase-admin` dans les devDependencies du frontend

[package.json:L63](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/package.json#L63) : `"firebase-admin": "^13.10.0"` — ce package est pour Node.js côté serveur. Il ne devrait **jamais** être dans une app frontend. Il gonfle inutilement les deps et est lié au `serviceAccountKey.json` dangereux.

---

## 📊 ANALYSE FONCTIONNALITÉ PAR FONCTIONNALITÉ

### 🔐 Authentification ([AuthPage.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/auth/AuthPage.tsx))

**Ce qui marche :**

- Login/signup email+password ✓
- Indicateur de force du mot de passe ✓
- Toggle visibilité du mot de passe ✓
- Messages d'erreur traduits en français ✓
- Design soigné avec orbes animés ✓

**Manques :**

- ❌ Pas de "Mot de passe oublié" — fonctionnalité critique absente
- ❌ Pas de connexion Google/Apple (OAuth) — frein à l'adoption
- ❌ Pas de validation email — l'utilisateur peut s'inscrire avec un email faux
- ❌ Pas de confirmation de mot de passe à l'inscription
- ❌ Pas de rate limiting sur les tentatives de connexion côté client
- ❌ `pwStrength()` est recalculé à chaque render (devrait être `useMemo`)

---

### 📊 Dashboard ([Dashboard.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/dashboard/Dashboard.tsx))

**Ce qui marche :**

- Stats cards avec animations hover ✓
- Graphique de progression 7 jours ✓
- Streak tracker avec heatmap ✓
- Citations motivationnelles ✓
- Insights IA contextuels ✓

**Problèmes :**

- ❌ Newsletter écrite directement en Firestore depuis le client (pas de Cloud Function, pas de double opt-in, pas de conformité RGPD)
- ❌ `Grid item` utilise l'ancienne API MUI v5 (deprecated dans MUI v7). Il faut utiliser `Grid2` ou `Grid size={}`
- ❌ Le Dashboard ne montre pas l'activité Pomodoro du jour
- ❌ Pas de raccourci "quick add" pour les tâches depuis le dashboard

---

### ✅ Gestion de Tâches ([TasksPage.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/tasks/TasksPage.tsx), [TaskForm.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/tasks/TaskForm.tsx))

**Ce qui marche :**

- CRUD complet avec Firestore real-time ✓
- Vue liste + Kanban ✓
- 4 niveaux de priorité ✓
- 5 catégories ✓
- Sous-tâches ✓
- Filtres combinés ✓
- Recherche textuelle ✓
- Rappels horaires ✓

**Problèmes :**

- ❌ Les sous-tâches n'ont **pas d'ID unique** ([TaskForm.tsx:L63](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/tasks/TaskForm.tsx#L63)) — si deux sous-tâches ont le même texte, le toggle échouera (clé React par index)
- ❌ Pas de drag-and-drop dans le Kanban
- ❌ Pas de tâches récurrentes (ex: "Réviser tous les lundis")
- ❌ Pas de temps estimé utilisable (le champ `estimatedTime` existe dans le type mais pas dans le formulaire)
- ❌ Pas de champ `notes` dans le formulaire (existe dans le type)
- ❌ Pas de pagination — si l'utilisateur a 500 tâches, **toutes** sont chargées en mémoire via `onSnapshot`
- ❌ Le tri par date met les tâches sans date en premier (tri ascendant sur string vide)

---

### 💪 Suivi d'Habitudes ([HabitTracker.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/habits/HabitTracker.tsx))

**Ce qui marche :**

- Grille hebdomadaire avec checkboxes ✓
- Streak par habitude ✓
- Taux de complétion hebdomadaire ✓
- Personnalisation emoji + couleur ✓

**Problèmes :**

- ❌ `weekDates` et `today` sont mémorisés avec `useMemo(() => ..., [])` — **pas de dépendance**, donc si l'app reste ouverte la nuit, les dates ne changent jamais
- ❌ Le champ `completedDates` dans Firestore **grossit indéfiniment** — un tableau avec 365+ entrées par an, par habitude. Au bout de 3 ans → 1000+ éléments dans un seul document
- ❌ Pas de vue mensuelle ou annuelle (seulement la semaine en cours)
- ❌ Pas de rappel/notification pour les habitudes
- ❌ Pas de possibilité de modifier une habitude existante (seulement créer/supprimer)
- ❌ Pas de fréquence personnalisable (ex: "3 fois par semaine" vs "tous les jours")

---

### 🍅 Pomodoro ([PomodoroTimer.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/pomodoro/PomodoroTimer.tsx), [PomodoroContext.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/context/PomodoroContext.tsx))

**Ce qui marche :**

- Timer travail/pause/longue pause ✓
- Web Worker pour précision en arrière-plan ✓
- Alarme générée par Web Audio API ✓
- Notifications natives Android + Web ✓
- Titre de l'onglet dynamique (montre le compte à rebours) ✓
- Paramètres persistés en localStorage ✓
- In-app notification toast ✓

**Problèmes :**

- ❌ Les sessions ne sont **pas sauvegardées en base** — aucun historique Pomodoro n'est persisté. Le journal y accède via `pomodoroData` passé en argument, mais c'est toujours `null`
- ❌ Pas de liaison tâche ↔ Pomodoro (ex: "je travaille sur telle tâche")
- ❌ Pas de statistiques Pomodoro (nombre de sessions par jour/semaine)
- ❌ Le KeepAwake n'est pas utilisé dans le Pomodoro (seulement dans le VoiceRecorder)
- ❌ Pas de son personnalisable

---

### 📝 Notes ([NotesPage.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/notes/NotesPage.tsx))

**Ce qui marche :**

- Notes texte avec titre/contenu/couleur ✓
- Notes vocales avec MediaRecorder ✓
- Player audio global persitant entre navigations ✓
- Pin/unpin ✓
- Layout masonry responsive ✓
- Codec auto-detection (opus, webm, mp4, aac) ✓

**Problèmes :**

- ❌ **L'audio est stocké en base64 dans Firestore** — Un enregistrement de 10 minutes en webm/opus pèse ~3-5 MB en base64. Firestore a une limite de **1 MB par document**. Des enregistrements de 2+ minutes crasheront silencieusement
- ❌ Pas de dossiers/tags pour organiser les notes
- ❌ Pas de formatage riche (markdown, gras, listes)
- ❌ Pas de recherche dans le contenu audio (transcription)
- ❌ Le composant fait **712 lignes** — devrait être découpé

---

### 📓 Journal ([JournalPage.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/journal/JournalPage.tsx))

**Ce qui marche :**

- Rapports daily/weekly/monthly auto-générés ✓
- Timeline navigation ✓
- Score de productivité calculé ✓
- Sélecteur d'humeur ✓
- Insights IA sur les rapports ✓

**Problèmes :**

- ❌ `ensureTodayReport` fait un `getDocs` **avec filtre uniquement sur `uid`** puis filtre en mémoire ([useJournal.tsx:L58-L66](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/hooks/useJournal.tsx#L58-L66)). Cela charge TOUS les journal_entries de l'utilisateur juste pour vérifier si un rapport existe. Le commentaire dit "pour éviter l'erreur d'index composite" — il faut créer l'index composite dans Firebase
- ❌ Les données Pomodoro sont toujours `null` dans les rapports car les sessions ne sont pas persistées
- ❌ Pas d'export (PDF, image) des rapports

---

### 💰 Dépenses ([ExpenseTracker.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/expenses/ExpenseTracker.tsx))

**Ce qui marche :**

- Revenus + dépenses avec catégories ✓
- Devise en FCFA (XOF) ✓
- Graphique camembert + barres ✓
- Filtres multiples ✓
- Design soigné avec cards gradient ✓

**Problèmes :**

- ❌ Pas de budget mensuel (objectif vs réel)
- ❌ Pas d'historique mensuel (tendances)
- ❌ Pas de modification de transaction (seulement ajout/suppression)
- ❌ Pas de confirmation avant suppression (la suppression est instantanée, contrairement aux tâches qui ont un `ConfirmDialog`)
- ❌ Le fichier fait **533 lignes** pour un seul composant — devrait être découpé
- ❌ `Grid item` utilise l'ancienne API dépréciée de MUI v7

---

### 🤖 Coach IA ([AIChatFAB.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/components/ai/AIChatFAB.tsx), [aiService.tsx](file:///c:/Users/mnitu/Downloads/studytrack-mali-main/studytrack-mali-main/src/utils/aiService.tsx))

**Ce qui marche :**

- Chat contextuel avec historique ✓
- Injection automatique du contexte utilisateur ✓
- Suggestions prédéfinies ✓
- Gestion d'erreurs granulaire (API key, quota, réseau) ✓
- Cache des insights 12h ✓

**Problèmes :**

- ❌ La clé API Gemini est **exposée côté client** — n'importe qui peut l'extraire et l'utiliser pour générer du contenu à vos frais. Solution : proxy via Cloud Function
- ❌ Pas de limite de messages par jour côté client
- ❌ L'historique de chat n'est pas persisté — se perd à chaque refresh
- ❌ Le commentaire JSDoc dit "Gemini 1.5 Flash" mais le modèle configuré est `gemini-2.5-flash` — incohérence
- ❌ Pas de streaming (les réponses arrivent d'un coup au lieu de s'afficher progressivement)

---

## 🎨 UI/UX — Évaluation Design

### ✅ Points forts du design

- Thème dark/light cohérent avec glassmorphism ✓
- Palette de couleurs violet/cyan harmonieuse ✓
- Micro-animations Framer Motion partout ✓
- Police Inter bien choisie ✓
- Responsive mobile-first ✓

### ❌ Problèmes UX

- Pas de feedback haptique sur mobile (Capacitor le supporte)
- Pas de skeleton loading (seulement des spinners)
- Le FAB du Coach IA chevauche potentiellement le FAB du Pomodoro et le FAB de la JournalPage sur mobile
- Pas de tour/onboarding pour les nouveaux utilisateurs
- Pas d'empty states illustrés (juste du texte + emoji)
- Le sidebar ne montre pas de badge count (ex: "3 tâches en retard")

---

## ⚡ PERFORMANCES

### Problèmes identifiés

1. **Tous les documents Firestore sont chargés en mémoire** — Pas de pagination ni de limite sur les queries. Si un utilisateur a 1000 tâches → 1000 documents en RAM
2. **`startReportScheduler` se relance à chaque changement de state** — Crée un effet cascade
3. **Notes vocales en base64 dans Firestore** — Énorme consommation de bande passante
4. **`useNotificationService` poll toutes les 15 secondes** — Itère sur toutes les tâches 4 fois par minute
5. **Pas de `React.memo` sur les sous-composants** — `TaskCard`, `StatsCards`, `ProgressChart`, etc. re-render à chaque changement

---

## 📦 QUALITÉ DU CODE

| Critère               | Note | Commentaire                                                                                       |
| --------------------- | ---- | ------------------------------------------------------------------------------------------------- |
| Structure de fichiers | 7/10 | Bonne organisation en dossiers, mais certains fichiers sont trop gros (NotesPage: 712 lignes)     |
| TypeScript usage      | 2/10 | Types définis mais jamais utilisés. Tout est `any` implicite                                      |
| Error handling        | 5/10 | `try/catch` sur les opérations Firestore, mais `catch(e) { /* ignore */ }` partout dans les utils |
| Tests                 | 1/10 | Un seul fichier `App.test.tsx` qui ne teste rien d'utile                                          |
| Documentation         | 6/10 | JSDoc en français sur les fonctions principales, commentaires utiles                              |
| DRY                   | 5/10 | Beaucoup de duplication de styles MUI `sx` entre composants                                       |
| Accessibilité         | 3/10 | Pas de `aria-label`, pas de navigation clavier, pas de focus management                           |

---

## 🚀 PLAN D'AMÉLIORATIONS — Par priorité

### 🔴 Priorité CRITIQUE (sécurité)

| #   | Amélioration                                                            | Fichier impacté |
| --- | ----------------------------------------------------------------------- | --------------- |
| 1   | Révoquer et re-générer le `serviceAccountKey.json`, supprimer du projet | Racine          |
| 2   | Ajouter `firestore.rules` strictes (auth check sur chaque collection)   | Nouveau fichier |
| 3   | Déplacer l'appel Gemini derrière une Cloud Function (proxy API key)     | `aiService.tsx` |
| 4   | Activer Firebase App Check                                              | `firebase.tsx`  |
| 5   | Supprimer `firebase-admin` des devDependencies                          | `package.json`  |

### 🟠 Priorité HAUTE (bugs / dégradation)

| #   | Amélioration                                                           | Fichier impacté                 |
| --- | ---------------------------------------------------------------------- | ------------------------------- |
| 6   | Migrer `enableIndexedDbPersistence` → `persistentLocalCache`           | `firebase.tsx`                  |
| 7   | Stocker les audio dans Firebase Storage au lieu de base64 en Firestore | `NotesPage.tsx`, `useNotes.tsx` |
| 8   | Ajouter des IDs uniques aux sous-tâches                                | `TaskForm.tsx`                  |
| 9   | Paginer les queries Firestore (limit + orderBy)                        | Tous les hooks                  |
| 10  | Créer les index composites Firestore (uid + type + periodStart)        | Firebase Console                |
| 11  | Débouncer `startReportScheduler` pour éviter les appels en cascade     | `App.tsx`                       |
| 12  | Ajouter "Mot de passe oublié"                                          | `AuthPage.tsx`                  |

### 🟡 Priorité MOYENNE (fonctionnalités manquantes)

| #   | Amélioration                                      | Fichier impacté                    |
| --- | ------------------------------------------------- | ---------------------------------- |
| 13  | Persister les sessions Pomodoro en Firestore      | `PomodoroContext.tsx`              |
| 14  | Lier un Pomodoro à une tâche spécifique           | `PomodoroTimer.tsx`                |
| 15  | Tâches récurrentes                                | `TaskForm.tsx`, `useTaskStore.tsx` |
| 16  | Notification de rappel d'habitudes                | `useNotificationService.tsx`       |
| 17  | Modification d'habitudes existantes               | `HabitTracker.tsx`                 |
| 18  | Fréquence personnalisable pour habitudes          | `HabitTracker.tsx`                 |
| 19  | Budget mensuel dans les dépenses                  | `ExpenseTracker.tsx`               |
| 20  | Modification de transaction                       | `ExpenseTracker.tsx`               |
| 21  | Confirmation avant suppression de transaction     | `ExpenseTracker.tsx`               |
| 22  | Export des rapports en PDF                        | `JournalPage.tsx`                  |
| 23  | Connexion Google OAuth                            | `AuthPage.tsx`                     |
| 24  | Champ `estimatedTime` dans le formulaire de tâche | `TaskForm.tsx`                     |
| 25  | Streaming des réponses IA                         | `aiService.tsx`, `AIChatFAB.tsx`   |

### 🟢 Priorité BASSE (polish / DX)

| #   | Amélioration                                                               | Fichier impacté           |
| --- | -------------------------------------------------------------------------- | ------------------------- |
| 26  | Typer correctement tous les composants en TypeScript                       | Tous                      |
| 27  | Migrer `Grid item` → `Grid2` (MUI v7)                                      | Dashboard, ExpenseTracker |
| 28  | Skeleton loading au lieu de spinners                                       | Tous                      |
| 29  | Onboarding/tour pour nouveaux utilisateurs                                 | Nouveau composant         |
| 30  | Badge count dans le sidebar (tâches en retard)                             | `Sidebar.tsx`             |
| 31  | Feedback haptique sur mobile                                               | Utils                     |
| 32  | Découper `NotesPage.tsx` (712 lignes) et `ExpenseTracker.tsx` (533 lignes) | Composants                |
| 33  | Ajouter `aria-label` et navigation clavier                                 | Tous                      |
| 34  | Tests unitaires avec Vitest + Testing Library                              | Nouveau                   |
| 35  | Drag-and-drop dans le Kanban                                               | `KanbanBoard.tsx`         |
| 36  | Vue annuelle des habitudes (heatmap GitHub-style)                          | `HabitTracker.tsx`        |
| 37  | Tags/dossiers pour les notes                                               | `NotesPage.tsx`           |
| 38  | Transcription audio → texte (Speech-to-Text)                               | `useVoiceRecorder.tsx`    |
| 39  | PWA complète avec service worker                                           | `vite.config.js`          |
| 40  | Internationalisation (i18n) — français/bambara/anglais                     | Nouveau                   |

---

## 🏆 VERDICT GLOBAL

| Catégorie              | Note /10 |
| ---------------------- | -------- |
| **Sécurité**           | ⚠️ 2/10  |
| **Architecture**       | 6/10     |
| **Fonctionnalités**    | 7/10     |
| **Design/UX**          | 8/10     |
| **Performances**       | 5/10     |
| **Qualité de code**    | 5/10     |
| **Test coverage**      | 1/10     |
| **Mobile (Capacitor)** | 6/10     |
| **Score global**       | **5/10** |

### En résumé, en tant que dev fullstack senior :

**Ce qui est impressionnant** : Le projet est ambitieux et riche en fonctionnalités pour un développeur solo. Le design est soigné, les animations sont fluides, l'intégration IA est bien pensée, et l'architecture générale montre une bonne compréhension de l'écosystème React/Firebase.

**Ce qui bloque pour la production** : Les failles de sécurité sont rédhibitoires. L'absence de tests, le TypeScript non exploité, et le stockage audio en base64 sont des bombes à retardement qui exploseront en production avec de vrais utilisateurs.

**Mon conseil** : Avant d'ajouter la moindre nouvelle fonctionnalité, passer 2-3 jours à :

1. Corriger les 5 problèmes de sécurité critiques
2. Ajouter les Firestore Security Rules
3. Migrer l'audio vers Firebase Storage
4. Typer le code correctement en TypeScript

Le potentiel est là. L'exécution doit juste rattraper la vision. 💪
