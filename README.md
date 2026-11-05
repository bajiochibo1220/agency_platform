# Agency Platform

An independent digital agency website and administration workspace. All source, dependencies and data belong to this folder. Move the entire `agency-platform` folder wherever you want; it does not import BidhaaLink code. No Docker is used.

## What is included

- Responsive public home, services and service detail, searchable portfolio and case studies, about, industry solutions, team, videos, contact, quotation requests, privacy, terms and administrator-created pages.
- Database-backed brand identity, logo, theme, contact channels, navigation, SEO, services, projects, team, videos, testimonials, page sections and publication status.
- Admin workspace with search, status filtering, pagination, media uploads, draft preview, content revision history, restore through the editor, audit records and five backend-enforced roles.
- Enquiry capture, assignment, priorities, pipeline stages, follow-up dates and communication notes; client records; quotations with line items, server-calculated totals, configurable tax and printable PDF output.
- Neon PostgreSQL and Cloudinary for deployment. A deliberately separate SQLite/local-upload mode supports a credential-free local preview and disposable automated tests.
- Aggregate page counts and enquiry source/pipeline analytics. No external tracking service.

The default `Nexa Studio` identity, sample team profiles and three interface concepts are clearly labelled examples. They are not real employees, client endorsements or claims of delivered work. No BidhaaLink features have been copied or represented as finished agency work.

## Requirements and first setup

Node.js 22.16+ (or 24+) and Python 3.12–3.14. On Windows, open PowerShell **inside this folder**:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

This installs separate frontend dependencies, the browser test runner and the backend virtual environment. Re-run setup after moving the folder: Python environments contain absolute paths. Existing database files and uploads stay in `backend/data` and `backend/uploads`.

## Use Neon and Cloudinary

The real `.env` file is already prepared at this folder's root, with blank credentials. `.env.example` is the safe tracked copy. Fill:

```dotenv
DATABASE_URL=postgresql://USER:URL_ENCODED_PASSWORD@YOUR_NEON_HOST/neondb?sslmode=require&channel_binding=require
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

Use your own independent Neon project/database. The application accepts Neon's usual `postgresql://` URI and selects the psycopg driver internally. Keep the SSL query parameters supplied by Neon. URL-encode special characters in database passwords. Never use BidhaaLink's database or credentials.

Keep `MEDIA_STORAGE=cloudinary` and `LOCAL_DEVELOPMENT=false`. Create your administrator interactively, then start:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/create-admin.ps1
npm run dev
```

- Website: **http://127.0.0.1:3100**
- Dashboard: **http://127.0.0.1:3100/admin**
- API documentation (development only): http://127.0.0.1:8100/docs

No default administrator password exists. Use 12 or more characters. Optional `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables support a one-time bootstrap; clear `ADMIN_PASSWORD` after creating the account. The password is hashed with scrypt and never returned by the API.

Check real provider credentials from `backend` after filling `.env`:

```powershell
.\.venv\Scripts\python.exe manage.py check-integrations
```

This performs a database query and a Cloudinary API ping. It does not publish a site or upload a test asset. Actual Cloudinary uploads/deletes are available in the dashboard Media library. Live provider connectivity has **not** been verified without your credentials.

## Credential-free local preview

```powershell
powershell -ExecutionPolicy Bypass -File scripts/create-admin.ps1 -Local
npm run dev:local
```

This explicitly chooses a separate local SQLite database and local uploads. It does not exercise Neon or Cloudinary. The normal `npm run dev` requires your provider configuration and does not silently fall back.

## Daily administration

The small dot at the far right of the website header opens the admin sign-in page. It is a discreet shortcut; backend authentication and role permissions protect the workspace. Your `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables are used by `create-admin`, not as an automatic login account. Set a password of at least 12 characters and run `scripts/create-admin.ps1` once against your intended Neon database before signing in.

1. Sign in and open **Brand & settings**. Set your name, logo, colors, homepage introduction, contact information, social links and SEO. Remove the demo notice only after replacing the examples.
2. Upload images, PDFs or MP4 videos in **Media library**, copy the returned path/Cloudinary URL and paste it into a content image/video field. Images are decoded, metadata removed and converted to WebP. Each upload is limited to 10 MB; YouTube/Vimeo links work for longer videos. Uploaded assets are public website media; do not upload confidential client documents.
3. Add services, projects, team profiles, pages, sections and navigation. Use `draft` until reviewed; `published` makes content visible; `archived` hides it. Order controls display sequence. Custom pages use a URL slug; add their URL to Navigation to expose a menu link. Homepage process sections use page `home` and placement `process`; other homepage sections use `content`.
4. Confirm permission before publishing genuine testimonials or named clients. Replace example team profiles with actual people. Keep development statuses accurate.
5. Review enquiries, assign an owner, set the next stage/follow-up date and append communication notes. Create a client or quotation when appropriate. Assignment options use active user accounts.
6. Save a quotation before printing it. **Print / save PDF** opens a clean document with the browser's PDF option. Send it through your own email channel and record `Sent` manually. The platform does not send emails, issue invoices or process payments.
7. Edit an existing record and use **Version history → Load version → Save changes** to restore content. Concurrent outdated edits return a conflict instead of overwriting newer content.

## Verification

Stop running agency servers before the browser suite; it starts and stops its own servers on ports 3100/8100 using an isolated database and random administrator password.

```powershell
npm test
npm run build
npm run test:browser
```

If the Playwright browser is not installed, run `npx playwright install chromium` once. Browser screenshots and results are written to ignored `test-results/`. Read [docs/VERIFICATION.md](docs/VERIFICATION.md) for actual recorded outcomes and limits.

If your usual preview must stay open, use a separate test build and ports:

```powershell
$env:BACKEND_URL = 'http://127.0.0.1:8101'
$env:NEXT_DIST_DIR = '.next-browser'
$env:AGENCY_TEST_WEB_PORT = '3101'
$env:AGENCY_TEST_API_PORT = '8101'
npm run build
npm run test:browser
Remove-Item Env:BACKEND_URL, Env:NEXT_DIST_DIR, Env:AGENCY_TEST_WEB_PORT, Env:AGENCY_TEST_API_PORT
```

This suite still uses a disposable database, not your live Neon records. Run these commands in a separate terminal so your normal development environment is unaffected.

## Deploy without Docker

See [docs/OPERATIONS.md](docs/OPERATIONS.md). Render runs FastAPI; Vercel runs Next.js; Neon stores all application records; Cloudinary stores uploaded media. Deployment accounts and live credentials are user supplied. No deployment has been performed.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for ownership, role rules and boundaries, and [docs/INVENTORY.md](docs/INVENTORY.md) for the file inventory.
