# AfroMovieDB: Multi-Status Movie Tracking, Personalized Recommendations, Historical Cinema Archive & Deep Links

A unified architectural plan for:
1. **Multi-Status Movie Tracking System**: Replacing binary watchlists with 5 distinct tracking states (*Plan to Watch*, *Currently Watching*, *Completed*, *On Hold*, *Dropped*) and interactive status pickers on `MovieCard` and `MovieDetailModal`.
2. **Profile Tabs & Rewatch Counter**: Dedicated status filter tabs on the User Profile page, an interactive rewatch counter (`+` / `-`) for completed films, and real-time Firestore sync (`/users/{userId}`).
3. **Personalized 'Recommended For You' Engine**: User profile affinity algorithm analyzing watched/tracked genres, directors, and lead actors to curate smart recommendations with affinity badges.
4. **Secure API Keys & Settings**: User-managed TMDb API key stored in Firestore, dynamically prioritized across all external TMDb fetches.
5. **Shareable Movie Deep Links (`?movie=<id>`)**: Instant URL query param resolution on launch with automatic modal opening, history sync, and copy-link triggers.
6. **Multi-Decade Historical Archive Sweep & Strict Deduplication**: 5-decade sweep (1980s–2020s) with clean floating telemetry (internal page counts hidden per feedback) and strict numeric TMDb + normalized-title deduplication.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural updates integrate all confirmed user specifications and new requirements:

- **Tracking States**:
  - `plan_to_watch`: "Plan to Watch" (default when adding from catalogue)
  - `watching`: "Currently Watching"
  - `completed`: "Completed" (unlocks the rewatch counter)
  - `on_hold`: "On Hold"
  - `dropped`: "Dropped"
  - Seamless migration: existing legacy `watchlist: string[]` IDs are preserved and mapped to `plan_to_watch` by default.
- **Rewatch Counter**:
  - Displayed exclusively on films marked as `completed`.
  - Increments with a single click (`+1 Rewatch`), decrements (`-`), and displays a badge: e.g., *"Rewatched 3x"*.
  - Synchronized instantly to Firestore under the user's tracked movie records.
- **Personalized Recommendations Engine**:
  - Calculates affinity weights based on user's tracked titles:
    - Genre affinity (e.g., +3 weight for each completed/watching title with that genre)
    - Director affinity (e.g., +5 weight for films by beloved directors like Kunle Afolayan, Editi Effiong)
    - Lead cast affinity (e.g., +4 weight for favorite actors like Richard Mofe-Damijo, Bimbo Ademoye)
  - Scans untracked movies from the catalogue and highlights the exact affinity reason (e.g. *"Because you love Crime & Thrillers starring Richard Mofe-Damijo"*).
- **Clean Sweep Telemetry (Confirmed User Feedback)**:
  - Internal page counts (`Page 2/5`) are hidden from the floating status pill. Only the era name and classic films added counter are displayed.
- **Firestore Security & Private API Keys**:
  - `users/{userId}` security rule: `allow read, write: if request.auth != null && request.auth.uid == userId;` ensures user tracking lists, rewatch counts, and private TMDb keys are fully isolated.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Comprehensive Movie Tracking**: Users can organize their African cinema journey into 5 distinct lifecycle states via a modern dropdown/popover menu on movie cards and detail modals.
  2. **Rewatch Journaling**: Film fans can record multiple viewings of their favorite Nollywood classics with instant counter updates.
  3. **Affinity-Based Recommendations**: In the user profile, a dedicated "Recommended For You" section analyzes the user's tastes and presents untracked Nollywood films with personalized explanations.
  4. **Custom API Keys**: Users can supply their personal TMDb API key to bypass default quota limits.
  5. **Direct Link Sharing**: Any film modal generates a direct link (`?movie=<id>`) that recipients can open to instantly inspect the movie.
  6. **Historical Archive Sweeper**: Rapidly pulls classic Nollywood gems from the 1980s through 2020s with strict deduplication.

- **Target Audience / Persona**:
  African cinema cinephiles, casual Nollywood viewers, diaspora communities, and film researchers curating viewing histories.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Movie Card & Modal Status Selection**:
   - On any `MovieCard` or within `MovieDetailModal`, the former binary "Bookmark" button is enhanced into an interactive **Tracking Status Selector**.
   - Clicking opens a stylish popover with status choices:
     - 🔖 **Plan to Watch** (Amber)
     - 👁️ **Currently Watching** (Sky Blue)
     - ✅ **Completed** (Emerald)
     - ⏸️ **On Hold** (Violet)
     - 🚫 **Dropped** (Rose)
     - 🗑️ **Remove from Tracking**
   - Active status is indicated with a subtle icon and badge on the card poster.

2. **User Profile Tracking Tabs & Rewatch Counter**:
   - Profile navigation features dedicated filter tabs with item count pills:
     `[All (24)]` `[Plan to Watch (10)]` `[Watching (3)]` `[Completed (8)]` `[On Hold (2)]` `[Dropped (1)]` `[Recommendations]` `[Reviews]` `[API Keys]`
   - When viewing `Completed` films, each card displays an interactive rewatch stepper:
     ```
     ┌─────────────────────────────────────────────────────────┐
     │ Aníkúlápó (2022) • Completed                            │
     │ 🔁 Rewatched: [ - ]  2 times  [ + ]                     │
     └─────────────────────────────────────────────────────────┘
     ```
   - Changing status or adjusting rewatches commits to Firestore immediately with zero lag.

