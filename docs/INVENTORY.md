# File inventory

Regenerate with `node scripts/inventory.mjs`. Paths are relative to this independent project root.

| File | Owner | Purpose |
| --- | --- | --- |
| `.env` | Project tooling | Prepared backend environment import file; ignored, credentials supplied by owner. |
| `.env.example` | Project tooling | Tracked backend environment variable template without credentials. |
| `.gitignore` | Project tooling | Exclude credentials, dependencies, runtime data and test artifacts. |
| `AGENTS.md` | Project tooling | Independent-project scope and contributor rules. |
| `README.md` | Project tooling | Setup, configuration, daily use, verification and relocation instructions. |
| `backend/alembic.ini` | Backend | Migration tool configuration. |
| `backend/alembic/env.py` | Backend | Migration database connection and transaction boundary. |
| `backend/alembic/versions/001_initial.py` | Backend | Initial schema migration, with upgrade and downgrade. |
| `backend/alembic/versions/002_admin_setup.py` | Backend | One-time setup completion schema and closure backfill for installations with existing accounts. |
| `backend/app/__init__.py` | Backend | Python package boundary. |
| `backend/app/admin_setup.py` | Backend | Shared first-owner claim transaction for browser and CLI setup; depends on database models, with a permanent unique completion marker. |
| `backend/app/config.py` | Backend | Credential-safe validation and normalization of pasted database connection URLs. |
| `backend/app/db.py` | Backend | Database configuration and persistent SQLAlchemy models. |
| `backend/app/main.py` | Backend | API, validation, authorization, sessions and business workflows. |
| `backend/app/seed.py` | Backend | Clearly labelled sample identity and editable starter content. |
| `backend/app/storage.py` | Backend | Backend-only Cloudinary integration and explicit local preview storage. |
| `backend/manage.py` | Backend | Interactive admin bootstrap, provider checks, seeding and local backup. |
| `backend/requirements.lock.txt` | Backend | Exact verified backend dependency versions. |
| `backend/requirements.txt` | Backend | Supported backend package ranges. |
| `backend/tests/__init__.py` | Backend | Python package boundary. |
| `backend/tests/bootstrap_browser.py` | Backend | Restricted disposable browser-test schema/content bootstrap; owner registration is exercised through the UI. |
| `backend/tests/conftest.py` | Backend | Disposable database/credential isolation for API tests. |
| `backend/tests/test_admin_setup.py` | Backend | Disposable-database tests for private setup keys, validation, permanent closure, rate limits and concurrent claims. |
| `backend/tests/test_config.py` | Backend | Regression tests for hosting environment quote handling and safe configuration errors. |
| `backend/tests/test_migrations.py` | Backend | Fresh isolated migration upgrade/downgrade verification. |
| `backend/tests/test_platform.py` | Backend | Critical API, RBAC, publishing, quotation and media contract tests. |
| `docs/ARCHITECTURE.md` | Documentation | Ownership, boundaries, permissions and extension policy. |
| `docs/INVENTORY.md` | Documentation | This generated source-file ownership and dependency inventory. |
| `docs/OPERATIONS.md` | Documentation | Neon/Cloudinary setup, deployment, backups and known operational limits. |
| `docs/PROJECT-BRIEF.txt` | Documentation | Unmodified copy of the user-supplied agency description. |
| `docs/VERIFICATION.md` | Documentation | Actual verification outcomes, coverage and external-service limits. |
| `docs/verification-results.json` | Documentation | Project source or configuration. |
| `frontend/.env.example` | Web | Frontend environment template; backend origin only. |
| `frontend/next-env.d.ts` | Web | Next.js-generated framework type declarations. |
| `frontend/next.config.ts` | Web | Independent build roots, API proxy and security headers. |
| `frontend/package-lock.json` | Web | Locked frontend dependencies. |
| `frontend/package.json` | Web | Frontend scripts and independent runtime dependencies. |
| `frontend/public/agency-collaboration.jpg` | Web | Locally served Unsplash collaboration photograph for the homepage; illustrative, not the agency team. Source recorded in docs/VERIFICATION.md. |
| `frontend/public/work-blue.svg` | Web | Original illustrative portfolio concept (not client work). |
| `frontend/public/work-mint.svg` | Web | Original illustrative portfolio concept (not client work). |
| `frontend/public/work-peach.svg` | Web | Original illustrative portfolio concept (not client work). |
| `frontend/src/app/(public)/[slug]/[id]/page.tsx` | Web | Published service and portfolio detail routes. |
| `frontend/src/app/(public)/[slug]/page.tsx` | Web | Core public and administrator-created pages. |
| `frontend/src/app/(public)/page.tsx` | Web | Request-time homepage and brand-dependent SEO metadata. |
| `frontend/src/app/admin/page.tsx` | Web | Noindex admin workspace entry route. |
| `frontend/src/app/error.tsx` | Web | Recoverable content-service error boundary. |
| `frontend/src/app/globals.css` | Web | Public/admin design system, responsive styles and reduced motion. |
| `frontend/src/app/layout.tsx` | Web | Root HTML shell and base metadata. |
| `frontend/src/app/not-found.tsx` | Web | Accessible unpublished/missing page fallback. |
| `frontend/src/app/robots.ts` | Web | Search engine rules excluding admin/API routes. |
| `frontend/src/components/home-carousel.tsx` | Web | Accessible manual homepage carousel with three agency highlights and route actions; depends on React, Next Link and site settings. |
| `frontend/src/components/public-client.tsx` | Web | Mobile menu, portfolio filters, enquiry form and video controls. |
| `frontend/src/components/public-pages.tsx` | Web | Public page compositions, service and project details. |
| `frontend/src/components/site-shell.tsx` | Web | Dynamic identity, navigation, footer and contact banner. |
| `frontend/src/features/admin/admin.tsx` | Web | Admin authentication, overview, editors, CRM, media, users and print view. |
| `frontend/src/features/admin/schema.ts` | Web | Structured admin fields, defaults, labels and role-aware navigation. |
| `frontend/src/lib/api.ts` | Web | Shared same-origin HTTP client and server-side content fetching. |
| `frontend/src/styles/public-polish.css` | Web | ICT Authority-inspired green/red/white public design system, responsive layout and discreet admin entry. |
| `frontend/tsconfig.json` | Web | Strict frontend TypeScript configuration. |
| `package-lock.json` | Project tooling | Locked project tooling dependencies. |
| `package.json` | Project tooling | Independent project commands and browser/formatting tools. |
| `scripts/browser-test.mjs` | Project tooling | Production-build browser checks using isolated data and random credentials. |
| `scripts/create-admin.ps1` | Project tooling | Create an administrator in cloud or explicitly local mode. |
| `scripts/dev.mjs` | Project tooling | Migrate/seed and run both local processes; local mode is explicit. |
| `scripts/generate-art.mjs` | Project tooling | Reproducible original SVG portfolio interface illustrations. |
| `scripts/inventory.mjs` | Project tooling | Regenerate this file inventory without reading secret contents. |
| `scripts/setup.ps1` | Project tooling | Install the independent Windows development environment. |
| `scripts/test.mjs` | Project tooling | Cross-platform API test launcher. |

Dependencies: frontend → FastAPI HTTP only; backend → Neon/SQLAlchemy and Cloudinary; tests → disposable databases and mocked provider operations. No module depends on BidhaaLink. Node/Python dependencies are locked separately. Runtime databases, uploads, caches and test screenshots are ignored; they are not source modules.
