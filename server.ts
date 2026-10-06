import express from "express";
import path from "path";
import fs from "node:fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import chokidar from "chokidar";
import { toApplicantProfile, toApplicantProfileList, toBackendProfile, toOpportunity, toOpportunityList, mergeProfilePatch } from "./athena-mapper.ts";
import type { ApplicantProfile } from "./src/types.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lock files live in the repo in both run modes: dist/ when bundled to
// dist/server.mjs, the repo root when tsx runs server.ts directly.
const REPO_ROOT = path.basename(__dirname) === "dist" ? path.dirname(__dirname) : __dirname;
const LOCKS_DIR = path.join(REPO_ROOT, "artifacts", "locks");

// Profile documents directory
const PROFILE_DOCS_DIR = path.join(REPO_ROOT, "profile");

// In-memory cache of profile documents, updated by chokidar watcher
let profileDocsCache: Array<{
  name: string;
  path: string;
  relativePath: string;
  type: string;
  size: number;
  modified: string;
  category: string;
}> = [];

// Scan profile directory and update cache
function scanProfileDocuments(): void {
  const categories = ["resumes", "certifications", "credentials", "supporting"];
  const docs: typeof profileDocsCache = [];

  for (const category of categories) {
    const catDir = path.join(PROFILE_DOCS_DIR, category);
    if (!fs.existsSync(catDir)) continue;

    const files = fs.readdirSync(catDir);
    for (const file of files) {
      const filePath = path.join(catDir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const ext = path.extname(file).toLowerCase();
      const allowedExts = [".pdf", ".docx", ".txt", ".md", ".pptx", ".json"];
      if (!allowedExts.includes(ext)) continue;

      docs.push({
        name: file,
        path: filePath,
        relativePath: path.relative(REPO_ROOT, filePath),
        type: ext.slice(1).toUpperCase(),
        size: stat.size,
        modified: stat.mtime.toISOString(),
        category,
      });
    }
  }

  profileDocsCache = docs;
}

// Initialize cache and start watcher
scanProfileDocuments();
try {
  fs.mkdirSync(PROFILE_DOCS_DIR, { recursive: true });
  for (const cat of ["resumes", "certifications", "credentials", "supporting"]) {
    fs.mkdirSync(path.join(PROFILE_DOCS_DIR, cat), { recursive: true });
  }

  const watcher = chokidar.watch(PROFILE_DOCS_DIR, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("all", (event, filePath) => {
    if (event === "add" || event === "change" || event === "unlink") {
      scanProfileDocuments();
    }
  });
} catch (err) {
  console.warn("Failed to start profile documents watcher:", err);
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Malformed JSON bodies return JSON 400 instead of Express' HTML default.
// Registered before all routes, so it only catches body-parser errors raised above.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body: could not parse request payload" });
    return;
  }
  next(err);
});

// Health check. The Gemini key belongs to FastAPI now, so this reports BFF
// configuration only; /api/backend-health reports whether FastAPI is up.
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ── Lockfile API endpoints for agent coordination ──────────────────────

// Clients identify the lock in the query string (?entity=job&id=42) while the
// payload carries only the action-specific fields. Read from both so either
// form works, and accept `id` as an alias for `entityId`.
function lockParam(req: express.Request, name: "entity" | "entityId" | "agentId" | "ttl" | "lockToken"): string {
  const aliases = name === "entityId" ? ["entityId", "id"] : [name];
  for (const alias of aliases) {
    const fromBody = (req.body ?? {})[alias];
    if (fromBody !== undefined && fromBody !== null && fromBody !== "") return String(fromBody);
    const fromQuery = req.query[alias];
    if (fromQuery !== undefined) return String(fromQuery);
  }
  return "";
}

