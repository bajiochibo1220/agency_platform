// Exercise actual client error handling without network requests or credentials.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../frontend/node_modules/typescript/lib/typescript.js";
const source = readFileSync(
  new URL("../frontend/src/lib/api.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { api } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const originalFetch = globalThis.fetch;
try {
  for (const [status, body, pattern] of [
    [403, "Untrusted origin", /allowed website address/],
    [
      404,
      JSON.stringify({ detail: "Not Found" }),
      /backend may need to be updated/,
    ],
    [502, "<html>Bad gateway</html>", /temporarily unavailable/],
    [
      401,
      JSON.stringify({ detail: "Email or password is incorrect." }),
      /Email or password is incorrect/,
    ],
    [
      422,
      JSON.stringify({ detail: [{ msg: "A valid email is required" }] }),
      /valid email/,
    ],
    [400, JSON.stringify({ detail: { unexpected: "shape" } }), /HTTP 400/],
  ]) {
    globalThis.fetch = async () => new Response(body, { status });
    await assert.rejects(() => api("/auth/setup"), pattern);
  }
  console.log("6 API client error checks passed (mocked responses).");
} finally {
  globalThis.fetch = originalFetch;
}
