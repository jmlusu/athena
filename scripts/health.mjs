#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const results = [];
const RUFF_BASELINE = 81;

function record(name, status, detail) {
  results.push({ name, status, detail });
  console.log(`[${status}] ${name} — ${detail}`);
}

function run(cmd, args, opts = {}) {
  try {
    const out = execFileSync(cmd, args, {
      encoding: "utf8",
      cwd: opts.cwd ?? ROOT,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status ?? 1, out: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function gitFiles() {
  return run("git", ["ls-files"]).out.split(/\r?\n/).filter(Boolean);
}

// 1. structure
{
  const required = [
    "ARCHITECTURE.md", "AGENTS.md", "ATHENA_MASTER_SPEC.md", ".env.example",
    "package.json", "server.ts", "athena-mapper.ts", "src", "tests/server",
    "backend/src/athena", "backend/pyproject.toml", "e2e", "docs", "repo-audit",
    ".github/workflows",
  ];
  const missing = required.filter((p) => !existsSync(`${ROOT}/${p}`));
  const rootMd = readdirSync(ROOT).filter((f) => f.endsWith(".md"));
  const allowlist = [
    "README.md", "ARCHITECTURE.md", "AGENTS.md", "ATHENA_MASTER_SPEC.md",
    "CHANGELOG.md", "ATHENA PHASED APPROVAL & ROLLBACK PROTOCOL.md",
  ];
  const loose = rootMd.filter((f) => !allowlist.includes(f));
  const dupDirs = ["athena", "frontend", "backend2", "opencode"].filter(
    (d) => existsSync(`${ROOT}/${d}`),
  );
  const badNames = gitFiles().filter((f) =>
    /_(new|v2|final|latest|backup|old|temp)\.[a-z0-9]+$/i.test(f),
  );
  if (missing.length || loose.length || dupDirs.length || badNames.length) {
    const parts = [];
    if (missing.length) parts.push(`missing: ${missing.join(", ")}`);
    if (loose.length) parts.push(`loose root .md: ${loose.join(", ")}`);
    if (dupDirs.length) parts.push(`duplicate dirs: ${dupDirs.join(", ")}`);
    if (badNames.length) parts.push(`versioned names: ${badNames.join(", ")}`);
    record("structure", "FAIL", parts.join("; "));
  } else {
    record("structure", "PASS", `${required.length} required paths, root .md allowlisted`);
  }
}

// 2. dependencies
{
  const npm = run("npm", ["ls", "--depth=0"]);
  const pkg = JSON.parse(readFileSync(`${ROOT}/package.json`, "utf8"));
  const banned = ["@google/genai", "motion", "autoprefixer"].filter(
    (d) => pkg.dependencies?.[d] || pkg.devDependencies?.[d],
  );
  const pyproject = existsSync(`${ROOT}/backend/pyproject.toml`)
    && existsSync(`${ROOT}/backend/uv.lock`);
  if (npm.code !== 0) {
    record("dependencies", "FAIL", `npm ls reported problems: ${npm.out.trim().split("\n").slice(-3).join(" | ")}`);
  } else if (banned.length || !pyproject) {
    record("dependencies", "FAIL", `${banned.length ? `banned deps present: ${banned.join(", ")}` : "pyproject/uv.lock missing"}`);
  } else {
    record("dependencies", "PASS", `npm tree clean (${Object.keys(pkg.dependencies).length} deps), backend lockfile present`);
  }
}

// 3. configuration
{
  const tracked = gitFiles();
  const trackedEnv = tracked.filter(
    (f) => /^\.env$|^\.env\.(?!example|production\.example)/.test(f) || f.endsWith(".key"),
  );
  const gitignore = readFileSync(`${ROOT}/.gitignore`, "utf8");
  const issues = [];
  if (trackedEnv.length) issues.push(`tracked secret files: ${trackedEnv.join(", ")}`);
  if (!gitignore.includes(".env")) issues.push(".gitignore missing .env entry");
  if (!existsSync(`${ROOT}/.env.example`)) issues.push(".env.example missing");
  if (!existsSync(`${ROOT}/backend/.env.production.example`)) issues.push("backend/.env.production.example missing");
  if (issues.length) record("configuration", "FAIL", issues.join("; "));
  else record("configuration", "PASS", ".env.example present, no secret files tracked, .env ignored");
}

// 4. types (tsc --noEmit)
{
  const r = run("npm", ["run", "lint"]);
  record("types", r.code === 0 ? "PASS" : "FAIL",
    r.code === 0 ? "tsc --noEmit clean" : r.out.trim().split("\n").slice(-8).join("\n"));
}

// 5. lint (ruff, baseline-tolerant)
{
  const r = run("uv", ["run", "ruff", "check", "."], { cwd: `${ROOT}/backend` });
  const m = r.out.match(/Found (\d+) error/);
  const count = m ? Number(m[1]) : r.code === 0 ? 0 : null;
  if (count === 0) record("lint", "PASS", "ruff clean");
  else if (count !== null && count <= RUFF_BASELINE)
    record("lint", "WARN", `ruff ${count} errors (pre-existing baseline ${RUFF_BASELINE}; no new errors)`);
  else record("lint", "FAIL", count === null ? `ruff failed: ${r.out.trim().split("\n").slice(-3).join(" ")}` : `ruff ${count} errors exceeds baseline ${RUFF_BASELINE}`);
}

// 6. tests
{
  const unit = run("npm", ["run", "test:unit"]);
  const unitPass = (unit.out.match(/ℹ pass (\d+)/) ?? [])[1] ?? "?";
  const unitFail = (unit.out.match(/ℹ fail (\d+)/) ?? [])[1] ?? "?";
  const pytest = run("uv", ["run", "pytest", "-q"], { cwd: `${ROOT}/backend` });
  const pyPass = (pytest.out.match(/(\d+) passed/) ?? [])[1] ?? "?";
  const pyFail = (pytest.out.match(/(\d+) failed/) ?? [])[1] ?? "0";
  if (unit.code !== 0 || pytest.code !== 0) {
    record("tests", "FAIL", `node: ${unitPass} passed/${unitFail} failed; pytest: ${pyPass} passed/${pyFail} failed`);
  } else {
    record("tests", "PASS", `node ${unitPass}/58 pass, pytest ${pyPass} passed`);
  }
}

// 7. build
{
  const r = run("npm", ["run", "build"]);
  record("build", r.code === 0 ? "PASS" : "FAIL",
    r.code === 0 ? "vite + esbuild bundle OK" : r.out.trim().split("\n").slice(-8).join("\n"));
}

// 8. security
{
  const tracked = gitFiles();
  const forbidden = tracked.filter((f) =>
    /\.(key|pem|p12|pfx)$/.test(f) || /^\.env$/.test(f) || /(^|\/)\.env\.(local|development|production)$/.test(f),
  );
  const keyScan = run("git", ["grep", "-lE", "AIza[0-9A-Za-z_-]{35}|BEGIN [A-Z ]*PRIVATE KEY"]);
  const hits = keyScan.code === 0 ? keyScan.out.split(/\r?\n/).filter(Boolean) : [];
  if (forbidden.length || hits.length) {
    const parts = [];
    if (forbidden.length) parts.push(`forbidden files: ${forbidden.join(", ")}`);
    if (hits.length) parts.push(`possible secrets in: ${hits.join(", ")}`);
    record("security", "FAIL", parts.join("; "));
  } else {
    record("security", "PASS", "no key files, no .env, no key material in tracked content");
  }
}

// 9. generated artifacts
{
  const tracked = gitFiles();
  const gen = tracked.filter((f) =>
    /\.npy$|\.pyc$|\.pyo$|egg-info|__pycache__|\.pytest_cache|\.ipynb_checkpoints|(^|\/)dist\/|(^|\/)node_modules\//.test(f),
  );
  if (gen.length) record("generated-artifacts", "FAIL", `tracked: ${gen.slice(0, 10).join(", ")}`);
  else record("generated-artifacts", "PASS", "no build/cache/binary artifacts tracked");
}

// 10. git status
{
  const r = run("git", ["status", "--porcelain"]);
  const dirty = r.out.split(/\r?\n/).filter(Boolean);
  if (dirty.length === 0) record("git-status", "PASS", "working tree clean");
  else record("git-status", "WARN", `${dirty.length} uncommitted change(s): ${dirty.slice(0, 5).join(" | ")}${dirty.length > 5 ? " …" : ""}`);
}

// e2e (optional)
record("e2e", "WARN", "not run — requires backend+frontend services (npm run test:e2e)");

const fail = results.filter((r) => r.status === "FAIL").length;
const warn = results.filter((r) => r.status === "WARN").length;
const pass = results.filter((r) => r.status === "PASS").length;
const overall = fail > 0 ? "FAIL" : warn > 0 ? "WARN" : "PASS";
console.log(`\nSUMMARY: ${pass} PASS, ${warn} WARN, ${fail} FAIL → ${overall}`);
process.exit(fail > 0 ? 1 : 0);
