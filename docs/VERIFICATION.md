# Verification record — 5 November 2026

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