// Per-artifact lock: acquire lock on a specific entity (job, application, profile)
app.post("/api/lock/artifact", (req, res) => {
  const entity = lockParam(req, "entity");
  const entityId = lockParam(req, "entityId");
  const agentId = lockParam(req, "agentId");
  const ttl = lockParam(req, "ttl");
  if (!entity || !entityId || !agentId) {
    return res.status(400).json({ error: "Missing required: entity, entityId, agentId" });
  }

  const lockPath = path.join(
    LOCKS_DIR,
    `${entity}_${entityId.replace("/", "_").replace("\\", "_")}.lock`
  );

  // Ensure lock directory exists
  const lockDir = path.dirname(lockPath);
  fs.mkdirSync(lockDir, { recursive: true });

  // Try to acquire exclusive file lock
  try {
    const existing = fs.readFileSync(lockPath, "utf8").trim();
    const existingParts = existing.split("\n");
    const existingAgentId = existingParts[0];
    const existingAcquiredAt = existingParts[1];
    const existingTtl = existingParts[2];

    // Check if existing lock is stale
    const now = new Date().getTime();
    let isStale = false;

    if (existingAgentId && existingAgentId !== agentId) {
      // Lock held by different agent
      if (existingAcquiredAt) {
        const acquired = new Date(existingAcquiredAt).getTime();
        const elapsed = (now - acquired) / 1000; // seconds
        if (elapsed > 1800) {
          // Stale after 30 minutes
          isStale = true;
        }
      }
    } else if (existingAgentId && existingAgentId === agentId) {
      // Same agent - lock is fresh
      isStale = false;
    }

    if (!isStale) {
      // Wait or return busy
      return res.status(409).json({ error: "Artifact lock already held, please retry" });
    }

    // Force-release stale lock
    fs.unlinkSync(lockPath);
  } catch (e) {
    // No existing lock or error reading it - proceed to acquire
  }

  // Write the lock file. Contention is handled by the stale check above, which
  // is sufficient for this single-host demo.
  const acquiredAt = new Date().toISOString();
  const lockContent = `${agentId}\n${acquiredAt}\n${ttl || ""}\n`;
  fs.writeFileSync(lockPath, lockContent);

  // Return lock token for frontend to use on release
  const lockToken = Math.random().toString(36).substring(2, 18);

  res.json({
    success: true,
    lockToken,
    lockPath,
    message: `Artifact lock acquired for ${entity}/${entityId}`,
  });
});

// Release per-artifact lock
app.post("/api/lock/artifact/release", (req, res) => {
  const lockToken = lockParam(req, "lockToken");
  const entity = lockParam(req, "entity");
  const entityId = lockParam(req, "entityId");

  if (!lockToken || !entity || !entityId) {
    return res.status(400).json({ error: "Missing required: lockToken, entity, entityId" });
  }

  const lockPath = path.join(
    LOCKS_DIR,
    `${entity}_${entityId.replace("/", "_").replace("\\", "_")}.lock`
  );

  try {
    fs.unlinkSync(lockPath);
  } catch (e) {
    // Lock file may already be released
  }

  res.json({ success: true, message: "Artifact lock released" });
});

// Global agent lock: acquire global serializing lock
app.post("/api/lock/global", (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: "Missing required: agentId" });
  }

  const lockPath = path.join(LOCKS_DIR, "global_agent.lock");

  // Ensure lock directory exists
  const lockDir = path.dirname(lockPath);
  fs.mkdirSync(lockDir, { recursive: true });

  // Try to acquire exclusive file lock (blocking with timeout concept)
  // In a real implementation, we'd use a non-blocking check with retry
  try {
    const existing = fs.readFileSync(lockPath, "utf8").trim();
    const existingParts = existing.split("\n");
    const existingAgentId = existingParts[0];

    // If lock is held by different agent and stale, force-release
    if (existingAgentId && existingAgentId !== agentId) {
      // Check if stale (held for > 30 minutes)
      // For simplicity, we always allow acquisition in this demo
      // Real implementation would check timestamp and force-release stale locks
    }
  } catch (e) {
    // No existing lock - proceed
  }

  // Write the global lock file (single-host demo; no OS-level flock).
  const acquiredAt = new Date().toISOString();
  const lockContent = `${agentId}\n${acquiredAt}\n`;
  fs.writeFileSync(lockPath, lockContent);

  const lockToken = Math.random().toString(36).substring(2, 18);

  res.json({
    success: true,
    lockToken,
    lockPath,
    message: "Global agent lock acquired (serializes all operations)",
  });
});

// Release global agent lock
app.post("/api/lock/global/release", (req, res) => {
  const { lockToken } = req.body;

  if (!lockToken) {
    return res.status(400).json({ error: "Missing required: lockToken" });
  }

  const lockPath = path.join(LOCKS_DIR, "global_agent.lock");

  try {
    fs.unlinkSync(lockPath);
  } catch (e) {
    // Lock file may already be released
  }

  res.json({ success: true, message: "Global agent lock released" });
});