3. **Personalized 'Recommended For You' Row**:
   - Positioned prominently in the User Profile (and accessible as a dedicated tab).
   - Shows a horizontal scroll/grid of films tailored to the user's viewing history.
   - Each card displays an **Affinity Tag**:
     - *"Because you loved Action directed by Kemi Adetiba"*
     - *"Top match for Yoruba-language Historical Epics"*
   - Quick one-click action: **"+ Plan to Watch"** adds it straight to their list.

4. **API Keys & Settings**:
   - Masked input with reveal toggle, "Test Connection" button, and "Save to Firestore" confirmation.

5. **Deep Link Sharing**:
   - Clicking "Share" on any movie modal copies `https://.../?movie=<id>` and shows "Copied Direct Link!".
   - Opening that link immediately triggers the movie modal on page load.

6. **Historical Sweep & Clean Floating Pill**:
   - Triggering a sweep renders a floating corner pill:
     `◉ Scanning 1990s Era • 18 Classic Films Added [✕]`
     (with internal page numbers completely hidden).

---

## 3. Key Product Decisions & Trade-Offs

- **Tracking Data Model**:
  - *Decision*: Store tracking items in `users/{userId}` under a `trackingList` array of objects:
    ```typescript
    export type MovieWatchStatus = 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';

    export interface UserTrackedItem {
      movieId: string;
      status: MovieWatchStatus;
      rewatchCount: number;
      updatedAt: string;
    }
    ```
  - *Backwards Compatibility*: If a user document contains the legacy `watchlist: string[]`, the app auto-converts those IDs to `{ movieId, status: 'plan_to_watch', rewatchCount: 0 }`.
  - *Why*: Centralized in the user's private document (`/users/{userId}`), reducing Firestore read operations to 1 document read instead of a collection query, keeping quota minimal.

- **Recommendation Scoring Algorithm**:
  - Computes user taste vectors across:
    - Genre weights: +3 per watched/completed film, +1 per planned film
    - Director weights: +5 per watched/completed film
    - Lead actor weights: +4 per watched/completed film
  - Scores untracked catalog movies:
    `Score = (matchingGenres * 3) + (matchingDirector * 5) + (matchingActors * 4) + (movie.rating * 0.5)`
  - Ranks highest-scoring untracked titles and generates an explainable affinity sentence.

- **Strict Deduplication**:
  - Two-pass check: (1) Numeric TMDb ID match, (2) Normalized alphanumeric title match (stripping accents, punctuation, and common film suffixes).

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ AfroMovieDB System Architecture                                              │
│                                                                              │
│  ┌───────────────────────────┐         ┌──────────────────────────────────┐  │
│  │ URL Deep Link Listener    │         │ UserProfilePage                  │  │
│  │ ?movie=<id> ──► Modal     │         │ ├─ Status Tabs (Plan, Watched...)│  │
│  └───────────────────────────┘         │ ├─ Rewatch Stepper (+ / -)       │  │
│                                        │ ├─ Recommended For You Engine    │  │
│  ┌───────────────────────────┐         │ └─ API Keys & Settings           │  │
│  │ MovieCard / MovieDetail   │         └─────────────────┬────────────────┘  │
│  │ Status Dropdown Selector  │                           │                   │
│  └─────────────┬─────────────┘                           │                   │
│                │                                         │                   │
│                ▼                                         ▼                   │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Firestore Service (users/{userId})                                     │  │
│  │ - trackingList: UserTrackedItem[]                                      │  │
│  │ - customTmdbApiKey: string                                             │  │
│  │ - Security: allow read, write: if request.auth.uid == userId;          │  │
│  └─────────────────────────────┬──────────────────────────────────────────┘  │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ api.ts: Prioritized TMDb Engine & Historical Sweeper                  │  │
│  │ - getActiveTmdbApiKey() ──► customTmdbApiKey || defaultApiKey         │  │
│  │ - runDeepHistoricalSweep() ──► 1980s-2020s (clean telemetry)           │  │
│  │ - Strict Deduplication (tmdbId + normalizeTitle)                       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Schema & Rule Specifications

1. **`firebase-blueprint.json`**:
   Update `UserProfile` entity to include:
   - `trackingList`: `array` (List of `{ movieId, status, rewatchCount, updatedAt }`)
   - `customTmdbApiKey`: `string`
   - `updatedAt`: `string`

2. **`firestore.rules`**:
   ```javascript
   match /users/{userId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

3. **`src/types.ts`**:
   ```typescript
   export type MovieWatchStatus = 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';

   export interface UserTrackedItem {
     movieId: string;
     status: MovieWatchStatus;
     rewatchCount: number;
     updatedAt: string;
   }
   ```

4. **Recommendation Engine**:
   Implemented as a pure helper `getPersonalizedRecommendations(userTracking: UserTrackedItem[], allMovies: Movie[]): RecommendationItem[]` returning ranked movies with explanation strings.
