import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const results = resolve(root, "test-results");
mkdirSync(results, { recursive: true });
const run = mkdtempSync(resolve(results, "browser-"));
const webPort = Number(process.env.AGENCY_TEST_WEB_PORT || 3100);
const apiPort = Number(process.env.AGENCY_TEST_API_PORT || 8100);
const webOrigin = `http://127.0.0.1:${webPort}`;
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const password = randomBytes(28).toString("base64url");
const env = {
  ...process.env,
  DATABASE_URL: "sqlite:///" + resolve(run, "disposable.db"),
  UPLOAD_DIR: resolve(run, "uploads"),
  MEDIA_STORAGE: "local",
  LOCAL_DEVELOPMENT: "true",
  ENVIRONMENT: "test",
  BROWSER_TEST_PASSWORD: password,
  ALLOWED_ORIGINS: `${webOrigin}`,
  BACKEND_URL: `${apiOrigin}`,
};
const python = resolve(
  root,
  "backend/.venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);
const children = [];
let browser;
const checks = [];
const errors = [];
function start(cmd, args, cwd) {
  const p = spawn(cmd, args, {
    cwd,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  p.stdout.on("data", (d) => {
    output += d;
  });
  p.stderr.on("data", (d) => {
    output += d;
  });
  p.on("error", (e) => errors.push(e.message));
  p.output = () => output;
  children.push(p);
  return p;
}
function waitExit(p) {
  return new Promise((yes, no) => {
    p.on("error", no);
    p.on("exit", (code) => (code === 0 ? yes() : no(new Error(p.output()))));
  });
}
async function ready(url, p) {
  for (let n = 0; n < 90; n++) {
    if (p.exitCode !== null) throw new Error(p.output());
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server readiness timed out: " + p.output());
}
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log("PASS " + name);
}
async function noOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  if (dimensions.scroll > dimensions.width + 1) {
    console.log(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll("body *"))
          .map((el) => ({
            tag: el.tagName,
            class: el.className?.baseVal ?? el.className,
            left: el.getBoundingClientRect().left,
            right: el.getBoundingClientRect().right,
          }))
          .filter((el) => el.right > innerWidth + 1 || el.left < -1)
          .slice(0, 20),
      ),
    );
    await page.screenshot({
      path: resolve(results, "overflow-debug.png"),
      fullPage: true,
    });
  }
  assert.ok(
    dimensions.scroll <= dimensions.width + 1,
    JSON.stringify(dimensions),
  );
}
try {
  for (const port of [webPort, apiPort]) {
    try {
      await fetch(`http://127.0.0.1:${port}/api/health`);
      throw new Error(
        `Port ${port} is occupied. Stop the existing agency server before running browser tests.`,
      );
    } catch (e) {
      if (e.message.includes("occupied")) throw e;
    }
  }
  await waitExit(
    start(python, ["-m", "tests.bootstrap_browser"], resolve(root, "backend")),
  );
  const backend = start(
    python,
    [
      "-m",
      "uvicorn",
      "app.main:app",
      "--host",
      "127.0.0.1",
      "--port",
      String(apiPort),
    ],
    resolve(root, "backend"),
  );
  await ready(`${apiOrigin}/api/health`, backend);
  const web = start(
    process.execPath,
    [
      resolve(root, "frontend/node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(webPort),
    ],
    resolve(root, "frontend"),
  );
  await ready(`${webOrigin}/`, web);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 500) errors.push(`${r.status()}: ${r.url()}`);
  });
  await check("Desktop home, SEO, illustrations and layout", async () => {
    await page.goto(`${webOrigin}/`);
    await page.getByRole("heading", { name: /Your vision/ }).waitFor();
    assert.match(await page.title(), /Nexa Studio/);
    await noOverflow(page);
    assert.equal(
      await page
        .locator("img")
        .evaluateAll(
          (imgs) =>
            imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
        ),
      0,
    );
    await page.screenshot({
      path: resolve(results, "home-desktop.png"),
      fullPage: true,
    });
  });
  await check("Discreet top-right admin dot requires sign-in", async () => {
    await page.goto(`${webOrigin}/`);
    const dot = page.getByRole("link", { name: "Admin sign in", exact: true });
    await dot.waitFor();
    assert.equal(await dot.innerText(), ".");
    const bounds = await dot.boundingBox();
    assert.ok(bounds.width >= 44 && bounds.height >= 44);
    assert.ok(bounds.x + bounds.width >= 1430 && bounds.y < 50);
    assert.equal(
      await page
        .getByRole("link", { name: "Studio dashboard", exact: false })
        .count(),
      0,
    );
    await dot.click();
    await page.waitForURL("**/admin");
    await page.getByRole("heading", { name: "Let’s get to work." }).waitFor();
    const protectedResponse = await context.request.get(
      `${webOrigin}/api/admin/overview`,
    );
    assert.equal(protectedResponse.status(), 401);
  });
  await check("Public routes render successfully", async () => {
    for (const path of [
      "services",
      "work",
      "team",
      "videos",
      "contact",
      "quote",
      "about",
      "solutions",
      "privacy",
      "terms",
    ]) {
      const response = await page.goto(`${webOrigin}/${path}`);
      assert.equal(response.status(), 200, path);
      assert.ok(await page.locator("h1").count(), path);
      await noOverflow(page);
    }
  });
  await check(
    "Portfolio search, category filtering and project detail",
    async () => {
      await page.goto(`${webOrigin}/work`);
      await page
        .getByRole("textbox", { name: "Search projects" })
        .fill("booking");
      await page
        .getByRole("heading", { name: "Every booking, in one place" })
        .waitFor();
      assert.equal(await page.locator(".project-card").count(), 1);
      await page.locator(".project-card").click();
      await page.waitForURL("**/work/*");
      await page
        .getByRole("heading", {
          name: "Every booking, in one place",
          exact: true,
        })
        .waitFor();
      await page
        .getByText("This is a demonstration", { exact: false })
        .waitFor();
    },
  );
  await check("Enquiry form stores a real record", async () => {
    await page.goto(`${webOrigin}/quote`);
    await page.getByLabel("Your name").fill("Browser Test Client");
    await page.getByLabel("Email address").fill("client@example.test");
    await page
      .getByLabel("Tell us about your project")
      .fill("A simple website for a small Nairobi business.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Request a quotation" }).click();
    await page
      .getByRole("heading", { name: "You’ve made the first move." })
      .waitFor();
  });
  await check("Secure login and dashboard enquiry follow-up", async () => {
    await page.goto(`${webOrigin}/admin`);
    await page.getByLabel("Email address").fill("browser@example.test");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Open my workspace" }).click();
    await page
      .getByRole("heading", { name: "A clearer view of your studio." })
      .waitFor();
    await page
      .getByRole("navigation", { name: "Dashboard navigation" })
      .getByRole("button", { name: "Enquiries", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Edit Enquiry from Browser Test Client" })
      .click();
    await page.getByLabel("Pipeline stage").selectOption("Contacted");
    await page
      .getByLabel("Follow-up and communication notes")
      .fill("Followed up after the website enquiry.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page
      .locator("td .badge")
      .filter({ hasText: /^Contacted$/ })
      .waitFor();
    await page.screenshot({
      path: resolve(results, "dashboard-desktop.png"),
      fullPage: true,
    });
  });
  await check("Draft preview, publish and content history", async () => {
    await page
      .getByRole("navigation", { name: "Dashboard navigation" })
      .getByRole("button", { name: "Pages", exact: true })
      .click();
    await page.getByRole("button", { name: "Add page", exact: true }).click();
    await page.getByLabel("Title / name").fill("Our approach");
    await page.getByLabel("URL slug").fill("our-approach");
    await page
      .getByLabel("Description", { exact: true })
      .fill("Built together, with useful feedback at every stage.");
    await page.getByRole("button", { name: "Preview draft" }).click();
    await page
      .getByRole("heading", { name: "Our approach", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Back to editor" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Edit Our approach" }).waitFor();
    let response = await fetch(`${webOrigin}/our-approach`);
    assert.equal(response.status, 404);
    await page.getByRole("button", { name: "Edit Our approach" }).click();
    await page.getByLabel("Publication status").selectOption("published");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Edit Our approach" }).waitFor();
    response = await fetch(`${webOrigin}/our-approach`);
    assert.equal(response.status, 200);
    await page.getByRole("button", { name: "Edit Our approach" }).click();
    await page.getByRole("button", { name: "Version history" }).click();
    await page.getByText("Version 1", { exact: false }).waitFor();
    await page.getByRole("button", { name: "Close editor" }).click();
  });
  await check(
    "Brand changes propagate to public HTML and metadata",
    async () => {
      await page
        .getByRole("navigation", { name: "Dashboard navigation" })
        .getByRole("button", { name: "Brand & settings" })
        .click();
      await page
        .getByLabel("Brand name", { exact: true })
        .fill("Browser Studio");
      await page.getByRole("button", { name: "Save settings" }).click();
      await page.getByText("Settings saved.", { exact: false }).waitFor();
      const response = await fetch(`${webOrigin}/`);
      const html = await response.text();
      assert.ok(html.includes("Browser Studio"));
      assert.ok(html.includes("<title>Browser Studio"));
    },
  );
  await check(
    "Quotation editor, secure totals and PDF print view",
    async () => {
      await page
        .getByRole("navigation", { name: "Dashboard navigation" })
        .getByRole("button", { name: "Quotations", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Add quotation", exact: true })
        .click();
      await page.getByLabel("Title / name").fill("Business website");
      await page
        .getByLabel("Client / organization")
        .fill("Browser Test Client");
      await page
        .getByLabel("Description", { exact: true })
        .fill("Design and development");
      await page.getByLabel("Quantity", { exact: true }).fill("2");
      await page.getByLabel("Unit price", { exact: true }).fill("1000");
      await page.getByLabel("Tax percentage").fill("16");
      await page.getByRole("button", { name: "Save changes" }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Edit Business website" }).click();
      await page
        .getByText("Saved total: KES 2320.00", { exact: false })
        .waitFor();
      const popupPromise = page.waitForEvent("popup");
      await page.getByRole("button", { name: "Print / save PDF" }).click();
      const popup = await popupPromise;
      await popup
        .getByRole("heading", { name: "Total: KES 2320.00" })
        .waitFor();
      await popup.close();
      await page.getByRole("button", { name: "Close editor" }).click();
    },
  );
  await check(
    "Every administration module opens with authorized data",
    async () => {
      for (const [label, path] of [
        ["Services", "/admin/records/services"],
        ["Portfolio", "/admin/records/projects"],
        ["Team", "/admin/records/team"],
        ["Videos", "/admin/records/videos"],
        ["Testimonials", "/admin/records/testimonials"],
        ["Clients", "/admin/records/clients"],
        ["Navigation", "/admin/records/navigation"],
        ["Page sections", "/admin/records/sections"],
        ["Analytics", "/admin/analytics"],
        ["Users & permissions", "/admin/users"],
        ["Audit log", "/admin/audit"],
      ]) {
        const result = page.waitForResponse(
          (r) =>
            r.url().includes("/api" + path) && r.request().method() === "GET",
        );
        await page
          .getByRole("navigation", { name: "Dashboard navigation" })
          .getByRole("button", { name: label, exact: true })
          .click();
        assert.equal((await result).status(), 200, label);
        await page.waitForFunction(
          () => !document.querySelector(".loading-note"),
        );
      }
    },
  );
  await check(
    "Media library uploads, displays and deletes a validated image",
    async () => {
      await page
        .getByRole("navigation", { name: "Dashboard navigation" })
        .getByRole("button", { name: "Media library", exact: true })
        .click();
      const image = await page.screenshot();
      await page.locator("input[type=file]").setInputFiles({
        name: "browser-check.png",
        mimeType: "image/png",
        buffer: image,
      });
      await page
        .locator(".media-card strong")
        .filter({ hasText: "browser-check.png" })
        .waitFor();
      const preview = page.locator(".media-card img");
      await preview.waitFor();
      await preview.evaluate((img) => img.decode());
      page.once("dialog", (dialog) => dialog.accept());
      await page
        .getByRole("button", { name: "Delete browser-check.png", exact: true })
        .click();
      await page.locator(".media-card").waitFor({ state: "hidden" });
    },
  );
  await check(
    "Tablet and mobile public layouts, menu and image loading",
    async () => {
      for (const width of [768, 390, 360, 320]) {
        await page.setViewportSize({ width, height: 844 });
        for (const path of ["/", "/services", "/work", "/team", "/contact"]) {
          await page.goto(`${webOrigin}` + path);
          await noOverflow(page);
          const dot = page.getByRole("link", {
            name: "Admin sign in",
            exact: true,
          });
          const box = await dot.boundingBox();
          assert.ok(box && box.x >= width - 50 && box.width >= 44);
        }
        if (width === 390) {
          await page.goto(`${webOrigin}/`);
          await page.screenshot({
            path: resolve(results, "home-mobile.png"),
            fullPage: true,
          });
        }
        if (width === 390) {
          await page.goto(`${webOrigin}/`);
          await page
            .getByRole("button", { name: "Open menu", exact: true })
            .click();
          await page
            .getByRole("navigation", { name: "Mobile navigation" })
            .getByRole("link", { name: "Work", exact: true })
            .click();
          await page.waitForURL("**/work");
          await page.screenshot({
            path: resolve(results, "work-mobile.png"),
            fullPage: true,
          });
        }
      }
    },
  );
  await check("Mobile dashboard navigation and logout", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${webOrigin}/admin`);
    await page
      .getByRole("heading", { name: "A clearer view of your studio." })
      .waitFor();
    await noOverflow(page);
    await page.getByRole("button", { name: "Open dashboard menu" }).click();
    await page
      .getByRole("navigation", { name: "Dashboard navigation" })
      .getByRole("button", { name: "Brand & settings" })
      .click();
    await page.getByLabel("Brand name", { exact: true }).waitFor();
    await noOverflow(page);
    await page.screenshot({
      path: resolve(results, "dashboard-mobile.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Open dashboard menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("heading", { name: "Let’s get to work." }).waitFor();
  });
  assert.deepEqual(errors, [], "Browser runtime or server errors");
  writeFileSync(
    resolve(results, "browser-results.json"),
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        runtimeErrors: errors,
        database: "Disposable SQLite; no live credentials used",
        cloudinary: "Contract tests only; live credentials not supplied",
      },
      null,
      2,
    ),
  );
  console.log(
    `\n${checks.length} browser checks passed. Screenshots: test-results/`,
  );
} catch (error) {
  console.error(error);
  writeFileSync(
    resolve(results, "browser-failure.txt"),
    String(error.stack || error),
  );
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  for (const child of children) child.kill();
}
