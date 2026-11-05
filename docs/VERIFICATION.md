# Verification record — 5 November 2026

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
