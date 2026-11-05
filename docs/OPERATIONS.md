# Environment, deployment and recovery

## Environment import

The root `.env` is prepared for the backend. Fill its blank values, then import into **Render**. Keep `.env` ignored and never commit it. The tracked `.env.example` contains the same key names without credentials.

| Variable                         | Required value / ownership                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | Independent Neon PostgreSQL connection URI, SSL required; backend only                    |
| `CLOUDINARY_CLOUD_NAME`          | Cloudinary product environment name; backend only                                         |
| `CLOUDINARY_API_KEY`             | Cloudinary API key; backend only                                                          |
| `CLOUDINARY_API_SECRET`          | Cloudinary secret; backend only                                                           |
| `MEDIA_STORAGE`                  | `cloudinary` for actual use                                                               |
| `ENVIRONMENT`                    | `production` on Render; `development` for local HTTP                                      |
| `LOCAL_DEVELOPMENT`              | `false` for normal Neon use                                                               |
| `ALLOWED_ORIGINS`                | Exact website origins, comma separated, no trailing slash; set final Vercel/custom origin |
| `BACKEND_URL`                    | Backend HTTP(S) origin; consumed by Next.js, no credentials                               |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional one-time admin bootstrap; remove password after use                              |
| `UPLOAD_DIR`                     | Optional local-test upload override; not needed with Cloudinary                           |

**Vercel receives only `BACKEND_URL`**, using `frontend/.env.example` as the template. Do not import the root backend environment into Vercel. There are no `NEXT_PUBLIC_` secrets. The frontend needs no direct database or Cloudinary credentials.

## Render: FastAPI

