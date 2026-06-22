# She-Na — Project Analysis

This document is a static-structure analysis of the She-Na web app, produced by reading the
actual source files (not just file names) under `frontend/src`, plus `firestore.rules`,
`firestore.indexes.json`, and `frontend/package.json`. It is intended as an onboarding map for a
new contributor. Where something could not be fully confirmed from the code, that is stated
explicitly rather than guessed.

## 1. Overview

She-Na is a Firebase-backed, multi-lingual (Hebrew default/RTL, Arabic, English) support
platform — the branding, copy ("השנה", "She-Na", "מרחב בטוח" / "safe space"), and the focus on
appointments with therapists, support workshops, and a peer community strongly suggest a
women's health / cancer-support nonprofit. The codebase itself does not contain an explicit
mission statement, so this characterization is inferred from UI copy and domain modeling
(appointment types like therapy/yoga/massage/acupuncture/reflexology, a "Workshop Suggestion"
flow, community birthday/streak features, a join-request flow for prospective members) rather
than from a README.

The app serves three audiences through three "portals" that share one React app and one Firebase
project:

1. **Public** — an unauthenticated marketing site (home, donations, stories/articles,
   team/partners, accessibility statement) for visitors and prospective members.
2. **Participant** — the authenticated end-user experience: home dashboard, calendar,
   events/appointments booking, community feed, profile/settings.
3. **Admin** — a role-gated back-office dashboard: org dashboard, events management, appointments,
   CMS for the public site, user/role management, form submissions, community moderation,
   announcements ("updates"), and an append-only audit log.

There is no real backend service: `backend/` in the repo root is essentially empty (just a
`.gitignore`). All persistence, auth, and storage are handled client-side via the Firebase SDK
(Firestore, Firebase Auth, Firebase Storage), governed by `firestore.rules`.

## 2. Architecture overview

- **Stack**: Vite + React 18 + react-router-dom v6 + MUI 9 (`@mui/material`, `@mui/x-data-grid`,
  `@mui/x-date-pickers`) + Firebase 11 (Auth, Firestore, Storage) + Emotion (styling engine under
  MUI) + `stylis-plugin-rtl` for RTL CSS transformation + `date-fns` + `lucide-react` icons +
  `react-phone-input-2` + `@emailjs/browser`. Tests run on Vitest + `@testing-library/react`.
