/**
 * Per-artifact lockfile manager for agent coordination (frontend).
 * 
 * Provides granular locking per artifact (job, application, profile) with:
 * - Exclusive lock acquisition with timeout
 * - Stale lock detection and force-release
 * - Global agent lock as fallback
 * - Integration with API endpoints for server-side enforcement
 */

export interface LockInfo {
  agentId: string;
  acquiredAt: string | null;
  ttl: number | null;
}

export interface ArtifactLock {
  release(): void;
  readonly isStale: boolean;
}

/**
 * Generate a lock file path for a given entity and ID.
 */
export function lockIdFor(entity: string, entityId: string): string {
  const safeId = entityId.replace("/", "_").replace("\\", "_");
  return `artifacts/locks/${entity}_${safeId}.lock`;
}

/**
 * Generate the global agent lock file path.
 */
export function globalLockId(): string {
  return "artifacts/locks/global_agent.lock";
}

/**
 * Read lock content if the lock file exists.
 */
export function tryReadLockContent(lockPath: string): LockInfo | null {
  const path = lockPath;
  // In a browser/Node environment, we would fetch this via API
  // For now, this is a placeholder that would be implemented
  // via fetch to the backend lockfile API
  return null;
}

/**
 * Determine if a lock is stale (expired TTL or held too long).
 */
export function isLockStale(lockInfo: LockInfo, currentAgentId: string): boolean {
  if (lockInfo.agentId !== currentAgentId) {
    const acquiredStr = lockInfo.acquiredAt;
    if (acquiredStr) {
      const acquired = new Date(acquiredStr);
      const now = new Date();
      const elapsed = (now.getTime() - acquired.getTime()) / 1000;
      return elapsed > 1800; // 30 minutes in seconds
    }
    return true;
  }
  // Same agent - lock is fresh
  return false;
}

/**
 * Acquire an exclusive lock on a specific artifact.
 * Returns an ArtifactLock on success, or null if timeout.
 * 
 * In the frontend, this communicates with the backend API
 * which handles the actual file locking via the Python lockfile manager.
 */
export async function tryAcquireArtifactLock(
  entity: string,
  entityId: string,
  agentId: string,
  ttl: number = 600
): Promise<ArtifactLock | null> {
  try {
    const response = await fetch(`/api/lock/artifact?entity=${entity}&id=${entityId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentId, ttl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to acquire artifact lock");
    }

    const result = await response.json();
    // result: { success: true, lockToken: string }
    
    // Return an ArtifactLock that will release when destroyed
    let released = false;
    const lock: ArtifactLock = {
      release: async () => {
        if (!released) {
          released = true;
          await fetch(`/api/lock/artifact/release?entity=${entity}&id=${entityId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ agentId, lockToken: result.lockToken }),
          });
        }
      },
      get isStale(): boolean {
        // Stale check would need lock info from backend
        return false;
      },
    };

    return lock;
  } catch (error) {
    console.error("Failed to acquire artifact lock:", error);
    return null;
  }
}

/**
 * Acquire the global agent lock (serializes all operations).
 */
export async function tryAcquireGlobalLock(agentId: string): Promise<ArtifactLock | null> {
  try {
    const response = await fetch("/api/lock/global", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to acquire global lock");
    }

    const result = await response.json();
    
    let released = false;
    const lock: ArtifactLock = {
      release: async () => {
        if (!released) {
          released = true;
          await fetch("/api/lock/global/release", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ agentId, lockToken: result.lockToken }),
          });
        }
      },
      get isStale(): boolean {
        return false;
      },
    };

    return lock;
  } catch (error) {
    console.error("Failed to acquire global lock:", error);
    return null;
  }
}

/**
 * Release a lock that was previously acquired.
 */
export async function releaseLock(entity: string, entityId: string, lockToken: string): Promise<void> {
  await fetch(`/api/lock/artifact/release?entity=${entity}&id=${entityId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lockToken }),
  });
}

/**
 * Scan for and release stale locks on the server.
 */
export async function scanForStaleLocks(agentId: string): Promise<{ released: number }> {
  const response = await fetch("/api/lock/stale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agentId }),
  });

  if (!response.ok) {
    throw new Error("Failed to scan for stale locks");
  }

  return response.json();
}