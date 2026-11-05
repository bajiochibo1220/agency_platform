# Verification record — 5 November 2026


## Four-character passwords and origin parsing - 5 November 2026

At the owner's explicit request, initial administrator registration, CLI creation and protected user creation/password changes now accept passwords of at least four characters (maximum 200), with no letter/digit/symbol composition rule. Letters-only and digits-only passwords are accepted. Frontend minimum lengths, confirmation and account labels match; password hashing and login throttling remain in place. The private `ADMIN_SETUP_KEY` still requires at least 32 characters and is separate from the admin password.

The latest live check found `/api/auth/setup` available (200) but an empty login POST from `https://agency-platform-navy.vercel.app` still returned 403 `Untrusted origin`, before any password validation. Render must include that exact website origin in `ALLOWED_ORIGINS`. The parser now normalizes copied quotes, whitespace, trailing slashes, hostname case and default ports while rejecting wildcard domains, URL paths and credentials. It does not automatically trust Vercel domains or remove origin protection.

Verification: **44 backend tests and all 16 browser workflows passed**, as did the production build, TypeScript and targeted formatting checks. Coverage includes four-character letters-only and digits-only owner passwords, short-password rejection, protected account password changes, normalized/unsafe origins and browser registration/login. Evidence: `test-results/browser-results.json`. Tests use disposable data; the browser runner uses a random four-character test password to exercise the new minimum. No hosted environment, credentials or account records were changed. Both backend and frontend need redeployment for this change to reach the live website.


## Hosted admin sign-in diagnosis and controlled recovery - 5 November 2026

Verified the supplied Vercel website using health/setup GET requests and an empty login POST (no credential guess or account write). Health returned 200; setup returned 404; login with the website's Origin returned plain-text 403 `Untrusted origin`. The backend deployment needs updating and Render's allowed origins need the actual website URL. No live accounts, credentials or environment variables were changed.

The HTTP client now explains non-JSON 403/404/5xx responses, preserves useful JSON validation messages, and handles unexpected error-detail shapes. Registration-check failures appear in the form instead of being swallowed. Available first-owner setup opens directly in registration mode. Added a trusted-shell-only `reset-admin-setup --confirm-reset` command to remove all login accounts/sessions, reopen owner setup and retain website content/messages plus audit history. It requires a configured private setup key. No public reset endpoint was added.

