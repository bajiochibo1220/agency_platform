# Architecture and ownership

This is a small two-process application. The frontend contains presentation and admin forms. The backend owns validation, permissions, business calculations, persistence, media credentials and the public content projection. Both applications are rooted here and have their own dependencies. No parent imports or workspace membership.

## Boundaries

`frontend/src/app` owns routes, request-time metadata, security headers and error handling. Public pages fetch published content from FastAPI on each request; admin and public form mutations use same-origin `/api` calls. Next.js rewrites `/api/*` to `BACKEND_URL`, keeping the session cookie on the website origin. The production build must receive the final backend origin.

`frontend/src/components` owns the public design system and responsive interactions. `frontend/src/features/admin` owns the dashboard, structured editor descriptors, role-aware navigation and quotation print view. Interface labels stay in code; business data is persisted. There is no arbitrary HTML editor or execution of administrator-authored scripts.

`backend/app/db.py` owns SQLAlchemy models and environment loading. Records contain typed-by-module JSON content; the HTTP boundary explicitly whitelists fields and types. Revision metadata uses an optimistic version counter. `main.py` owns API routes and permission enforcement. `seed.py` owns fresh-install examples. `storage.py` owns Cloudinary operations, with explicit local preview support. Alembic owns schema changes. Server startup seeds missing content but does not create or modify schema.

Neon is the normal database and Cloudinary the normal media provider. Production refuses SQLite and local media. Database credentials and Cloudinary API secrets are backend-only. A shared public credential is never sent to a visitor.

## Roles

| Role            | Backend access                                                                               |
| --------------- | -------------------------------------------------------------------------------------------- |
| Super admin     | All modules, settings, users and audit log                                                   |
| Administrator   | Content, media, operations, overview and analytics; no global settings, users or audit       |
| Content manager | Public content, media and overview; no business records or users                             |
| Sales           | Only their assigned enquiries, clients and quotations; own operational overview              |
| Team member     | Their assigned team profile only; cannot create/delete profiles or change publication status |

Super admins create users and assign records. User changes revoke existing sessions; password reset is an owner action, with no email reset integration. A signed-in super admin cannot remove their own super-admin access.

## Security and operational limits

Passwords use salted scrypt. Sessions use a random 48-byte URL-safe token, stored only as a SHA-256 digest server-side, expire after eight hours and are revoked on logout. Cookies are HttpOnly, SameSite=Lax and Secure in production. Mutation requests require a non-simple custom header and reject untrusted Origin headers. Restrictive frontend headers, escaped React text, safe URL schemes and upload validation protect the presentation boundary. Public enquiry rate limiting and a honeypot reduce simple spam.

The limiter is in memory. Run **one backend worker/instance** with the supplied deployment approach. Shared rate limiting and stronger anti-spam controls are future work before horizontal scaling. Aggregate analytics are indicative counts, not verified unique visitors or external monitoring. Follow-up notes are deliberately simple text, not a separate messaging integration. Quotations are tracked documents, not invoices or payment instruments.

The supplied privacy/terms pages are clearly labelled editable launch drafts. The software includes access restrictions, deletion controls and a data-minimal analytics implementation; it does not establish legal compliance by itself. The owner must approve their actual policies, retention period and processor arrangements before collecting live client information.

Media is public marketing material. PDF uploads are served as downloads locally and as Cloudinary raw assets in cloud mode. The dashboard is not a confidential document vault. Local files are excluded from version control.

## Extension policy

Add a module by declaring backend fields/validation and permissions first, then adding admin field descriptors and the corresponding public rendering. Add schema changes through a new Alembic revision; never edit an already-deployed revision. Do not add a separate service or abstraction until a concrete feature requires it.