- **Entry point**: `frontend/src/main.jsx` mounts `App` (not read in depth in this pass, but it is
  the standard Vite/React `createRoot` bootstrap based on `App.jsx`'s export shape).
- **Routing** (`frontend/src/App.jsx`): a single `react-router-dom` `<Routes>` tree. All
  route-level page components are loaded via `lazy()`, with a shared `<Suspense fallback=
  {<RouteFallback>}>` (a centered `CircularProgress`). The code comments in `App.jsx` are explicit
  about *why*: route-level code-splitting means a first-time visitor on `/public` does not
  download the admin or participant bundles, and vice versa for a logged-in participant who never
  touches `/admin`.
- **Provider tree nesting order** (outermost to innermost), all assembled in `App.jsx`:
  1. `DirectionProvider` (`features/admin/context/DirectionContext`) — tracks app-wide RTL/LTR
     direction; wraps everything, including the theme, because the MUI theme itself is direction
     dependent.
  2. `ThemedApp` (local component) — calls `createAppTheme(direction)` and selects an Emotion
     cache: `cacheRtl` (with `stylis-plugin-rtl` + `prefixer`) vs `cacheLtr` (just `prefixer`),
     based on direction. Wrapped in `<CacheProvider>` → `<ThemeProvider>` → `<CssBaseline>`.
  3. `AccessibilityProvider` (`context/AccessibilityContext`) — global accessibility state; also
     mounts the always-present `<AccessibilityWidget />` here, outside the Suspense boundary, so it
     persists across route transitions.
  4. `AdminProvider` (`features/admin/context/AdminProvider`) — despite the "admin" naming, this is
     the **global auth/role provider** used everywhere (public, participant, admin). See §9.
  5. `<Suspense>` → `<Routes>` — the actual route tree.
- **Route guards**: `AuthenticatedRoute` (any signed-in user) wraps `/home`, `/calendar`,
  `/events`. `ProtectedRoute requiredRole="admin"` wraps the entire `/admin/*` subtree (mounted on
  `AdminLayout`, which renders nested routes via `<Outlet />`).
- **Notable redirects**: `/` renders `RoleRedirect`, which sends unauthenticated users to
  `/public` and authenticated users to `getPostLoginPath(userRole)` (`/admin` or `/home`).
  `/appointments` and `/admin/calendar` are dead routes that immediately `<Navigate>` elsewhere
  (to `/home`), suggesting a past consolidation of features into `ParticipantHome`'s tabs.
  `/admin/roles` redirects to `/admin/users?tab=roles` — role management was folded into the Users
  page as a tab rather than a separate route.
- **One component, three views**: `/home`, `/calendar`, and `/events` all render the same
  `ParticipantHome` component with a different `initialView` prop (`'home'`, `'calendar'`,
  `'events'`). `ParticipantHome` itself is a persistent shell (sidebar + header) that swaps its
  main content based on `activeView` state, kept in sync with the URL.

## 3. Folder tree (frontend/src), annotated

```
frontend/src/
├── App.jsx                      # All routing, provider tree, lazy route components
├── firebase.js                  # Firebase app/auth/db/storage/googleProvider init
├── theme.js                     # createAppTheme(direction) — canonical design tokens
├── global.css                   # Base resets + accessibility-mode CSS overrides
├── main.jsx                     # Vite/React entry
├── assets/                      # Images (logos, hero banners) incl. assets/images/
├── components/                  # Global shared components (not feature-scoped)
│   └── AccessibilityWidget.jsx (+ .test.jsx, strings)
├── context/
│   └── AccessibilityContext.jsx (+ .test.jsx)
├── i18n/
│   └── localizeField.js (+ .test.js)   # Top-level helper: resolve {he,en,ar} field by locale
├── shared/                       # Cross-cutting reusable UI (used by public + others)
│   ├── components/ PublicCtaButton.jsx, SidebarCollapseButton.jsx (+ css)
│   ├── i18n/ getLocalizedText.js
│   └── styles/ public-cta-button.css
├── test/                        # Vitest setup/helpers (not deeply inspected)
└── features/
    ├── admin/                   # Admin portal AND the global auth provider
    │   ├── components/ AdminLayout, Sidebar, AuthenticatedRoute, ProtectedRoute,
    │   │                ImpersonationBanner, AdminLanguageSwitcher, AdminDetailInfoCard
    │   ├── context/ AdminContext, AdminProvider, AdminLocaleContext, DirectionContext
    │   ├── i18n/ adminUiTranslations (+ .test.js)
    │   ├── pages/ DashboardPage, EventsPage, EventDetailPage, AppointmentsPage, CMSPage,
    │   │          UserManagementPage, FormsPage, AuditLogPage, CommunityModerationPage,
    │   │          UpdatesPage, LoginPage, RoleManagementPage, PartnersManagementPage,
    │   │          JoinRequestsTab, PublicHomePage*Tab (CMS editors for the public site),
    │   │          bookingsPageUtils.js (+ .test.js)
    │   └── services/ eventService, appointmentService, authRoleService, auditService,
    │                  communityModerationService, formSubmissionAdminService,
    │                  joinRequestAdminService, statsService, translationService,
    │                  updatesService, approvalEmailService, registrationService (+ tests)
    ├── appointments/             # Appointment type metadata + standalone booking UI
    │   ├── appointmentTypeMeta.js
    │   ├── components/ AppointmentBookingForm, AppointmentCard, AppointmentTypeSection,
    │   │                ProviderCard
    │   ├── pages/ AppointmentPage
    │   └── services/ appointmentService
    ├── calendar/                 # Calendar page (CURRENTLY BEING EDITED on this branch)
    │   ├── CalendarPage.jsx / .css
    │   ├── CalendarNoteModal.jsx
    │   └── calendarService.js    # Reads per-user Firestore subcollections (see §8)
    ├── events/                   # Events page (CURRENTLY BEING EDITED on this branch)
    │   ├── EventsPage.jsx / .css  # ~2,260 lines: workshops, appointments, registered tabs
    │   └── workshopSuggestionService.js
    ├── participant/              # The authenticated shell + sub-features
    │   ├── ParticipantHome.jsx / .css   # Shell: sidebar, header, view switch, notifications
    │   ├── NotificationsDropdown.jsx
    │   ├── WorkshopFeed.jsx
    │   ├── dashboardMockData.js  # Mock data file (see §13 — possible dead code)
    │   ├── components/ ParticipantHeader, ParticipantLanguageSwitcher,
    │   │                ParticipantSidebarProfile
    │   ├── context/ ParticipantLocaleContext.jsx
    │   ├── i18n/ participantLocale.js, participantUiTranslations.js (+ .test.js)
    │   ├── styles/ participant-theme.css, participant-dark-mode.css
    │   ├── utils/ participantProfileUtils.js
    │   ├── home/                 # Dashboard ("home" tab) feature
    │   │   ├── ParticipantDashboardHome.jsx / .css
    │   │   ├── BirthdayGreeting.jsx / .css, DailyInspiration.jsx
    │   │   ├── NotesScheduleModal.jsx
    │   │   ├── participantDashboardMockData.js   # A SECOND mock data file (see §13)
    │   │   ├── participantDashboardModel.js, participantDashboardService.js,
    │   │   │   useParticipantDashboardHomeData.js
    │   │   ├── participantNotesModel.js, participantNotesService.js, useParticipantNotes.js
    │   │   ├── dailyMotivationQuotes.js, dailyMotivationService.js, useDailyMotivation.js
    │   │   └── participantBirthdayUtils.js, useBirthdayToday.js
    │   └── community/            # Peer community feature
    │       ├── CommunityPage.jsx
    │       ├── components/ BirthdayCard, CommentComposer/Preview, CommunityAccessPanel,
    │       │   CommunityGuidelinesCard/Modal, CommunityBirthdayPreferenceCard,
    │       │   CommunityPostCard, CommunityStreakCard, CreatePostCard, DeletePostModal,
    │       │   EditPostModal, EmojiPicker, FeedTabs, PostActions, PostOverflowMenu,
    │       │   ReportPostModal, VoiceRecorderControls
    │       ├── hooks/ useCommunityComments, useCommunityFollows, useCommunityGuidelines,
    │       │   useCommunityPosts, useCommunityProfile, useCommunityReports,
    │       │   useCommunityStreak, useLatestCommunityPost
    │       ├── services/ communityService, communityStorageService
    │       ├── utils/ communityFeedUtils (+ .test.js), communityModerationUtils,
    │       │   communityDateUtils (+ .test.js)
    │       ├── constants/ communityConstants
    │       └── styles/ community.css
    ├── profile/                  # Settings / profile feature
    │   ├── components/ ChangePasswordCard, DarkModeToggle, PersonalDetailsForm, ProfileCard
    │   ├── pages/ ProfilePage, ForcePasswordChange
    │   ├── services/ participantService
    │   └── i18n/ profileSettingsTranslations (implied by feature-folder convention)
    └── public/                   # Marketing site
        ├── components/ HeroSection, AboutSection, StatisticsSection, SupportAreasSection
        │   (+Modal), MedicalPartnersSection(+Modal), EventsPreviewSection, EventPreviewCard,
        │   ArticlesPreviewSection, ArticleCard, InspirationStoriesSection, TeamSection
        │   variants, DonationSection(+Modal), JoinCommunityModal, LearnTogetherSection
        │   (+Modal), PublicNavbar, PublicFooter, PublicLanguageSwitcher,
        │   PublicSectionHeading, VolunteerModal, AnimatedCounter, LoadingState/
        │   EmptyState/ErrorState, SupportAreaCardImage, CommunitySupportCta
        ├── constants/ image maps, medicalPartners, pressArticles, teamMembers,
        │   publicDonationLink, supportAreaModalContent
        ├── context/ PublicLocaleContext
        ├── data/ teamSectionData
        ├── hooks/ useHorizontalCardCarousel, useInViewOnce, usePublicHomeScrollReset,
        │   useRevealOnScroll
        ├── i18n/ publicHomeContentLocales, publicHomeContentLocalization,
        │   publicHomeTranslations, publicHomeUiTranslations
        ├── pages/ PublicHomePage, PublicDonationsPage, PublicStoriesArticlesPage,
        │   PublicTeamPartnersPage, AccessibilityStatementPage
        ├── services/ formSubmissionService, joinRequestService, publicContentService,
        │   publicPagesService
        ├── styles/ many public-*.css incl. public-arabic-typography.css
        └── utils/ publicSectionScroll
```

## 4. Important files

| File | Why it matters |
|---|---|
| `frontend/src/App.jsx` | All routing, the full provider nesting order, and the RTL/LTR emotion cache split. Read this first. |
| `frontend/src/firebase.js` | Single source of Firebase init; exports `auth`, `db`, `storage`, `googleProvider`. Every service file imports `db`/`auth` from here. |
| `frontend/src/theme.js` | The only place brand colors/typography/MUI overrides are defined. Any new UI should reuse this, not invent new values. |
| `frontend/src/global.css` | Base resets plus a large, carefully commented block of accessibility-mode CSS (`a11y-high-contrast`, `a11y-grayscale`, etc.) that is applied app-wide via body classes. |
| `firestore.rules` | The de facto data-model and authorization spec — every collection's shape and access rule lives here since there's no backend. |
| `frontend/src/features/admin/context/AdminProvider.jsx` | The global auth/role/impersonation provider (auth state, `mustChangePassword`, impersonation). Everything authenticated depends on this. |
| `frontend/src/features/admin/services/authRoleService.js` | Defines how a Firebase user resolves to `'admin'` vs `'participant'`, and the post-login redirect logic (`getPostLoginPath`). |
| `frontend/src/features/admin/components/ProtectedRoute.jsx` / `AuthenticatedRoute.jsx` | The two route-guard patterns used throughout `App.jsx`. |
| `frontend/src/features/participant/ParticipantHome.jsx` | The persistent shell for all participant-facing views (home/calendar/events/community/profile) — one component driving four routes. |
| `frontend/src/features/events/EventsPage.jsx` | The largest, most logic-dense feature file (~2,260 lines): workshop/appointment/registered-session booking flows, calendar-grid date picking, provider/slot derivation from loosely-shaped event documents. |
| `frontend/src/features/calendar/calendarService.js` | Documents (in comments) the "Phase 2" data-migration from top-level collections to per-user Firestore subcollections — important data-model history. |
| `frontend/src/features/participant/community/CommunityPage.jsx` | Orchestrates ~8 custom hooks (posts, comments, follows, reports, streak, guidelines, profile) — the canonical example of the "hook-per-concern" pattern used in this feature. |
| `frontend/src/i18n/localizeField.js` | Small but load-bearing: resolves `{he, en, ar}` translation objects to a string everywhere admin-edited content is rendered. |

## 5. Key components & reusable patterns

- **Route guards**: `AuthenticatedRoute` (any signed-in user; redirects to `/login`, or to
  `/set-password` if `mustChangePassword`) vs `ProtectedRoute requiredRole="admin"` (redirects to
  `/login` if signed out, shows an in-place "Access Denied" panel with a "Go Back" button if
  signed in but not admin — it does not redirect to a different page in that case).
- **Modal/portal pattern**: Several large modals (`EventBookingModal`, `AppointmentBookingDrawer`,
  `WorkshopDetailsPanel`, `CalendarNoteModal`, the community `ReportPostModal`/`DeletePostModal`/
  `EditPostModal`) are rendered via `createPortal(modalContent, document.body)`, guarded by a
  `typeof document === 'undefined'` check for SSR/test safety, and typically pinned `dir="ltr"`
  internally regardless of app direction (booking UIs use fixed LTR layout even in RTL locales).
  A shared `useLockBodyScroll()` hook (defined locally in `EventsPage.jsx`) freezes
  `document.body`/`documentElement` overflow while a panel is open.
- **Card patterns**: Feature areas define their own card components rather than sharing one
  generic `Card` (`EventCard`, `AppointmentServiceCard`, `WorkshopListCard`,
  `RegisteredSessionCard`, `CommunityPostCard`, `EventPreviewCard`, `ArticleCard`). They are all
  plain `<article>` elements styled via feature-scoped CSS classes, not MUI `<Card>`.
- **Loading/empty/error states**: The `public` feature has dedicated, reusable
  `LoadingState`/`EmptyState`/`ErrorState` components. Other features (events, calendar) inline
  their own status banners (`events-status`, `calendar-status`) rather than reusing a shared
  component — see §13.
- **Locale switchers**: Each portal has its own switcher component
  (`AdminLanguageSwitcher`, `ParticipantLanguageSwitcher`, `PublicLanguageSwitcher`) paired with
  its own locale context — no shared switcher component despite functionally identical behavior.
- **Sidebar collapse**: `shared/components/SidebarCollapseButton.jsx` is a genuinely shared
  component, reused by both the admin `Sidebar.jsx` and the participant sidebar.
- **CTA button**: `shared/components/PublicCtaButton.jsx` is reused outside the public portal too
  (e.g. `LoginPage.jsx` uses it for the submit and "back to site" buttons), so "public" in the
  class names (`public-button`, `public-cta-scope`) is a styling-scope label, not a strict
  portal boundary.

## 6. Design system / theme

- **Source of truth**: `frontend/src/theme.js`, `createAppTheme(direction)`.
- **Colors**: primary pink `#DF327B` (light `#ED7AAB`, dark `#B0195A`), secondary purple `#6B3F97`
  (light `#936ABF`, dark `#452566`); semantic colors use fairly standard Tailwind-ish hexes
  (`error #ef4444`, `warning #f59e0b`, `info #3b82f6`, `success #10b981`); background
  `#F9FAFB`/paper `#FFFFFF`; text primary `#111827`, secondary `#4B5563`.
- **Typography**: `'Plus Jakarta Sans'` font family app-wide; heading weights are heavy (h1/h2
  weight 800, h3 700); `button` typography forces `textTransform: 'none'` (no automatic
  uppercasing of MUI buttons).
- **Shape**: global `borderRadius: 10` plus per-component radius overrides (Buttons 8px, DataGrid
  12px).
- **Component overrides**: `MuiButton` (custom padding + pink glow on hover for
  `containedPrimary`), `MuiCard` (subtle border + hover elevation transition), `MuiDrawer`
  (white paper, border instead of shadow), `MuiAppBar` (translucent + `backdropFilter: blur(16px)`
  "glassy" look), `MuiTextField` (defaults to `outlined`/`size: small` app-wide),
  `MuiOutlinedInput`, `MuiDataGrid` (custom header background, hover row tint), `MuiChip`,
  `MuiDialog` (no background image, custom shadow), `MuiListItemButton` (selected state = pink
  tint `rgba(223, 50, 123, 0.08)` text/icon in primary pink — this is the same selected-state
  styling visually echoed in admin `Sidebar.jsx`'s `NAV_ITEMS`), `MuiListItemIcon`,
  `MuiCssBaseline` (thin custom scrollbar styling).
- **RTL/LTR**: `direction` is a constructor parameter to `createAppTheme`; `App.jsx` pairs it with
  two distinct Emotion caches (`cacheRtl` using `stylis-plugin-rtl`, `cacheLtr` without) so MUI's
  CSS-in-JS output is physically mirrored for RTL locales. Several feature-internal panels
  (booking modals, calendar note modal) deliberately hardcode `dir="ltr"` even when the app is in
  RTL mode — confirmed by direct prop usage on multiple `<aside>`/`<div role="dialog">` elements
  in `EventsPage.jsx` and `CalendarNoteModal.jsx`.
- **Dark mode**: exists only for the participant area, implemented as a plain CSS file
  (`features/participant/styles/participant-dark-mode.css`) scoped under a single
  `.participant-home--dark` class toggle (not an MUI `palette.mode` switch) with its own CSS
  custom-property palette (`--pd-bg-dark`, `--pd-card-dark`, etc.). It is controlled by local
  `darkMode` state in `ParticipantHome.jsx`, not by the MUI theme or `AccessibilityContext`.
- **Hybrid styling approach confirmed**: the app consistently mixes plain, hand-written CSS files
  (one per feature/page, e.g. `EventsPage.css`, `CalendarPage.css`, `community.css`,
  `participant-theme.css`) imported directly into JSX, with MUI's `sx` prop and theme overrides
  used primarily inside admin pages (which lean more heavily on MUI components like `DataGrid`,
  `Dialog`, `Select`). Participant- and public-facing custom UI (cards, modals, buttons) is mostly
  hand-styled with BEM-ish class names (`events-card__title`, `community-feed-refresh__icon`)
  rather than MUI components.
- **Arabic-specific typography**: `features/public/styles/public-arabic-typography.css` exists
  as a dedicated stylesheet, implying Arabic rendering needed font/spacing treatment distinct from
  Hebrew RTL.

## 7. State management

There is no Redux/Zustand/Recoil — state is React Context + local component state + custom hooks
that wrap Firestore calls, consistently across the app:

- **Auth + role + impersonation**: `AdminContext`/`AdminProvider` (global, see §9) — exposes
  `currentUser`, `userRole`, `loading`, `mustChangePassword`, `effectiveUID`,
  `impersonatedUserUID`/`isImpersonating`, `startImpersonation`/`stopImpersonation`, `logout`,
  `clearMustChangePassword`.
- **Per-portal locale contexts** (no shared/unified i18n context — see §13):
  `AdminLocaleContext`, `ParticipantLocaleContext`, `PublicLocaleContext`. Each exposes roughly
  `{ locale, setLocale, direction, lang, t }`, but `ParticipantLocaleContext` is notably different:
  it does **not** own locale state itself — it receives `locale`/`setLocale` as props from
  `ParticipantHome` (which persists locale via `localStorage` and syncs it to the user's Firestore
  profile `language` field), and just derives `t`/`direction`/`lang` from the prop. The admin and
  public contexts likely own their own state directly (not verified line-by-line in this pass).
- **Direction**: a separate, app-wide `DirectionProvider` (`features/admin/context/
  DirectionContext`) sits above the theme and is consumed by `ThemedApp` — distinct from the
  per-portal locale contexts, and the one piece of locale-adjacent state that *is* shared globally.
- **Accessibility**: `AccessibilityContext` + `AccessibilityProvider`, mounted once globally above
  routing, paired with the always-visible `AccessibilityWidget`.
- **Per-feature data hooks**: the community feature is the clearest example of the
  "hook-per-concern" convention — `useCommunityPosts`, `useCommunityComments`,
  `useCommunityFollows`, `useCommunityReports`, `useCommunityStreak`, `useCommunityGuidelines`,
  `useCommunityProfile` each own one slice of Firestore-backed state and are composed together in
  `CommunityPage.jsx`. The participant dashboard home follows the same pattern
  (`useParticipantDashboardHomeData`, `useParticipantNotes`, `useDailyMotivation`,
  `useBirthdayToday`).
- **Local component state + Firestore round-trip**: `EventsPage.jsx` and `CalendarPage.jsx` do not
  use a data-fetching hook abstraction; they call service functions
  (`getPublishedEvents`, `getUserRegisteredEventIds`, `getCalendarData`, `createCalendarNote`)
  directly inside `useEffect`/handlers and manage `useState` arrays/maps themselves, including
  manual optimistic updates (e.g. the calendar note form inserts a `local-note-...` placeholder
  before the Firestore write resolves).

## 8. Firebase / data integrations

- **`frontend/src/firebase.js`** exports `auth` (Firebase Auth), `db` (Firestore), `storage`
  (Firebase Storage), and `googleProvider` (a `GoogleAuthProvider` instance). Config comes from
  `VITE_FIREBASE_*` env vars with hardcoded "demo" fallbacks (so the app boots without a real
  `.env` set, though Firebase calls would fail/no-op against a fake project).
- **Firestore collections** (inferred from `firestore.rules` + service files actually read; rule
  comments are taken as authoritative where present):
  - `users/{uid}` — top-level user doc holding PII (name, email, phone, address) and `role`.
    Readable by owner or admin only; a user cannot self-assign `role` on create or change it on
    update (`firestore.rules` enforces this explicitly) — this is the privilege-escalation guard
    that the whole RBAC model rests on.
    - Subcollections per the rules and `calendarService.js`'s own migration comment ("Phase 2"):
      `registrations/{eventId}` (owner + admin only for writes are admin-only, legacy fallback),
      `bookings/{bookingId}` (current booking model, with rule-enforced field-diff validation for
      participant self-service cancel/rebook), `appointments/{apptId}` (mirror of top-level
      `/appointments`), `calendar_notes/{noteId}` (personal notes, size-bounded by rule),
      `dashboard_notes/{noteId}`, `activity_notifications/{notificationId}` (auto-generated
      community engagement notifications).
  - `public_profiles/{uid}` — deliberately minimal, opt-in, community-visible mirror of
    `communityDisplayName`/`communityBirthday`/`showBirthdayInCommunity`, readable by any
    signed-in user, writable only by the owner and restricted to those exact fields — this is the
    rule-level mechanism that keeps PII out of the community UI.
  - `admins/{adminId}` — legacy admin lookup table, still consulted by `authRoleService.js` as a
    fallback role-resolution path (by uid and by email, case-sensitive and lowercased).
  - `audit_logs/{logId}` — append-only (`update`/`delete` are unconditionally `false` in rules);
    written via `logAuditEvent` (e.g. on `IMPERSONATE_START`).
  - `events/{eventId}` (+ `registrations/{rosterKey}` subcollection, an event-roster mirror used
    for admin aggregate reads) — admin-write, any signed-in user can read; `getPublishedEvents()`
    (used by `EventsPage.jsx`) presumably filters to `status: 'published'` (not directly read in
    this pass, but `eventAcceptsRegistrations()` in the rules checks `status == 'published'` and
    `registrationOpen != false`).
  - `bookings/{bookingId}` (flat, top-level — distinct from the per-user mirror) and
    `appointments/{appointmentId}` (flat) — used by admin-facing queries across all users.
  - `appt_settings/{docId}`, `therapists/{therapistId}` — admin-managed reference data for the
    appointments feature.
  - `cms_articles`, `cms_team`, `cms_org` (current) and `articles`, `team_profiles`, `org_info`
    (explicitly marked "legacy, backward-compat" in rules) — public-read, admin-write CMS content.
  - `homepage_statistics`, `support_areas`, `homepage_content`, `public_pages/{pageId}` — public
    site content, public-read/admin-write. `public_pages` is commented as the newer, consolidated
    per-page-document model ("each document is one page... with nested field groups per section").
  - `community_posts/{postId}` (+ `comments/{commentId}` subcollection) — the community feed;
    notably permissive update rule allows any signed-in non-author to mutate a fixed allowlist of
    engagement/aggregate fields (`likedBy`, `likesCount`, `supportedBy`, `supportCount`,
    `commentsCount`, `reportedBy`/`reportsCount`/`reports`, and `status` only to `'reported'`) —
    this is how likes/comments-count/report flows avoid needing a Cloud Function, at the cost of
    trusting the client to only touch those fields (enforced by `diff().affectedKeys().hasOnly(...)`).
  - `community_settings/{docId}` — community guidelines, etc.
  - `workshop_suggestions/{suggestionId}` — any signed-in user can create (see
    `workshopSuggestionService.js`), only admin can read/update/delete.
  - `joinRequests/{requestId}`, `formSubmissions/{submissionId}` — public, unauthenticated
    `create` allowed by design (forms on the marketing site), but constrained by rules to an exact
    field allowlist with size caps and pinned `status`/`source` values; rules explicitly flag that
    Firebase App Check should be added for real bot protection (not yet done, per the rule
    comment).
  - `updates/{updateId}` — admin-authored announcements, readable by any signed-in user.
  - `stats/{docId}` — `public_summary` (world-readable) vs `admin_summary` (admin-only); writes are
    admin-only by rule (app comment says clients bump them via batched writes alongside admin
    ops — i.e., no Cloud Function recomputes these).
  - `event_registrations`, `registrations` (top-level), `participants`, `calendar_notes`
    (top-level) — explicitly marked in rules as **legacy, read-only-during-migration** collections,
    kept only so a migration script can ingest them; direct client writes are denied.
  - `firestore.indexes.json` defines one composite index (`community_posts`: `status` ASC +
    `createdAt` DESC — supports the feed's filtered/sorted query) and one field override
    (`registrations.registeredAt` DESC, `COLLECTION_GROUP` scope — supports the admin
    `collectionGroup('registrations')` aggregate read mentioned in the rules' comment).
- **Storage**: `storage` is exported from `firebase.js` and a dedicated
  `communityStorageService.js` exists in the community feature (implying community post
  image/voice attachments are uploaded to Firebase Storage), but its contents were not read in
  this pass — flagged here as unconfirmed in depth.
- **Auth providers**: email/password (`signInWithEmailAndPassword`,
  `sendPasswordResetEmail`) and Google (`signInWithPopup` + `googleProvider`), both wired in
  `LoginPage.jsx`. `LoginPage.jsx` shows Hebrew-only error copy/UI text hardcoded inline (not
  routed through any locale `t()` function) — see §13.

## 9. Authentication & authorization flow

1. `AdminProvider` (mounted globally in `App.jsx`, **above** the route tree) subscribes to
   `onAuthStateChanged(auth, ...)`. On any auth change it sets `currentUser`, then (if a user is
   present) calls `resolveUserRole(user)` and separately reads `users/{uid}` to check
   `mustChangePassword`.
2. `resolveUserRole(user)` (`authRoleService.js`) checks, in order: (a) `users/{uid}.role` is
   `admin`/`super_admin` → `'admin'`; (b) `admins/{uid}` doc exists → `'admin'`; (c)
   `admins/{email}` or `admins/{email.toLowerCase()}` doc exists → `'admin'`; (d) a query for any
   `admins` doc with `email == <email>` (or lowercased) → `'admin'`; otherwise → `'participant'`.
   This is a layered fallback across **four** different admin-detection mechanisms, all converging
   on the same two output roles.
3. `LoginPage.jsx` handles email/password and Google sign-in. On success it resolves the role
   directly (independent of `AdminProvider`'s async listener) and calls
   `getPostLoginPath(role)` → `navigate(...)`. For a `'participant'` role it also calls
   `ensureParticipantProfile(user)`, which upserts `users/{uid}` with
   `{ email, displayName, role: 'participant', ...timestamps }` — but only if the existing doc
   (if any) is not already an admin role, so it can't downgrade an admin's role.
4. `getPostLoginPath(role)` (`authRoleService.js`) is the single source of truth for "where does
   this role land" — `'/admin'` for admin, `'/home'` otherwise — reused by both `LoginPage.jsx`
   and `RoleRedirect` in `App.jsx`.
5. **Route guards**: `AuthenticatedRoute` — while `AdminProvider.loading` is true, renders a
   centered spinner; if no `currentUser`, redirects to `/login`; if `mustChangePassword`, redirects
   to `/set-password`; otherwise renders children. `ProtectedRoute requiredRole="admin"` — same
   loading/redirect-to-login behavior, but if signed in and `userRole !== 'admin'`, renders an
   in-place "Access Denied" panel (does not redirect away) with a "Go Back" button
   (`window.history.back()`).
6. **Force password change**: members approved from a join request are given a temporary password
   and `mustChangePassword: true` on their `users/{uid}` doc (per `AdminProvider.jsx`'s comment).
   `AuthenticatedRoute` enforces the redirect to `/set-password`
   (`ForcePasswordChange` page, in `features/profile/pages/`) before any authenticated route is
   reachable; `clearMustChangePassword()` is exposed on the context for that page to call after a
   successful change (the call site itself was not read in this pass).
7. **Impersonation**: `AdminProvider` also exposes `effectiveUID` (= `impersonatedUserUID ??
   currentUser.uid`), used throughout the participant feature (e.g. `CalendarPage.jsx`,
   `ParticipantHome.jsx`) so an admin can view a participant's data under their own auth session.
   `startImpersonation`/`stopImpersonation` write an `IMPERSONATE_START` entry to `audit_logs` via
   `logAuditEvent`. `ImpersonationBanner.jsx` (rendered in `AdminLayout`) presumably surfaces this
   state in the UI (file itself not read in depth).
8. **Logout**: `AdminProvider.logout()` clears impersonation state and calls Firebase
   `signOut(auth)`; both the admin `Sidebar` and the participant sidebar call this same context
   method.

## 10. User roles

Two roles are actually used in client-side authorization logic, with a documented-but-unverified
third:

- **`participant`** — the default role; default value used in `ensureParticipantProfile`,
  `userRoleFromDoc` (Firestore rule default), and `resolveUserRole`'s fallback.
- **`admin`** — full back-office access; gates `/admin/*` via `ProtectedRoute`.
- **`super_admin`** — mentioned in two places: (1) the JSDoc comment atop
  `AdminContext.jsx` ("`userRole` – 'participant' | 'admin' | 'super_admin'"), and (2)
  `authRoleService.js`'s `ADMIN_ROLES = new Set(['admin', 'super_admin'])`, where it is treated as
  equivalent to `admin` for the purposes of `isAdminRole()`. No code path was found in this pass
  that actually *assigns* `super_admin` to a user (`UserManagementPage.jsx`'s `ROLES` constant only
  lists `['participant', 'volunteer', 'therapist', 'admin']` as assignable roles in the admin UI),
  so `super_admin` appears to be a reserved/planned value rather than one in active use. This
  should be verified against the live Firestore data if accuracy matters.
- **Sub-roles in the Users admin page**: `UserManagementPage.jsx` defines a broader role
  vocabulary for display/assignment purposes — `participant`, `volunteer`, `therapist`, `admin`
  (plus an `editor` label that exists in `ROLE_LABEL_KEYS`/`ROLE_STYLES` but not in the
  assignable `ROLES` array, i.e. it has UI styling defined but no current way to assign it from
  this list). Critically, **only `admin`/`super_admin` affect routing/authorization** — `volunteer`
  and `therapist` are informational/display roles only, as far as `authRoleService.js`'s
  `isAdminRole()` check is concerned; they do not unlock any extra routes or Firestore permissions
  beyond the base `participant` rules (Firestore rules only branch on `isAdmin()`, which checks
  for the literal string `'admin'` — note the Firestore rule's `isAdmin()` does **not** include
  `super_admin`, unlike the client-side `ADMIN_ROLES` set in `authRoleService.js`; this is a
  client/rules inconsistency worth flagging, see §13).

## 11. Admin flow vs Participant flow vs Public flow

**Admin flow**: Login (or already-authenticated admin hitting `/`) → `getPostLoginPath('admin')`
→ `/admin` → `ProtectedRoute` confirms `userRole === 'admin'` → `AdminLayout` (own
`AdminLocaleProvider`, a fixed/floating `Sidebar` with `NAV_ITEMS` for Dashboard, Events, Users,
Bookings, Forms, Public Home Page (CMS), Community (moderation), Updates, Audit Log, and a
Settings shortcut into the Users page's roles tab) → nested page via `<Outlet />`. Pages combine
MUI (`DataGrid`, `Dialog`, `Select`, etc.) with direct Firestore service calls per page (no shared
admin data-fetching hook layer was found; each admin page/service pairs independently, e.g.
`DashboardPage.jsx` calls `getAdminSummary`, `getAllEvents`, `getAllAppointments` directly in a
`useEffect`).

**Participant flow**: Login → `getPostLoginPath('participant')` → `/home` → `AuthenticatedRoute`
→ `ParticipantHome` (own locale state + `ParticipantLocaleProvider`, persistent sidebar/header
shell) renders one of: `ParticipantDashboardHome` (home), `CalendarPage` (embedded variant),
`EventsPage` (embedded variant), `CommunityPage`, or `ProfilePage`, switched by `activeView` state
that is kept in sync with both the `initialView` prop (set per-route in `App.jsx`) and
`location.state.eventsTab` (for deep-linking into a specific Events tab, e.g. from a
notification). Notifications (admin announcements + auto-generated community activity) are
polled every 60 seconds while the shell is mounted.

**Public flow**: Any visitor hitting `/`, `/public`, `/public/donations`,
`/public/stories-articles`, `/public/team-partners`, or `/accessibility` gets the marketing site —
no auth required, no `AdminProvider`-gated redirect (these routes are not wrapped in any route
guard). Content is read from public-read Firestore collections (`cms_*`, `public_pages`,
`homepage_*`, `support_areas`) so admins can edit it via the CMS pages without a deploy. Forms on
this site (`joinRequests`, `formSubmissions`) write directly to Firestore from an unauthenticated
client, constrained by the rule-level field/size allowlists described in §8.

## 12. Naming & coding conventions observed

- **Feature-folder structure**: most features under `features/<name>/` follow a consistent
  internal shape — `components/`, `context/`, `services/`, `i18n/`, `pages/` (admin/profile/public
  only), `hooks/` (community/public only), `utils/`, `styles/` or co-located `.css` files,
  `constants/` (community/public only). Not every feature has every folder — smaller features
  (`calendar`, `events`) keep everything flat at the feature root instead.
- **Service file naming**: `xService.js` (or `xAdminService.js` for admin-only variants of the
  same domain, e.g. `formSubmissionService.js` vs `formSubmissionAdminService.js`,
  `joinRequestService.js` vs `joinRequestAdminService.js`) — a recurring pattern of a public-facing
  write-only service paired with an admin read/manage service for the same collection.
  Functions are plain async exports (no class wrappers), e.g. `getPublishedEvents()`,
  `addRegistration()`, `getCalendarData()`, `createCalendarNote()`.
  - `services/registrationService.js` is the one exception that lives under
    `features/admin/services/` but is imported and used by the **participant**-facing
    `EventsPage.jsx` (`addRegistration`, `getUserRegisteredEventIds`, `removeRegistration`) — i.e.
    not all "admin" folder service files are admin-only in practice, mirroring the
    `AdminContext`/`AdminProvider` naming situation (see §13).
- **Hook naming**: `useXxx.js`, one file per hook, one concern per hook
  (`useCommunityPosts`, `useCommunityStreak`, `useDailyMotivation`, `useParticipantNotes`,
  `useBirthdayToday`, `useInViewOnce`, `useHorizontalCardCarousel`). Hooks that need shared state
  across calls (e.g. `useCommunityStreak`, used both in `ParticipantHome.jsx` for a top-level
  effect and again inside `CommunityPage.jsx` for its return values) are called multiple times
  with the same params rather than being centralized in one provider.
- **Test files**: colocated `*.test.js` / `*.test.jsx` next to the file under test (not in a
  separate `__tests__/` tree), confirmed across `components/`, `context/`, `features/admin/`,
  `features/participant/`, and `i18n/`. Coverage is uneven — most service/page files have no test
  file; the ones that do (`registrationService.test.js`, `translationService.test.js`,
  `bookingsPageUtils.test.js`, `communityFeedUtils.test.js`, `communityDateUtils.test.js`,
  `adminUiTranslations.test.js`, `participantUiTranslations.test.js`, `localizeField.test.js`,
  `AccessibilityWidget.test.jsx`, `AccessibilityContext.test.jsx`) tend to be pure-logic/utility
  modules rather than full component or integration tests.
- **CSS naming**: BEM-ish double-underscore/double-hyphen class names scoped per feature
  (`events-card__title`, `participant-home--dark`, `community-feed-refresh__icon`), one `.css`
  file per page/major component, imported directly into the corresponding `.jsx` file.
- **Localization object shape**: admin-edited multi-language content is consistently stored and
  read as `{ he: '...', en: '...', ar: '...' }` objects, resolved via `localizeField(value,
  locale)` — confirmed in `EventsPage.jsx` (`event.translations?.title`, etc.) and documented in
  `i18n/localizeField.js`'s own header comment.
- **Translation function convention**: every locale context exposes a `t(key)` function from a
  per-feature `createXxxT(locale)` factory (`createAdminT`, `createParticipantT`) that returns a
  lookup function — not a key/value object accessed directly, and not a third-party i18n library
  (no `react-i18next`/`i18next` in `package.json`).

## 13. Potential issues / inconsistencies

These are things actually observed in the code, not speculation:

1. **No unified i18n system — three independent locale stacks.** `AdminLocaleContext`,
   `ParticipantLocaleContext`, and `PublicLocaleContext` each have their own translation
   dictionary (`adminUiTranslations`, `participantUiTranslations`, `publicHomeUiTranslations`) and
   their own `createXxxT(locale)` factory, with no shared base. This is a deliberate pattern (each
   portal owns its own UI copy) but it means a string used in more than one portal (e.g. "Logout",
   which appears in both the admin `Sidebar` and the participant sidebar via separate `t('logout')`
   calls against two different dictionaries) must be translated and maintained twice, with no
   compile-time guarantee the two stay consistent. `ParticipantLocaleContext` additionally behaves
   differently from the other two (it doesn't own state, it receives `locale`/`setLocale` as
   props) — a subtle asymmetry a new contributor could easily miss when extending one context by
   copying the pattern of another.

2. **"Admin" naming applied to global, non-admin-specific infrastructure.** `AdminContext` /
   `AdminProvider` (in `features/admin/context/`) is the single global auth/role provider used by
   every portal, not just `/admin/*` — confirmed by its use in `ParticipantHome.jsx`,
   `CalendarPage.jsx`, `EventsPage.jsx`, and `LoginPage.jsx`. Likewise,
   `features/admin/services/registrationService.js` and `features/admin/services/
   authRoleService.js` are imported directly by participant-facing components. A new contributor
   reading folder names alone would reasonably assume `features/admin/*` is admin-portal-only and
   miss that it's actually shared/global infrastructure with a misleading location. The
   `DirectionContext` lives in the same `features/admin/context/` folder for the same reason and
   has the identical naming problem.

3. **Mock data files left in the participant feature, and duplicated.** Two separate mock-data
   files exist: `frontend/src/features/participant/dashboardMockData.js` (feature root) and
   `frontend/src/features/participant/home/participantDashboardMockData.js` (home subfolder) —
   similar names, different locations, and (based on the naming) likely overlapping purposes. It
   was not verified in this pass whether either file is still imported anywhere or is fully dead
   code; either way, having two similarly-named mock-data modules in the same feature is a
   duplication/cleanup risk for future contributors trying to find "the" mock data source.

4. **Role model inconsistency between client code and Firestore rules.** `authRoleService.js`
   defines `ADMIN_ROLES = new Set(['admin', 'super_admin'])` and treats both as admin
   client-side, and `AdminContext.jsx`'s own doc comment lists `super_admin` as a valid
   `userRole` value. However, `firestore.rules`' `isAdmin()` helper checks only
   `getUserRole() == 'admin'` — a user with `role: 'super_admin'` in their `users/{uid}` doc would
   be treated as admin by the React app's routing/UI but would **fail every Firestore security
   rule that gates on `isAdmin()`** (i.e., they could reach `/admin` pages in the UI but most of
   their reads/writes would be rejected server-side). Since no UI path was found that actually
   assigns `super_admin` (see §10), this may currently be latent/unreachable, but it is a real
   inconsistency between the two authorization layers that would surface immediately if that role
   were ever assigned.

5. **Hardcoded, non-localized UI strings in `LoginPage.jsx`.** Despite the app's broader
   per-portal `t()` translation convention, `LoginPage.jsx` contains Hebrew strings written
   directly inline (e.g. `'הזיני את כתובת האימייל כדי לאפס את הסיסמה.'`, all `auth/*` error
   messages, button labels like `'התחברי'`/`'המשיכי עם Google'`) rather than routed through any
   locale context or translation dictionary. This is the one major authentication-adjacent screen
   in the app that does not appear to support English/Arabic, unlike every other portal entry
   point.

6. **Per-route service duplication across `appointments` feature and `events`/`admin`.** There
   are two `appointmentService.js` files — one under `features/appointments/services/` and one
   under `features/admin/services/` — both imported by `DashboardPage.jsx` for the latter case
   (`getAllAppointments`). Whether the two files implement genuinely different concerns (e.g.
   admin aggregate queries vs. participant-facing booking) or substantially overlapping logic
   was not verified line-by-line in this pass, but the duplicate naming across two feature folders
   is the same pattern flagged in items 3 and 6 — worth a closer look before adding new
   appointment logic, to avoid a third copy.

7. **Loading/empty/error state components exist but are not consistently reused.** The `public`
   feature has dedicated `LoadingState`/`EmptyState`/`ErrorState` components, but `EventsPage.jsx`
   and `CalendarPage.jsx` each implement their own inline status banners (`events-status`,
   `calendar-status`) with separate markup/CSS instead of reusing (or even being aware of) the
   shared components — so the "shared state components" pattern exists in the codebase but isn't
   actually shared across portals.

## Notes on scope / unverified items

- `backend/` was confirmed to be effectively empty (per the task's existing context) and was not
  re-inspected in this pass.
- `frontend/src/main.jsx` was not opened directly; its role is inferred from `App.jsx`'s default
  export and standard Vite/React conventions.
- `communityStorageService.js`, `ImpersonationBanner.jsx`, `RoleManagementPage.jsx`,
  `PartnersManagementPage.jsx`, and most of the `features/public/components/` and
  `features/appointments/` files were not opened in this pass; folder/file names are taken from
  the directory listing only and are not independently verified beyond what's stated above.
- The nonprofit's specific mission/cause (e.g. whether it is cancer-specific vs. broader women's
  health) is inferred from UI copy and domain modeling, not from an explicit mission statement
  found in the code.
