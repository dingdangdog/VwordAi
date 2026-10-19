/** 编辑草稿：同步写入 localStorage，空间不足时淘汰其他草稿并回退到 IndexedDB。 */

export const DRAFT_PREFIX = "vword.editorDraft.v1";
export const DRAFT_DB_NAME = "vword-editor-drafts";
export const DRAFT_DB_STORE = "drafts";

export interface DraftRecord<T> {
  v: 1;
  savedAt: number;
  payload: T;
}

export interface DraftStore {
  read(key: string): DraftRecord<unknown> | null;
  write(key: string, record: DraftRecord<unknown>): void;
  remove(key: string): void;
  keys(): string[];
}

export interface AsyncDraftStore {
  read(key: string): Promise<DraftRecord<unknown> | null>;
  write(key: string, record: DraftRecord<unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}

export function draftStorageKey(scope: string, id: string) {
  return `${DRAFT_PREFIX}:${scope}:${id}`;
}

export function samePayload(left: unknown, right: unknown) {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function isQuotaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const named = error as { name?: string; code?: number };
  return named.name === "QuotaExceededError" || named.name === "NS_ERROR_DOM_QUOTA_REACHED" || named.code === 22 || named.code === 1014;
}

function isDraftRecord(value: unknown): value is DraftRecord<unknown> {
  return !!value && typeof value === "object" && (value as DraftRecord<unknown>).v === 1 && "payload" in (value as DraftRecord<unknown>);
}

export function browserDraftStorage(): DraftStore {
  return {
    read(key) {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!isDraftRecord(parsed)) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed;
      } catch {
        localStorage.removeItem(key);
        return null;
      }
    },
    write(key, record) {
      localStorage.setItem(key, JSON.stringify(record));
    },
    remove(key) {
      localStorage.removeItem(key);
    },
    keys() {
      const keys: string[] = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key) keys.push(key);
      }
      return keys;
    },
  };
}

let draftDb: Promise<IDBDatabase> | null = null;

function openDraftDb() {
  if (!draftDb) {
    draftDb = new Promise((resolve, reject) => {
      const request = indexedDB.open(DRAFT_DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DRAFT_DB_STORE)) request.result.createObjectStore(DRAFT_DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        draftDb = null;
        reject(request.error);
      };
    });
  }
  return draftDb;
}

