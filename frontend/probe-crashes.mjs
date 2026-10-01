import { chromium } from "@playwright/test";

const BASE = "http://localhost:1111";
const JOB_ID = "b22d0000-0000-4000-8000-000000000001";

const results = [];

async function probe(path, checks) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 150)); });
  try {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    if (checks) await checks(page);
    const body = await page.locator("body").innerText();
    results.push(`PATH ${path}: finalUrl=${page.url()} errors=${JSON.stringify(errors)} bodyLen=${body.length}`);
    results.push(`  TEXT: ${body.slice(0, 300).replace(/\n/g, " | ")}`);
  } catch (e) {
    results.push(`PATH ${path}: PROBE_FAIL ${e.message} errors=${JSON.stringify(errors)}`);
  } finally {
    await browser.close();
  }
}

await probe("/jobs");
await probe(`/jobs/${JOB_ID}`);
await probe("/documents", async (page) => {
  const toggle = page.locator('[data-testid="dehumanize-toggle"]');
  const exists = await toggle.count();
  results.push(`TOGGLE: count=${exists}`);
  if (exists) {
    const before = await toggle.isChecked();
    await toggle.click({ force: true });
    await page.waitForTimeout(500);
    const after = await toggle.isChecked();
    const track = page.locator('[data-testid="dehumanize-toggle-container"] div');
    const bg = await track.evaluate((el) => getComputedStyle(el).backgroundColor).catch(() => "n/a");
    results.push(`TOGGLE: before=${before} after=${after} trackBg=${bg}`);
    await toggle.click({ force: true });
    await page.waitForTimeout(300);
    results.push(`TOGGLE: restored=${await toggle.isChecked()}`);
  }
});

console.log("\n=== PROBE RESULTS ===");
for (const r of results) console.log(r);
console.log("=== END ===");
