#!/usr/bin/env python3
"""Per-artifact lockfile manager for agent coordination.

Provides granular locking per artifact (job, application, profile) with:
- Exclusive lock acquisition with timeout
- Stale lock detection and force-release
- Global agent lock as fallback
- Transparent integration with AthenaStore operations
"""

import contextlib
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from filelock import FileLock
from filelock import Timeout as FileLockTimeout

from .paths import get_data_root

# Anchored to the data root so every process sharing a data directory also shares
# one lock namespace. A CWD-relative path gave each launch directory its own
# isolated lock set, which silently disabled mutual exclusion.
LOCK_DIR = get_data_root() / "locks"
LOCK_DIR.mkdir(parents=True, exist_ok=True)

LOCK_ACQUIRE_TIMEOUT = 300  # 5 minutes
STALE_LOCK_TIMEOUT = 1800  # 30 minutes
LOCK_HEADER_LINES = 2  # lock file header: agent id + acquired-at timestamp


def lock_id_for(entity: str, entity_id: str) -> str:
    safe_id = entity_id.replace("/", "_").replace("\\", "_")
    return str(LOCK_DIR / f"{entity}_{safe_id}.lock")


def owner_path_for(lock_path: Path) -> Path:
    """Advisory metadata sidecar for a lock.

    The filelock guard file itself is held open exclusively for the duration of
    the lock, so on Windows nothing else may open it for writing. Human-readable
    ownership metadata therefore lives in a sibling file.
    """
    return lock_path.with_name(lock_path.name + ".owner")


def global_lock_id() -> str:
    return str(LOCK_DIR / "global_agent.lock")


class ArtifactLock:
    def __init__(
        self,
        lock_path: Path,
        acquired_by: str,
        acquired_at: datetime,
        ttl: int | None = None,
    ):
        self.lock_path = lock_path
        self.acquired_by = acquired_by
        self.acquired_at = acquired_at
        self.ttl = ttl
        self._file_handle = None

    @property
    def is_stale(self) -> bool:
        if self.ttl is None:
            held = datetime.now(UTC) - self.acquired_at
            return held > timedelta(seconds=STALE_LOCK_TIMEOUT)
        return datetime.now(UTC) - self.acquired_at > timedelta(seconds=self.ttl)

    def release(self) -> None:
        if self._file_handle:
            # The handle is a real FileLock: release the OS-level advisory lock
            # first, then drop the metadata sidecar and the guard file.
            with contextlib.suppress(Exception):
                self._file_handle.release()
            self._file_handle = None
            with contextlib.suppress(Exception):
                owner_path_for(self.lock_path).unlink(missing_ok=True)
            with contextlib.suppress(Exception):
                self.lock_path.unlink(missing_ok=True)

    def __enter__(self) -> "ArtifactLock":
        return self

    def __exit__(self, *args: object) -> None:
        self.release()


def try_acquire_artifact_lock(
    entity: str,
    entity_id: str,
    agent_id: str,
    ttl: int | None = None,
) -> ArtifactLock | None:
    lock_path = Path(lock_id_for(entity, entity_id))
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    while True:
        try:
            # Real cross-process mutual exclusion via an OS advisory lock.
            # filelock serialises writers across processes and threads.
            file_lock = FileLock(str(lock_path), timeout=LOCK_ACQUIRE_TIMEOUT)
            file_lock.acquire()
            acquired_at = datetime.now(UTC)
            lock_content = f"{agent_id}\n{acquired_at.isoformat()}\n"
            if ttl:
                lock_content += f"{ttl}\n"
            owner_path_for(lock_path).write_text(lock_content, encoding="utf-8")
            lock = ArtifactLock(lock_path, agent_id, acquired_at, ttl)
            lock._file_handle = file_lock
        except FileLockTimeout:
            elapsed = time.monotonic() - start
            if elapsed >= LOCK_ACQUIRE_TIMEOUT:
                return None
            # Check if existing lock is stale
            existing_owner = owner_path_for(lock_path)
            if existing_owner.exists():
                existing_content = existing_owner.read_text(encoding="utf-8").strip()
                existing_parts = existing_content.split("\n")
                if len(existing_parts) >= LOCK_HEADER_LINES:
                    existing_agent_id = existing_parts[0]
                    existing_acquired_str = existing_parts[1]
                    if existing_agent_id != agent_id:
                        # Lock held by different agent - check if stale
                        try:
                            acquired = datetime.fromisoformat(existing_acquired_str)
                            elapsed_seconds = (datetime.now(UTC) - acquired).total_seconds()
                            if elapsed_seconds > STALE_LOCK_TIMEOUT:
                                # Force-release stale lock
                                lock_path.unlink(missing_ok=True)
                                continue  # retry acquisition
                        except Exception:
                            pass
                    # Wait and retry
                    time.sleep(0.5)
                    continue
                time.sleep(0.5)
            else:
                time.sleep(0.5)
        else:
            return lock


def try_read_lock_content(lock_path: Path) -> dict[str, Any] | None:
    owner = owner_path_for(lock_path)
    if not owner.exists():
        return None
    try:
        text = owner.read_text(encoding="utf-8").strip()
        parts = text.split("\n")
        if len(parts) >= LOCK_HEADER_LINES:
            return {
                "agent_id": parts[0],
                "acquired_at": parts[1] if len(parts) > 1 else None,
                "ttl": parts[2] if len(parts) > LOCK_HEADER_LINES else None,
            }
    except Exception:
        pass
    return None


def is_lock_stale(lock_info: dict[str, Any], current_agent_id: str) -> bool:
    if lock_info.get("agent_id") != current_agent_id:
        acquired_str = lock_info.get("acquired_at")
        if acquired_str:
            try:
                acquired = datetime.fromisoformat(acquired_str)
                elapsed = (datetime.now(UTC) - acquired).total_seconds()
            except Exception:
                pass
            else:
                return elapsed > STALE_LOCK_TIMEOUT
        return True
    return False


def force_release_lock(lock_path: Path) -> bool:
    try:
        if lock_path.exists():
            lock_path.unlink()
            return True
    except Exception:
        pass
    return False


def scan_for_stale_locks(current_agent_id: str) -> int:
    released = 0
    if not LOCK_DIR.exists():
        return released
    for lock_file in LOCK_DIR.glob("*.lock"):
        info = try_read_lock_content(lock_file)
        if info and is_lock_stale(info, current_agent_id) and force_release_lock(lock_file):
            released += 1
    return released


def acquire_artifact_lock_context(
    entity: str,
    entity_id: str,
    agent_id: str,
    ttl: int | None = None,
) -> ArtifactLock | None:
    lock = try_acquire_artifact_lock(entity, entity_id, agent_id, ttl)
    if lock is None:
        return None
    return lock


def acquire_global_lock_context(agent_id: str) -> ArtifactLock | None:
    lock_path = Path(global_lock_id())
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    while True:
        try:
            # Real cross-process mutual exclusion via an OS advisory lock.
            file_lock = FileLock(str(lock_path), timeout=LOCK_ACQUIRE_TIMEOUT)
            file_lock.acquire()
            acquired_at = datetime.now(UTC)
            content = f"{agent_id}\n{acquired_at.isoformat()}\n"
            owner_path_for(lock_path).write_text(content, encoding="utf-8")
            lock = ArtifactLock(lock_path, agent_id, acquired_at)
            lock._file_handle = file_lock
        except FileLockTimeout:
            elapsed = time.monotonic() - start
            if elapsed >= LOCK_ACQUIRE_TIMEOUT:
                return None
            time.sleep(0.5)
        else:
            return lock
