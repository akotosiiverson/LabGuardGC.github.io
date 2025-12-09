# AI coding agent guide for Computer-Labsystem-Labguard-V3

- Big picture
  - Static web app (no bundler) with two shells: faculty (`structure.html` + `backend/**`) and admin (`ADMIN/structure-admin-iverson.html` + `ADMIN/backend/**`). Pages are plain HTML + ES modules imported from Firebase CDNs.
  - Data lives in Firestore; files in Firebase Storage. Auth via Firebase Email/Password and Google. Admin role is a custom claim checked client-side.
  - Cloud Functions folder exists but is mostly unused scaffolding (`functions/index.js`). Admin tasks like setting custom claims are run as local Node scripts with Admin SDK (`ADMIN/backend/setAdmin.js`, `functions/setAdmin.js`).

- Where things are
  - Faculty JS: `backend/` (e.g., `report-dashboard-faculty.js`, `request-status-dashboard-faculty.js`, `firebase-config.js`). Admin JS: `ADMIN/backend/` (e.g., `report-dashboard-faculty-admin-iverson.js`, `firebase-config-admin-iverson.js`). Shared UI utilities: `backend/backend.js`, `backend/logout.js`.
  - Data model (collections and key fields used in code):
    - `reportItem` (catalog shown on dashboards): `{ name, image, createdAt }`.
    - `reportList` (issue reports): `{ equipment, issue, pc, room, statusReport, imageUrl?, date|timestamp, fullName?, userId? }`.
    - `borrowList` (borrow requests): `{ equipment, borrowDate, returnDate, purpose, statusReport, downloadURL, timestamp, fullName?, userId? }`.
    - `users` (profile overlay): `{ fullName }` looked up by `uid`.
    - Optional/experimental: `rooms`, `comlabrooms` with per-PC subcollections (see comments in `ADMIN/backend/firebase-config-admin-iverson.js`).

- Firebase usage patterns (follow these):
  - Always guard app init to prevent duplicate initialization: `const app = getApps().length ? getApps()[0] : initializeApp(config);` (see `backend/firebase-config.js`, `backend/update.js`).
  - Import Firebase v10+ modular SDKs from CDN by URL, not npm. Keep modules as `type="module"` scripts.
  - Use `serverTimestamp()` for write times; some reads expect `data.date?.toDate()` (see `request-status-dashboard-faculty.js`). Prefer consistent `date` or `timestamp` naming.
  - Realtime reads use `onSnapshot(query(...))`; user filtering is client-side via `where('userId','==', currentUserId)`.
  - File uploads: upload to Storage with `uploadBytes` then resolve via `getDownloadURL` (see `backend/firebase-config.js`). Ensure CORS is set for local dev (see `cors.json`).

- Auth and roles
  - Sign-in: Email/password in `index.html` and Google in `backend/main.js`. After login, redirect based on custom claim `admin` to admin vs. faculty shell.
  - Admin firewall: `ADMIN/backend/adminFirewall.js` checks `getIdTokenResult().claims.admin` and redirects away if missing.
  - To grant admin: run a Node script with Admin SDK and a service account JSON to set custom claims (UIDs are hardcoded). Files: `ADMIN/backend/setAdmin.js`, `functions/setAdmin.js`.

- Local development workflow
  - Serve HTML via a static server (e.g., VS Code Live Server). Ports 5505/127.0.0.1 are whitelisted in `cors.json` for Storage; apply to your bucket via gsutil if needed.
  - Functions emulator exists (`functions/package.json` has `serve`, `lint`, `deploy`), but app code does not call Cloud Functions by default.
  - Node engine pinned to 22 for functions. Lint before deploy runs via `firebase.json` predeploy.

- UI and code conventions
  - Pages dynamically inject modals and forms into the DOM (e.g., `details-modal`, `.container`) and re-enable buttons/scroll on close. Mirror this pattern when adding dialogs.
  - Admin and faculty often have parallel features; when adding a feature, update both sides if applicable and keep data shapes identical.
  - Keep redirects consistent and relative to the shell (`structure.html` vs `ADMIN/structure-admin-iverson.html`).

- Examples to follow
  - Listing items: `backend/report-dashboard-faculty.js` → `displayItems()` pulls `reportItem`, sorts with "OTHERS" last, renders cards, binds click to open a form.
  - Submitting a report: see `backend/reportForm.js` function `printYourrequestInfo()`; it validates inputs, gets `fullName` from `users/{uid}` if present, then calls `addReport(...)` from `backend/firebase-config.js`.
  - Viewing status: `backend/request-status-dashboard-faculty.js` queries `reportList` filtered by `userId`, applies date/status filters, and builds a `details-modal` with image fallback.

- Security and secrets
  - Do not expose or paste service account contents in code or comments. Client-side config (apiKey etc.) is already public by design.

If any of the above is ambiguous (e.g., precise Firestore field names you plan to use, or where to wire a new page), ask for that specific context and mirror the closest existing file as a starting point.