1. Push the independent folder as its own repository after moving it out of BidhaaLink. No Git remote or repository was created automatically.
2. Create a Python web service with root directory `backend`. Build command: `pip install -r requirements.lock.txt`.
3. Set the root `.env` variables in Render, use `ENVIRONMENT=production`, set the exact Vercel/custom origin in `ALLOWED_ORIGINS`, and keep normal Neon and Cloudinary values.
4. Pre-deploy command: `python -m alembic upgrade head`. On a hosting plan without a pre-deploy step, run the migration once from a trusted shell before starting the new version.
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`. Health check: `/api/health`.
6. Create the first account using either the browser registration instructions below or `python manage.py create-admin` from a trusted shell against the intended Neon database. For CLI setup, use interactive input or temporary bootstrap variables; clear the password variable afterward. Run `python manage.py check-integrations` to verify the database connection and Cloudinary credentials.

Back up before schema changes. Never point automated tests at the application database. The default seed creates a clearly labelled sample identity; replace it in the dashboard before public promotion.

## Vercel: Next.js

### First administrator registration

Visitors submit enquiries without accounts. For a new installation with no users, set `ADMIN_SETUP_KEY` on **Render only** to a private random value of at least 32 characters. Generate one in PowerShell:

```powershell
$setupBytes = New-Object byte[] 32
$setupGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$setupGenerator.GetBytes($setupBytes)
[Convert]::ToBase64String($setupBytes)
$setupGenerator.Dispose()
```

Keep the generated value private. Apply `python -m alembic upgrade head` from the backend environment, then deploy the backend and frontend changes. Visit `/admin`, choose **Register first administrator**, and enter your name, email, password (12+ characters), password confirmation and private setup key. Sign in after registration. Remove `ADMIN_SETUP_KEY` from Render after successful setup; never put it in Vercel, source control, a public URL, or a `NEXT_PUBLIC_` variable.

Registration commits a permanent database marker together with the first super-admin account. Later setup attempts are rejected, including simultaneous requests, restarts, changed keys and removal of all users. Installations already containing users are closed by migration 002. They must use their existing login; this form cannot replace or recover an existing administrator. The CLI `create-admin` uses the same one-time claim. Authorized staff management remains behind super-admin authentication.

### Frontend deployment

1. Set root directory to `frontend`, framework to Next.js, install command `npm ci`, build command `npm run build`.
2. Set `BACKEND_URL` to the HTTPS Render origin before building. Rebuild if this value changes because rewrites are compiled into the build.
3. Set the final public Vercel/custom domain in the backend `ALLOWED_ORIGINS`, with no trailing slash. HTTPS is required when `ENVIRONMENT=production` enables Secure cookies.
4. Verify public pages, login, enquiry submission, brand updates, real Cloudinary upload/delete and permissions from the deployed website. The backend proxy forwards cookies through the website origin.

Optional Vercel preview domains must each be explicitly allowed by the backend; do not enable wildcard credentialed CORS.

## Media and provider errors

Uploads pass through the authenticated backend. Cloudinary receives validated/re-encoded image bytes, PDFs as raw resources and MP4 as video resources, using unique public IDs and no overwrite. The stored record keeps the provider URL, public ID and resource type so delete uses the matching resource type. A provider failure returns a recoverable 502 and does not claim a completed upload/delete.

The website accepts links to existing Cloudinary images and videos as well. YouTube/Vimeo embeds load only after the visitor clicks the load button. Cloudinary and third-party video playback may contact those providers from the visitor's browser; cover those providers in your approved privacy policy.

## Backups and restore

For Neon, use an appropriately scoped `pg_dump` connection with credentials provided through a trusted environment or credential file, and store encrypted backups outside the application repository. Restore only into a new recovery database first and validate content and permissions before switching the application. Confirm your Neon plan's current recovery settings in your account. Back up Cloudinary assets separately; database backups contain URLs, not the asset bytes.

For a local preview, run `python manage.py backup` from `backend` with local mode enabled. This uses SQLite's online backup API and stores a timestamped `.db` under ignored `backend/data/backups`. Copy `backend/uploads` separately. Stop local processes before replacing `backend/data/agency.db` with a verified backup; retain the original until you have checked the restored site.

## Logs and retention

Uvicorn supplies request/error logs to the host. Configure host alerting and log retention yourself; no external error-monitoring account has been connected. Do not add request bodies, passwords, tokens or database URIs to logs. Review enquiries/client notes regularly and delete records after your approved retention period. Record deletion removes that record's revision history too; audit logs retain only actor, action, record identifier and time.

Audit exports, scheduled backups, automated email, invoices/payments, complex CRM automation, confidential file storage and multi-instance shared rate limiting are outside this deliberately simple release.

## Provider references

The integration follows [Neon's standard PostgreSQL connection guidance](https://neon.com/docs/connect/connect-from-any-app), [Cloudinary's Python upload API](https://cloudinary.com/documentation/django_image_and_video_upload), and [Cloudinary's resource-type and delete parameters](https://cloudinary.com/documentation/image_upload_api_reference). Live verification requires your own provider accounts.


## Recovering the first-owner registration on the hosted website

A read-only health/setup check and an empty, non-credential login request against `https://agency-platform-navy.vercel.app` on 5 November 2026 returned: `/api/health` 200, `/api/auth/setup` 404 (`Not Found`), and `/api/auth/login` 403 (`Untrusted origin`). The registration code was missing from the deployed backend, and the website origin was rejected before credential validation. Removing users alone does not resolve either deployment issue.

1. In Render, include `https://agency-platform-navy.vercel.app` in `ALLOWED_ORIGINS` without a trailing slash. Preserve other valid origins as comma-separated entries. Set a new private `ADMIN_SETUP_KEY` of at least 32 random characters on Render only.
2. Deploy the updated backend and apply `python -m alembic upgrade head`. Deploy the updated frontend to Vercel as well.
3. If old login accounts must be removed so the owner can register again, run the following from the backend directory in the **trusted Render shell** (it acts on that service's configured database):

```text
python manage.py reset-admin-setup --confirm-reset
```

This command removes **all login accounts and sessions** and the setup-completion marker, then records an audit event. Website content, enquiries, quotations, media records and existing audit history remain. Staff assignments referencing old user IDs will need reassignment after creating new staff accounts. The command refuses to run without the explicit flag or a configured private setup key. There is no public HTTP reset endpoint.

4. Open `/admin`, register with your new email/password and private key, then sign in. Registration closes again after this account is created. Remove `ADMIN_SETUP_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` from Render after setup if they are present; the owner account is stored in the database, not those variables.

No live account reset or deployment was performed by the code changes documented here. The live deployment observations do not establish whether a valid administrator already exists.
