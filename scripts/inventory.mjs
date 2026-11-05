import { readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignored = new Set([
  ".git",
  "node_modules",
  ".next",
  ".next-browser",
  ".venv",
  "__pycache__",
  ".pytest_cache",
  "data",
  "uploads",
  "test-results",
]);
const descriptions = {
  "scripts/test-api-client.mjs":
    "Mocked checks of the actual TypeScript HTTP client for non-JSON deployment errors and API validation messages; no network or credentials.",
  "frontend/src/styles/public-polish.css":
    "ICT Authority-inspired green/red public design system with muted sage surfaces, responsive layout and discreet admin entry.",
  "frontend/src/components/home-carousel.tsx":
    "Accessible manual homepage carousel with three agency highlights and route actions; depends on React, Next Link and site settings.",
  "frontend/public/agency-collaboration.jpg":
    "Locally served Unsplash collaboration photograph for the homepage; illustrative, not the agency team. Source recorded in docs/VERIFICATION.md.",
  "AGENTS.md": "Independent-project scope and contributor rules.",
  ".env":
    "Prepared backend environment import file; ignored, credentials supplied by owner.",
  ".env.example":
    "Tracked backend environment variable template without credentials.",
  ".gitignore":
    "Exclude credentials, dependencies, runtime data and test artifacts.",
  "package.json": "Independent project commands and browser/formatting tools.",
  "package-lock.json": "Locked project tooling dependencies.",
  "README.md":
    "Setup, configuration, daily use, verification and relocation instructions.",
  "backend/app/config.py":
    "Credential-safe validation and normalization of pasted database connection URLs.",
  "backend/app/admin_setup.py":
    "First-owner claim transaction and trusted-shell account recovery; depends on database models, with an atomic unique completion marker.",
  "backend/alembic/versions/002_admin_setup.py":
    "One-time setup completion schema and closure backfill for installations with existing accounts.",
  "backend/tests/test_admin_setup.py":
    "Disposable-database tests for private setup keys, validation, permanent closure, rate limits and concurrent claims.",
  "backend/tests/test_config.py":
    "Regression tests for hosting environment quote handling and safe configuration errors.",
  "backend/app/db.py":
    "Database configuration and persistent SQLAlchemy models.",
  "backend/app/main.py":
    "API, validation, authorization, sessions and business workflows.",
  "backend/app/seed.py":
    "Clearly labelled sample identity and editable starter content.",
  "backend/app/storage.py":
    "Backend-only Cloudinary integration and explicit local preview storage.",
  "backend/manage.py":
    "Interactive admin bootstrap, provider checks, seeding and local backup.",
  "backend/alembic.ini": "Migration tool configuration.",
  "backend/alembic/env.py":
    "Migration database connection and transaction boundary.",
  "backend/alembic/versions/001_initial.py":
    "Initial schema migration, with upgrade and downgrade.",
  "backend/requirements.txt": "Supported backend package ranges.",
  "backend/requirements.lock.txt":
    "Exact verified backend dependency versions.",
  "frontend/.env.example":
    "Frontend environment template; backend origin only.",
  "frontend/next.config.ts":
    "Independent build roots, API proxy and security headers.",
  "frontend/tsconfig.json": "Strict frontend TypeScript configuration.",
  "frontend/next-env.d.ts": "Next.js-generated framework type declarations.",
  "frontend/package.json":
    "Frontend scripts and independent runtime dependencies.",
  "frontend/package-lock.json": "Locked frontend dependencies.",
  "frontend/src/lib/api.ts":
    "Shared same-origin HTTP client and server-side content fetching.",
  "frontend/src/app/layout.tsx": "Root HTML shell and base metadata.",
  "frontend/src/app/globals.css":
    "Public/admin design system, responsive styles and reduced motion.",
  "frontend/src/app/error.tsx": "Recoverable content-service error boundary.",
  "frontend/src/app/not-found.tsx":
    "Accessible unpublished/missing page fallback.",
  "frontend/src/app/robots.ts":
    "Search engine rules excluding admin/API routes.",
  "frontend/src/components/site-shell.tsx":
    "Dynamic identity, navigation, footer and contact banner.",
  "frontend/src/components/public-pages.tsx":
    "Public page compositions, service and project details.",
  "frontend/src/components/public-client.tsx":
    "Mobile menu, portfolio filters, enquiry form and video controls.",
  "frontend/src/features/admin/admin.tsx":
    "Admin authentication, overview, editors, CRM, media, users and print view.",
  "frontend/src/features/admin/schema.ts":
    "Structured admin fields, defaults, labels and role-aware navigation.",
  "frontend/src/app/(public)/page.tsx":
    "Request-time homepage and brand-dependent SEO metadata.",
  "frontend/src/app/(public)/[slug]/page.tsx":
    "Core public and administrator-created pages.",
  "frontend/src/app/(public)/[slug]/[id]/page.tsx":
    "Published service and portfolio detail routes.",
  "frontend/src/app/admin/page.tsx": "Noindex admin workspace entry route.",
  "scripts/setup.ps1":
    "Install the independent Windows development environment.",
  "scripts/create-admin.ps1":
    "Create an administrator in cloud or explicitly local mode.",
  "scripts/dev.mjs":
    "Migrate/seed and run both local processes; local mode is explicit.",
  "scripts/test.mjs": "Cross-platform API test launcher.",
  "scripts/browser-test.mjs":
    "Production-build browser checks using isolated data and random credentials.",
  "scripts/generate-art.mjs":
    "Reproducible original SVG portfolio interface illustrations.",
  "scripts/inventory.mjs":
    "Regenerate this file inventory without reading secret contents.",
  "docs/PROJECT-BRIEF.txt":
    "Unmodified copy of the user-supplied agency description.",
  "docs/ARCHITECTURE.md":
    "Ownership, boundaries, permissions and extension policy.",
  "docs/OPERATIONS.md":
    "Neon/Cloudinary setup, deployment, backups and known operational limits.",
  "docs/VERIFICATION.md":
    "Actual verification outcomes, coverage and external-service limits.",
  "docs/INVENTORY.md":
    "This generated source-file ownership and dependency inventory.",
  "backend/tests/conftest.py":
    "Disposable database/credential isolation for API tests.",
  "backend/tests/test_platform.py":
    "Critical API, RBAC, publishing, quotation and media contract tests.",
  "backend/tests/test_migrations.py":
    "Fresh isolated migration upgrade/downgrade verification.",
  "backend/tests/bootstrap_browser.py":
    "Restricted disposable browser-test schema/content bootstrap; owner registration is exercised through the UI.",
};
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (
      ignored.has(entry.name) ||
      entry.name.endsWith(".tsbuildinfo") ||
      entry.name.endsWith(".pyc")
    )
      return [];
    const path = resolve(dir, entry.name);
    return entry.isDirectory()
      ? walk(path)
      : [relative(root, path).replaceAll("\\", "/")];
  });
}
const files = walk(root);
if (!files.includes("docs/INVENTORY.md")) files.push("docs/INVENTORY.md");
const rows = files.sort().map((file) => {
  const owner = file.startsWith("backend/")
    ? "Backend"
    : file.startsWith("frontend/")
      ? "Web"
      : file.startsWith("docs/")
        ? "Documentation"
        : "Project tooling";
  const purpose =
    descriptions[file] ||
    (file.endsWith("__init__.py")
      ? "Python package boundary."
      : file.startsWith("frontend/public/work-")
        ? "Original illustrative portfolio concept (not client work)."
        : "Project source or configuration.");
  return `| \`${file}\` | ${owner} | ${purpose} |`;
});
writeFileSync(
  resolve(root, "docs/INVENTORY.md"),
  "# File inventory\n\nRegenerate with `node scripts/inventory.mjs`. Paths are relative to this independent project root.\n\n| File | Owner | Purpose |\n| --- | --- | --- |\n" +
    rows.join("\n") +
    "\n\nDependencies: frontend → FastAPI HTTP only; backend → Neon/SQLAlchemy and Cloudinary; tests → disposable databases and mocked provider operations. No module depends on BidhaaLink. Node/Python dependencies are locked separately. Runtime databases, uploads, caches and test screenshots are ignored; they are not source modules.\n",
);
console.log(`${files.length} source/configuration files inventoried.`);