export function browserDraftBackup(): AsyncDraftStore {
  return {
    async read(key) {
      const db = await openDraftDb();
      return await new Promise((resolve, reject) => {
        const request = db.transaction(DRAFT_DB_STORE, "readonly").objectStore(DRAFT_DB_STORE).get(key);
        request.onsuccess = () => resolve(isDraftRecord(request.result) ? request.result : null);
        request.onerror = () => reject(request.error);
      });
    },
    async write(key, record) {
      const db = await openDraftDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DRAFT_DB_STORE, "readwrite");
        tx.objectStore(DRAFT_DB_STORE).put(record, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    },
    async remove(key) {
      const db = await openDraftDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DRAFT_DB_STORE, "readwrite");
        tx.objectStore(DRAFT_DB_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
  };
}

const unavailableStore: DraftStore = {
  read: () => null,
  write() {
    const error = new Error("storage unavailable");
    error.name = "QuotaExceededError";
    throw error;
  },
  remove() {},
  keys: () => [],
};

export function createDraftSession<T>(options: {
  scope: string;
  storage?: DraftStore;
  backup?: AsyncDraftStore;
  intervalMs?: number;
  now?: () => number;
  onCached?: (id: string, cached: boolean) => void;
}) {
  const storage = options.storage ?? unavailableStore;
  const backup = options.backup;
  const intervalMs = options.intervalMs ?? 400;
  const now = options.now ?? (() => Date.now());
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { id: string; payload: T } | null = null;
  let activeId = "";
  let lastWriteAt = -intervalMs;

  function notify(id: string, cached: boolean) {
    options.onCached?.(id, cached);
  }

  function keyOf(id: string) {
    return draftStorageKey(options.scope, id);
  }

  function removeBackup(key: string) {
    if (!backup) return;
    void backup.remove(key).catch(() => undefined);
  }

  function removeBoth(id: string) {
    const key = keyOf(id);
    try {
      storage.remove(key);
    } catch {
      /* 存储不可用时只清备份 */
    }
    removeBackup(key);
  }

  function mirror(key: string, record: DraftRecord<T>) {
    if (!backup) return;
    void backup.write(key, record).catch(() => undefined);
  }

  function writeRecord(id: string, payload: T) {
    const key = keyOf(id);
    const record: DraftRecord<T> = { v: 1, savedAt: now(), payload };
    const writeLocal = () => storage.write(key, record);

    try {
      writeLocal();
      mirror(key, record);
      return true;
    } catch (error) {
      if (!isQuotaError(error)) return writeBackupOnly(key, record);
      const others = storage
        .keys()
        .filter((item) => item.startsWith(`${DRAFT_PREFIX}:`) && item !== key)
        .map((item) => ({ item, savedAt: storage.read(item)?.savedAt ?? 0 }))
        .sort((left, right) => left.savedAt - right.savedAt);
      for (const candidate of others) {
        try {
          storage.remove(candidate.item);
        } catch {
          continue;
        }
        try {
          writeLocal();
          mirror(key, record);
          return true;
        } catch (retryError) {
          if (!isQuotaError(retryError)) break;
        }
      }
      return writeBackupOnly(key, record);
    }
  }

  function writeBackupOnly(key: string, record: DraftRecord<T>) {
    if (!backup) return false;
    void backup.write(key, record).catch(() => undefined);
    return true;
  }

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }

  function flush() {
    clearTimer();
    if (!pending) return;
    const current = pending;
    pending = null;
    if (!writeRecord(current.id, current.payload)) {
      pending = current;
      notify(current.id, false);
      timer = setTimeout(() => flush(), intervalMs);
      return;
    }
    lastWriteAt = now();
    notify(current.id, true);
  }

  function schedule(id: string, payload: T, baseline: T) {
    if (!id) return;
    const switched = activeId !== id;
    if (pending && pending.id !== id) flush();
    activeId = id;
    if (samePayload(payload, baseline)) {
      if (pending?.id === id) pending = null;
      clearTimer();
      removeBoth(id);
      notify(id, false);
      return;
    }
    pending = { id, payload };
    if (switched || now() - lastWriteAt >= intervalMs) {
      flush();
      return;
    }
    if (!timer) timer = setTimeout(() => flush(), intervalMs - (now() - lastWriteAt));
  }

  async function readRecord(id: string) {
    const key = keyOf(id);
    let local: DraftRecord<T> | null = null;
    try {
      const stored = storage.read(key);
      local = isDraftRecord(stored) ? (stored as DraftRecord<T>) : null;
    } catch {
      local = null;
    }
    let remote: DraftRecord<T> | null = null;
    if (backup) {
      try {
        const stored = await backup.read(key);
        remote = isDraftRecord(stored) ? (stored as DraftRecord<T>) : null;
      } catch {
        remote = null;
      }
    }
    if (local && remote) return remote.savedAt > local.savedAt ? remote : local;
    return local || remote;
  }

  return {
    schedule,
    flush,
    commit(id: string, payload: T, baseline: T) {
      schedule(id, payload, baseline);
      flush();
    },
    forget(id: string) {
      if (!id) return;
      if (pending?.id === id) {
        pending = null;
        clearTimer();
      }
      removeBoth(id);
      notify(id, false);
    },
    async restore(id: string, baseline: T): Promise<T | null> {
      if (!id) return null;
      const record = await readRecord(id);
      if (!record) {
        notify(id, false);
        return null;
      }
      if (samePayload(record.payload, baseline)) {
        removeBoth(id);
        notify(id, false);
        return null;
      }
      notify(id, true);
      return record.payload as T;
    },
    /** 页面隐藏、关闭或组件卸载时调用，把节流中的最后一次修改写盘。 */
    bind(target: Window) {
      const onHide = () => flush();
      const onVisibility = () => {
        if (target.document.visibilityState === "hidden") flush();
      };
      target.addEventListener("pagehide", onHide);
      target.addEventListener("beforeunload", onHide);
      target.document.addEventListener("visibilitychange", onVisibility);
      return () => {
        target.removeEventListener("pagehide", onHide);
        target.removeEventListener("beforeunload", onHide);
        target.document.removeEventListener("visibilitychange", onVisibility);
        clearTimer();
      };
    },
    dispose() {
      clearTimer();
    },
  };
}
