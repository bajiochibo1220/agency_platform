import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(resolve(root, ".env")))
  process.loadEnvFile(resolve(root, ".env"));
const local = process.argv.includes("--local");
const env = { ...process.env };
if (local)
  Object.assign(env, {
    LOCAL_DEVELOPMENT: "true",
    DATABASE_URL: "",
    MEDIA_STORAGE: "local",
    ENVIRONMENT: "development",
  });
const python = resolve(
  root,
  "backend",
  ".venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);
if (!existsSync(python)) {
  console.error("Run scripts/setup.ps1 first (see README.md).");
  process.exit(1);
}
function run(command, args, cwd, childEnv = env) {
  return spawn(command, args, {
    cwd,
    env: childEnv,
    stdio: "inherit",
    windowsHide: true,
  });
}
function once(command, args, cwd) {
  return new Promise((ok, no) => {
    const p = run(command, args, cwd);
    p.on("error", no);
    p.on("exit", (code) =>
      code === 0 ? ok() : no(new Error(`Setup command exited ${code}`)),
    );
  });
}
try {
  await once(
    python,
    ["-m", "alembic", "upgrade", "head"],
    resolve(root, "backend"),
  );
  await once(python, ["manage.py", "seed"], resolve(root, "backend"));
} catch {
  console.error(
    "Check .env credentials, or use npm run dev:local for a local preview.",
  );
  process.exit(1);
}
const api = run(
  python,
  ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8100"],
  resolve(root, "backend"),
);
const frontEnv = { ...env };
for (const key of [
  "DATABASE_URL",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_API_KEY",
  "ADMIN_PASSWORD",
])
  delete frontEnv[key];
const web = run(
  process.execPath,
  [
    resolve(root, "frontend/node_modules/next/dist/bin/next"),
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  resolve(root, "frontend"),
  frontEnv,
);
console.log(
  `\nAgency Platform: http://127.0.0.1:3100\nDashboard: http://127.0.0.1:3100/admin\n${local ? "Explicit local preview: SQLite and local uploads." : "Neon + Cloudinary mode (credentials from .env)."}\n`,
);
function stop() {
  api.kill();
  web.kill();
}
process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stop();
  process.exit(0);
});
for (const child of [api, web]) {
  child.on("error", (e) => {
    console.error(e.message);
    stop();
    process.exit(1);
  });
  child.on("exit", (code) => {
    stop();
    process.exit(code || 0);
  });
}