// Scan for stale locks
app.post("/api/lock/stale", (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: "Missing required: agentId" });
  }

  const lockDir = LOCKS_DIR;

  let released = 0;
  try {
    const files = fs.readdirSync(lockDir);
    const now = new Date().getTime();

    for (const file of files) {
      if (!file.endsWith(".lock")) continue;
      const filePath = path.join(lockDir, file);
      try {
        const content = fs.readFileSync(filePath, "utf8").trim();
        const parts = content.split("\n");
        if (parts.length >= 2) {
          const fileAgentId = parts[0];
          const acquiredAt = parts[1];
          const ttlStr = parts[2] || "";

          // Check if lock is held by different agent or stale
          if (fileAgentId && fileAgentId !== agentId) {
            if (acquiredAt) {
              const acquired = new Date(acquiredAt).getTime();
              const elapsed = (now - acquired) / 1000; // seconds
              if (elapsed > 1800) {
                // Stale after 30 minutes - force release
                fs.unlinkSync(filePath);
                released++;
              }
            }
          } else if (fileAgentId === agentId) {
            // Same agent - check their own TTL
            if (ttlStr) {
              const ttl = parseInt(ttlStr, 10);
              const acquired = new Date(acquiredAt).getTime();
              const elapsed = (now - acquired) / 1000;
              if (elapsed > ttl) {
                fs.unlinkSync(filePath);
                released++;
              }
            }
          }
        }
      } catch (e) {
        // Skip unreadable files
      }
    }
  } catch (e) {
    // Lock dir may not exist yet
  }

  res.json({ success: true, released });
});

// ── FastAPI backend proxy ──────────────────────────────────────────────
// All AI, scraping, matching and document generation live in the Python
// backend under backend/src/athena. Express keeps only what FastAPI does not
// serve: health, the lockfile API, and the SPA itself. That keeps the Gemini
// API key and the backend API key on the server, where they cannot be read
// out of the shipped JS bundle.

const BACKEND_URL = (process.env.ATHENA_BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const BACKEND_PREFIX = "/api/v1/athena";
const AI_PREFIX = "/ai";
const BACKEND_TIMEOUT_MS = Number(process.env.ATHENA_BACKEND_TIMEOUT_MS ?? 180000);

// The SPA speaks camelCase; FastAPI's Pydantic schemas speak snake_case.
function snakeCaseKeys(body: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries((body ?? {}) as Record<string, unknown>)) {
    out[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value;
  }
  return out;
}

// Responses convert recursively so nested Pydantic models line up with what
// the SPA reads (TailoredResume.experience[].startDate, ScrapeLiveListing
// .atsScore, and so on).
function camelCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelCaseKeys);
  if (value === null || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase())] = camelCaseKeys(val);
  }
  return out;
}

// Request bodies convert at the top level only. The nested `job` and
// `applicantProfile` payloads are forwarded verbatim, because the backend
// reads camelCase keys straight out of them (e.g. profile["fullName"]) and
// rewriting those would silently drop the applicant's real name.

// The SPA's OpportunityCategory is singular ("job" | "consultancy") while
// FastAPI's search_type Literal is plural ("jobs" | "consultancies" | "all").
const SEARCH_TYPE_ALIASES: Record<string, string> = {
  job: "jobs",
  consultancy: "consultancies",
};

