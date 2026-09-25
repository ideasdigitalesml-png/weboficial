// Generates static JPEG thumbnails for templates that have no raw-HTML
// source under /templates/ (see generate-previews.js's comment for the
// templates that DO) -- currently just psicologos' three layouts. Those
// components use next/font and Tailwind, neither of which renders
// faithfully outside Next's own pipeline, so unlike generate-previews.js
// this can't just fill placeholders into a static HTML string: it boots a
// real `next dev` server, points Playwright at the dev-only preview routes
// under src/app/dev-preview/ (404s in production -- see that route's own
// NODE_ENV guard), and screenshots each one.
//
// Re-run this whenever a psicologo template's markup/styles change:
//   npm run generate:previews:psicologo
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.join(__dirname, "..", "public", "previews");
const VIEWPORT = { width: 1440, height: 900 };
const JPEG_QUALITY = 80;
const READY_TIMEOUT_MS = 120_000;
const READY_POLL_INTERVAL_MS = 1_000;

const JOBS = [
  { layout: "moderno", name: "psicologo-moderno" },
  { layout: "clasico", name: "psicologo-clasico" },
  { layout: "minimal", name: "psicologo-minimal" },
];

function waitForServerReady(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        // The dev-preview route itself must resolve to a real 200 here --
        // this isn't just "is the server up", it's "is this specific route
        // actually rendering" (a 404 would mean the route/param is wrong,
        // and silently moving on would screenshot Next's 404 page instead
        // of the template, exactly the bug this check exists to catch).
        if (res.status === 200) {
          resolve();
          return;
        }
      } catch {
        // Server not accepting connections yet -- keep polling.
      }
      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for ${url} to return 200`));
        return;
      }
      setTimeout(attempt, READY_POLL_INTERVAL_MS);
    };
    attempt();
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Starting next dev on port ${PORT}...`);
  const devServer = spawn(
    "npx",
    ["next", "dev", "--port", String(PORT)],
    {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      // See next.config.ts: hides the dev-mode route indicator badge so it
      // doesn't show up in the screenshotted thumbnails.
      env: { ...process.env, HIDE_DEV_INDICATOR: "1" },
    }
  );

  const cleanup = () => {
    devServer.kill("SIGTERM");
  };
  process.on("exit", cleanup);

  try {
    await waitForServerReady(`${BASE_URL}/dev-preview/psicologo/moderno`, READY_TIMEOUT_MS);

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: VIEWPORT });

    for (const job of JOBS) {
      const url = `${BASE_URL}/dev-preview/psicologo/${job.layout}`;
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });

      if (!response || response.status() !== 200) {
        throw new Error(`${url} returned status ${response ? response.status() : "(no response)"}`);
      }

      const jpgOutputPath = path.join(OUTPUT_DIR, `${job.name}.jpg`);
      await page.screenshot({ path: jpgOutputPath, type: "jpeg", quality: JPEG_QUALITY });
      console.log(`ok - ${url} -> public/previews/${job.name}.jpg`);
    }

    await browser.close();
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