Verification: six mocked API-client error checks passed; production build and TypeScript passed. **All 34 backend tests and 16 browser workflows passed**, including recovery, old-session rejection, preserved content, CLI guards, visible deployment errors and first-owner setup. Tests used disposable databases and mock error responses. Formatting checks passed. Evidence: `test-results/browser-results.json`. See [hosted recovery steps](OPERATIONS.md#recovering-the-first-owner-registration-on-the-hosted-website) for the necessary Render and Vercel actions. Live recovery remains pending.


## Softer public backgrounds - 5 November 2026

Replaced the public site's large white surfaces with a muted sage canvas (`#e8eee9`), off-white green panels (`#f1f4ef`) and deeper green-grey section backgrounds (`#dde7df`). Updated header, mobile menu, capability highlights, service cards, enquiry forms and form fields consistently. Secondary text is darker (`#46564b`) and borders use `#cbd7ce` for definition. Existing green/red branding and the dark photo hero/footer are preserved. This is a visual comfort preference, not a medical protection claim.

Verification: targeted CSS formatting and source checks passed. Calculated secondary-text contrast on the three new surfaces is 6.62:1, 7.03:1 and 6.15:1 respectively. No application logic or layout dimensions changed. Earlier build/browser results below belong to their recorded versions. Changes are local and have not been deployed.


## One-time administrator registration - 5 November 2026

Added a first-owner form to `/admin`, visible only when the backend has a private `ADMIN_SETUP_KEY` of at least 32 characters and setup is still open. The form collects name, email, password, confirmation and the private key. Successful registration returns to sign-in. Visitors continue to send enquiries without accounts.

The backend validates the private key, rate limits setup attempts, uses existing origin/header protections, and hashes the password with scrypt. A fixed database primary key claims setup atomically with the owner account and audit record; it prevents concurrent registrations and stays closed after account deletion or key changes. Migration 002 adds the completion table and closes setup for existing installations. The CLI shares the same claim helper. Staff provisioning stays behind the existing super-admin permissions.

Backend verification: **32 tests passed** using disposable SQLite databases, including simultaneous claims, permanent closure, existing accounts, invalid/missing keys, validation, rate limits, login and migration upgrade/backfill/downgrade. **Next.js production build and TypeScript passed. All 15 browser workflows passed**, including first-owner registration at mobile width, password confirmation, closure after reload, sign-in, visitor enquiries, existing administrative workflows and responsive layouts. No browser runtime or HTTP 5xx errors were captured. Evidence: `test-results/browser-results.json`; tests used a unique disposable database and random temporary setup key, never application credentials. No live database migration, provider change or deployment was performed. Owner setup and deployed acceptance remain pending. Configuration and deployment steps are in [OPERATIONS.md](OPERATIONS.md#first-administrator-registration).

## ICT Authority-inspired public redesign - 5 November 2026

The user's visual request supersedes the earlier public background and mint styling entries below. Reference: https://icta.go.ke/ and the supplied screenshot. The public site now uses a green (`#008b3d`) utility bar, white navigation with a red active underline, red (`#ed0000`) action buttons, a full-width photographic hero with three manually selectable slides, five linked capability highlights, white content cards, and a dark footer. The agency's editable identity, services, portfolio, enquiry flows and protected administration remain connected to their existing routes. No government branding, statistics or claims were copied.

The carousel supports previous/next, direct slide selection, focus outlines, announced content changes and reduced motion. It does not move automatically. The utility bar displays configured contact details, and the existing WhatsApp link uses the new green chat styling when a number is configured. The design applies across public pages; the operational dashboard retains its own styles.

The hero photograph is locally served from `frontend/public/agency-collaboration.jpg`. It is illustrative stock imagery, not a claim about the agency's actual team. Source: [Unsplash collaboration photograph](https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=85), downloaded on 5 November 2026. No image service is required at runtime.

Verification: Next.js production build and its TypeScript check passed. The isolated browser build also passed with `BACKEND_URL=http://127.0.0.1:8192` and `NEXT_DIST_DIR=.next-browser`. Browser checks use `AGENCY_TEST_WEB_PORT=3192`, `AGENCY_TEST_API_PORT=8192`, and `NEXT_DIST_DIR=.next-browser`, avoiding the occupied normal preview port. An initial browser run revealed a build-time API rewrite mismatch; the harness now rejects mismatched rewrites before starting servers or sending test requests. **All 14 production browser workflows passed**, with zero captured browser runtime or HTTP 5xx errors. This includes palette checks, carousel selection/wrapping, all public routes, enquiries, authentication, content editing, quotations, media and responsive public layouts at 1440, 768, 390, 360 and 320 pixels. Final evidence: `test-results/browser-results.json`, `test-results/home-desktop.png` and `test-results/home-mobile.png`. Local source changes only; no deployment performed. User visual acceptance remains pending.

## Green presentation and discreet administrator entry

The public website now has a mint-green canvas, forest-green footer/contact banner, rounded cards and buttons, improved text sizes and mobile form/touch sizing. The header contains an accessible 44-pixel target displaying a single dot at the far right, linking to `/admin`; the explicit dashboard link has been removed from the public footer. The dot is discreet, not an authentication mechanism. Anonymous requests still require sign-in and backend role checks. The existing admin bootstrap remains required; setting `ADMIN_EMAIL`/`ADMIN_PASSWORD` alone does not create an account, and passwords must be at least 12 characters.

Browser coverage was extended to verify the dot destination, anonymous API denial and public layouts at 320, 360, 390 and 768 pixels in addition to desktop. See the recorded results below for verification status.

## Public background color update

The public website canvas now uses soft red (`#fee2e2`), with darker secondary text (`#4b5563`) to preserve readability. This change is scoped to the public `.site` wrapper; the admin workspace and white content cards retain their existing styles. CSS syntax was checked with the project's formatter. No database or external hosting setting was changed; redeploy the Vercel frontend to apply it online.

## Render connection-string correction

The supplied Render log failed during SQLAlchemy URL parsing, before a database connection. The backend now normalizes copied outer quotes (including an unmatched outer quote) and an optional `DATABASE_URL=` assignment before parsing. Unsupported, multiline or malformed values produce credential-free configuration guidance. New regression tests use fake connection strings and make no provider requests. Render still requires the owner to save a valid Neon URI in its own Environment settings; local `.env` changes do not update Render automatically.

After this correction, `npm test` passed **25 tests** (the original 14 and 11 configuration cases). The existing browser/build results below belong to the original release; this backend-only correction did not change frontend source, migrations or provider credentials. No live database connection was attempted during this correction.

Implementation and local verification are complete for this simple agency release. User acceptance and live provider/deployment acceptance remain separate. BidhaaLink implementation and its prompt records were not changed.

## Recorded results

| Check                         | Result                                          | Evidence                                                              |
| ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| Strict TypeScript             | Passed                                          | Standalone typecheck and production build                             |
| Next.js production build      | Passed                                          | All public/detail/admin routes built successfully                     |
| API and migration suite       | **14 tests passed**                             | `npm test`; disposable SQLite databases only                          |
| Production browser suite      | **12 workflows passed**                         | `npm run test:browser`; `test-results/browser-results.json`           |
| Browser runtime/server errors | None in the final suite                         | Browser page-error and HTTP 5xx checks                                |
| Responsive layouts            | Passed tested paths at 1440, 768 and 390 pixels | Explicit horizontal overflow assertions and screenshots               |
| Dependency installation       | Passed                                          | Independent Python virtual environment and two npm lockfiles          |
| npm installation audit        | No vulnerabilities reported during installation | npm install output for project/frontend dependencies                  |
| Neon live connection          | **Not run**                                     | Owner's connection URI is blank in `.env`                             |
| Cloudinary live upload/delete | **Not run**                                     | Owner's Cloudinary credentials are blank in `.env`                    |
| Deployment / custom domain    | **Not performed**                               | No hosting account changes made                                       |
| User acceptance               | **Pending**                                     | Owner still needs to review the website and add real business content |

The final API suite emits one upstream Starlette warning about its TestClient's httpx adapter. It does not fail the tests. Alembic's path separator setting is explicit. No application or production credentials were used for tests.

## API coverage

The suite verifies published-only public content; draft/publish/archive transitions; optimistic edit conflicts; content revisions; dynamic brand propagation; settings validation; persisted enquiries and consent; session hashing/cookie flags; cross-origin/header protections; logout; role restrictions; assigned-only sales records; own-profile-only team members; server-side decimal quotation calculations; invalid totals/numbers; testimonial approval; safe/unique page slugs and URL schemes; unknown-field/type rejection; local image validation/re-encoding/deletion; mocked Cloudinary upload/delete; Cloudinary SDK resource-type options; user creation and role restrictions; login throttling; aggregate analytics; search/pagination; audit entries; and fresh migration upgrade/downgrade on an isolated database.

Cloudinary mock tests verify integration behavior without making external requests. SQLite tests do not establish acceptance on a live Neon PostgreSQL instance. Run the provider checks and deployed acceptance below with your own independent accounts.

## Browser coverage

1. Desktop homepage, SEO title, original portfolio illustrations and horizontal layout.
2. Services, work, team, videos, contact, quote, about, solutions, privacy and terms routes.
3. Portfolio search and project detail navigation/disclosure.
4. Quotation request form saving an actual enquiry.
5. Authentication, dashboard enquiry visibility and follow-up stage update.
6. Draft preview, hidden draft URL, publication and revision history.
7. Brand changes appearing in public HTML and metadata.
8. Quotation line editor, backend-calculated total and PDF print document.
9. Every administration module opening with authorized API data.
10. Media library upload, decoded image display and confirmed deletion.
11. Tablet/mobile public layouts and mobile menu navigation.
12. Mobile dashboard navigation/settings layout and logout.

The first browser run found a rotated decorative ring extending outside the homepage. The ring was corrected and the final responsive checks passed. Test assertions were also made to await completed navigation and saves; no final test failures remain.

## Evidence artifacts

Ignored `test-results/` contains `browser-results.json`, `home-desktop.png`, `dashboard-desktop.png`, `work-mobile.png` and `dashboard-mobile.png`. Each browser run creates a uniquely named disposable database below that directory, seeds a random-password test administrator and stops its owned servers afterward. These records are examples, not live enquiries. Earlier diagnostic output may also remain in that ignored directory; `browser-results.json` records the final passing run.

Source file ownership and dependencies are recorded in [INVENTORY.md](INVENTORY.md). Setup, relocation and daily usage are in [README.md](../README.md). The `.env` and separate frontend template are prepared; they contain no copied credentials.

## Owner's live acceptance

Fill the root `.env` with an independent Neon connection URI and Cloudinary credentials. Apply Alembic migrations, create your administrator and run `python manage.py check-integrations` from the backend environment. Then verify a real Cloudinary upload/display/delete, an enquiry, publication, account permissions and quotation output against Neon. For deployment, follow [OPERATIONS.md](OPERATIONS.md), use HTTPS and set the exact final website origin before testing the login cookie.

Replace the sample identity, profiles and concepts with authorized business content and approve the privacy/terms text before public promotion. Email delivery, invoices/payments, external monitoring and advanced CRM automation are deliberately outside this simple release. Accessibility has baseline keyboard, labels, landmarks and reduced-motion support; a formal accessibility/conformance audit has not been performed.