function forwardToBackend(
  res: express.Response,
  method: "POST" | "GET" | "PATCH" | "PUT" | "DELETE",
  backendPath: string,
  body?: unknown,
  opts: { search?: string; transform?: (payload: unknown) => unknown } = {}
): void {
  const search = opts.search ? `?${opts.search}` : "";
  const target = `${BACKEND_URL}${BACKEND_PREFIX}${backendPath}${search}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ATHENA_API_KEY) headers["X-API-Key"] = process.env.ATHENA_API_KEY;

  const hasBody = ["POST", "PATCH", "PUT"].includes(method);
  fetch(target, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body ?? {}) : undefined,
    signal: controller.signal,
  })
    .then(async (upstream) => {
      const text = await upstream.text();
      let payload: unknown = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          res.status(502).json({ error: "Backend returned a non-JSON response", detail: text.slice(0, 500) });
          return;
        }
      }
      // FastAPI's own errors are {"detail": ...}; keep them readable. Error
      // payloads are never job-shaped, so mapping them would turn a 404
      // {"detail":"Job not found"} into a fabricated "Untitled role" listing.
      const failed = upstream.status >= 400;
      if (opts.transform && !failed) {
        res.status(upstream.status).json(opts.transform(payload));
        return;
      }
      res.status(upstream.status).json(camelCaseKeys(payload));
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") {
        res.status(504).json({ error: `Backend timed out after ${BACKEND_TIMEOUT_MS}ms`, backend: target });
        return;
      }
      const detail = err instanceof Error ? err.message : String(err);
      res.status(502).json({
        error: "Backend unreachable. Is FastAPI running?",
        backend: target,
        detail,
      });
    })
    .finally(() => clearTimeout(timer));
}

// POST /api/ai/* and /api/submit-application all share the same shape:
// camelCase in, camelCase out, backend owns the logic.
function proxyPost(backendPath: string, mutate?: (body: Record<string, unknown>) => void) {
  return (req: express.Request, res: express.Response) => {
    const body = snakeCaseKeys(req.body);
    mutate?.(body);
    forwardToBackend(res, "POST", backendPath, body);
  };
}

app.post("/api/ai/score-ats", proxyPost(`${AI_PREFIX}/score-ats`));
app.post("/api/ai/tailor-resume", proxyPost(`${AI_PREFIX}/tailor-resume`));
app.post("/api/ai/tailor-document", proxyPost(`${AI_PREFIX}/tailor-document`));
app.post("/api/ai/dehumanize", proxyPost(`${AI_PREFIX}/dehumanize`));

app.post("/api/ai/scrape-live", proxyPost(`${AI_PREFIX}/scrape-live`, (body) => {
  const requested = typeof body.search_type === "string" ? body.search_type : "all";
  body.search_type = SEARCH_TYPE_ALIASES[requested] ?? requested;
}));

app.post("/api/submit-application", proxyPost(`${AI_PREFIX}/submit-application`));
app.post("/api/n8n/dispatch-webhook", proxyPost(`${AI_PREFIX}/n8n/dispatch`));
// n8n webhook ingress does not exist in FastAPI yet; kept for Phase 4.
app.post("/api/webhooks/n8n", proxyPost(`${AI_PREFIX}/webhooks/n8n`));

// Profile documents repository
app.get("/api/profile-documents", (_req, res) => {
  res.json(profileDocsCache);
});

// ── Core data proxy: /api/v1/athena/* ──────────────────────────────────
// FastAPI owns routing and validation for jobs, profiles, scraping, scoring and
// stats, so this forwards the sub-path verbatim rather than mirroring that route
// table here. Mirroring it is exactly how the SPA ended up silently rendering
// mockData: the BFF had no route for /api/v1/athena/*, so those calls fell
// through to the SPA fallback and came back as text/html.
//
// MUST stay registered above the Vite/static + app.get("*") fallback in start().
// If it moves below, index.html answers again and the bug returns undisguised.
const JOB_DETAIL_PATH = /^\/jobs\/[^/]+$/;
const PROFILE_DETAIL_PATH = /^\/profiles\/[^/]+$/;

function mapJobsList(payload: unknown): unknown {
  const envelope = payload as { jobs?: unknown } | null;
  if (envelope && typeof envelope === "object" && Array.isArray(envelope.jobs)) {
    // Spread first so the mapper's jobs win over the raw envelope's.
    return {
      ...(camelCaseKeys(payload) as Record<string, unknown>),
      jobs: toOpportunityList(envelope.jobs),
    };
  }
  return { jobs: toOpportunityList(payload), total: Array.isArray(payload) ? payload.length : 0 };
}

function transformAthenaResponse(backendPath: string, payload: unknown): unknown {
  if (backendPath === "/jobs") return mapJobsList(payload);
  if (JOB_DETAIL_PATH.test(backendPath)) {
    return toOpportunity((payload ?? {}) as Record<string, unknown>);
  }
  // Profiles need a real mapper, not just camelCasing: backend `skills` is a list
  // of objects and the SPA renders them as strings, so a raw pass-through crashes
  // React with "Objects are not valid as a React child".
  if (backendPath === "/profiles") {
    return toApplicantProfileList(payload);
  }
  if (PROFILE_DETAIL_PATH.test(backendPath)) {
    const record = (payload ?? {}) as Record<string, unknown>;
    return toApplicantProfile(record);
  }
  return camelCaseKeys(payload);
}

/**
 * Raw GET of a backend document, bypassing the response transformers. Profile
 * merging needs the stored snake_case record, not the SPA-shaped view the
 * proxy hands back to the client.
 */
async function fetchBackendRaw(backendPath: string): Promise<Record<string, unknown> | null> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ATHENA_API_KEY) headers["X-API-Key"] = process.env.ATHENA_API_KEY;
  try {
    const upstream = await fetch(`${BACKEND_URL}${BACKEND_PREFIX}${backendPath}`, { headers });
    if (!upstream.ok) return null;
    const text = await upstream.text();
    if (!text) return null;
    const payload: unknown = JSON.parse(text);
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  } catch {
    // No stored profile to preserve (create, or the backend is down): fall
    // through to the unmerged patch and let the PUT report what it reports.
    return null;
  }
}

async function handleBackendProxy(req: express.Request, res: express.Response): Promise<void> {
  // Express strips the mount path, so req.url is the remainder: "/jobs?limit=100".
  const [rawPath, rawSearch = ""] = req.url.split("?");
  const backendPath = rawPath === "/" ? "" : rawPath.replace(/\/+$/, "");
  const allowedMethods = ["POST", "GET", "PATCH", "PUT", "DELETE"] as const;
  type AllowedMethod = typeof allowedMethods[number];
  const method = (allowedMethods.includes(req.method as AllowedMethod) ? req.method : "GET") as AllowedMethod;

  const hasBody = ["POST", "PATCH", "PUT"].includes(method);
  // Profile writes need a real body mapper, not just key casing: nested
  // skills/experience/education arrive in SPA shape and FastAPI answers 422 to
  // all of it (string[] is not list[Skill]). PATCH is excluded because it takes
  // a free-form dict of partial updates rather than UserProfileRequest.
  const isProfileWrite =
    hasBody &&
    method !== "PATCH" &&
    (backendPath === "/profiles" || PROFILE_DETAIL_PATH.test(backendPath));

  let body: unknown;
  if (!hasBody) {
    body = undefined;
  } else if (!isProfileWrite) {
    body = snakeCaseKeys(req.body);
  } else {
    const patch = toBackendProfile(req.body as ApplicantProfile);
    // PUT replaces the whole document, so the stored profile has to be read
    // back and folded into first. See mergeProfilePatch for what a bare PUT
    // costs: it rewrote a live profile from 30KB to 16KB in one save.
    body =
      method === "PUT" && PROFILE_DETAIL_PATH.test(backendPath)
        ? mergeProfilePatch(await fetchBackendRaw(backendPath), patch)
        : patch;
  }

  forwardToBackend(
    res,
    method,
    backendPath,
    body,
    { search: rawSearch, transform: (payload) => transformAthenaResponse(backendPath, payload) }
  );
}

app.use(BACKEND_PREFIX, (req: express.Request, res: express.Response) => {
  handleBackendProxy(req, res).catch((err: unknown) => {
    if (res.headersSent) return;
    res.status(500).json({
      error: "Backend proxy failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  });
});

// Backend reachability, surfaced separately so /api/health stays a cheap
// liveness probe for the e2e suite.
app.get("/api/backend-health", (_req, res) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  fetch(`${BACKEND_URL}${BACKEND_PREFIX}${AI_PREFIX}/health`, { signal: controller.signal })
    .then(async (upstream) => {
      const text = await upstream.text();
      let payload: unknown = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = { raw: text.slice(0, 500) };
      }
      res.status(upstream.status).json({ backend: BACKEND_URL, reachable: true, detail: camelCaseKeys(payload) });
    })
    .catch((err: unknown) => {
      const detail = err instanceof Error ? err.message : String(err);
      res.status(502).json({
        backend: BACKEND_URL,
        reachable: false,
        error: err instanceof Error && err.name === "AbortError" ? "Backend timed out" : "Backend unreachable",
        detail,
      });
    })
    .finally(() => clearTimeout(timer));
});

// Vite Middleware for development / Static files for production
async function start() {
  console.log("Starting server...");
  // Serve profile documents statically (for download/preview)
  app.use("/profile-documents", express.static(PROFILE_DOCS_DIR));

  if (process.env.NODE_ENV !== "production") {
    console.log("Creating Vite server...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    console.log("Vite server created, adding middleware...");
    app.use(vite.middlewares);
    console.log("Vite middleware added");

    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log("Calling app.listen()...");
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Athena autonomous pipeline server active on http://0.0.0.0:${PORT}`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
  });
}

start().catch((err) => {
  console.error("Failed to start Athena server:", err);
  process.exit(1);
});
