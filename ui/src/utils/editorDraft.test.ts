import { afterEach, describe, expect, test } from "vitest";
import { createDraftSession, draftStorageKey, samePayload, type DraftRecord, type DraftStore } from "./editorDraft";

class MemoryStore implements DraftStore {
  readonly map = new Map<string, DraftRecord<unknown>>();
  quota = Number.POSITIVE_INFINITY;

  read(key: string) {
    return this.map.get(key) ?? null;
  }

  write(key: string, record: DraftRecord<unknown>) {
    const next = new Map(this.map);
    next.set(key, record);
    if (JSON.stringify([...next.entries()]).length > this.quota) {
      const error = new Error("quota");
      error.name = "QuotaExceededError";
      throw error;
    }
    this.map.set(key, record);
  }

  remove(key: string) {
    this.map.delete(key);
  }

  keys() {
    return [...this.map.keys()];
  }
}

function sessionFor(storage: MemoryStore, backup?: { read: (key: string) => Promise<DraftRecord<unknown> | null>; write: (key: string, record: DraftRecord<unknown>) => Promise<void>; remove: (key: string) => Promise<void> }) {
  let now = 10_000;
  const session = createDraftSession<{ text: string }>({
    scope: "test",
    storage,
    backup,
    now: () => now,
  });
  return {
    session,
    advance(ms: number) {
      now += ms;
    },
  };
}

describe("编辑草稿", () => {
  const sessions: Array<{ dispose: () => void }> = [];

  afterEach(() => {
    for (const item of sessions) item.dispose();
    sessions.length = 0;
  });

  test("字段顺序不同仍视为同一内容", () => {
    expect(samePayload({ b: 1, a: "x" }, { a: "x", b: 1 })).toBe(true);
    expect(samePayload({ text: "a" }, { text: "b" })).toBe(false);
  });

  test("与服务器一致时不保留，不一致时恢复并在保存后清除", async () => {
    const storage = new MemoryStore();
    const { session } = sessionFor(storage);
    sessions.push(session);
    const key = draftStorageKey("test", "chapter-1");

    session.schedule("chapter-1", { text: "服务器" }, { text: "服务器" });
    expect(storage.map.has(key)).toBe(false);

    session.schedule("chapter-1", { text: "本地新增" }, { text: "服务器" });
    expect(storage.read(key)?.payload).toEqual({ text: "本地新增" });

    await expect(session.restore("chapter-1", { text: "服务器" })).resolves.toEqual({ text: "本地新增" });
    session.commit("chapter-1", { text: "已保存" }, { text: "已保存" });
    expect(storage.map.has(key)).toBe(false);
    await expect(session.restore("chapter-1", { text: "已保存" })).resolves.toBeNull();
  });

  test("连续输入只保留最后一次，关闭前可立即写盘", () => {
    const storage = new MemoryStore();
    const { session, advance } = sessionFor(storage);
    sessions.push(session);
    const key = draftStorageKey("test", "chapter-1");

    session.schedule("chapter-1", { text: "一" }, { text: "" });
    advance(10);
    session.schedule("chapter-1", { text: "一二" }, { text: "" });
    session.schedule("chapter-1", { text: "一二三" }, { text: "" });
    expect(storage.read(key)?.payload).toEqual({ text: "一" });

    session.flush();
    expect(storage.read(key)?.payload).toEqual({ text: "一二三" });
  });

  test("切换章节时先写完上一章", () => {
    const storage = new MemoryStore();
    const { session, advance } = sessionFor(storage);
    sessions.push(session);

    session.schedule("a", { text: "甲" }, { text: "" });
    advance(10);
    session.schedule("a", { text: "甲乙" }, { text: "" });
    session.schedule("b", { text: "乙" }, { text: "" });

    expect(storage.read(draftStorageKey("test", "a"))?.payload).toEqual({ text: "甲乙" });
    expect(storage.read(draftStorageKey("test", "b"))?.payload).toEqual({ text: "乙" });
  });

  test("空间不足时淘汰更早的草稿", () => {
    const storage = new MemoryStore();
    const { session } = sessionFor(storage);
    sessions.push(session);
    session.schedule("old", { text: "旧" }, { text: "" });
    const used = JSON.stringify([...storage.map.entries()]).length;
    storage.quota = used + 8;
    session.schedule("new", { text: "新章节正文" }, { text: "" });
    expect(storage.map.has(draftStorageKey("test", "old"))).toBe(false);
    expect(storage.read(draftStorageKey("test", "new"))?.payload).toEqual({ text: "新章节正文" });
  });

  test("本地副本较旧时采用备份里更新的一份", async () => {
    const storage = new MemoryStore();
    const remote = new Map<string, DraftRecord<unknown>>();
    const backup = {
      async read(key: string) {
        return remote.get(key) ?? null;
      },
      async write(key: string, record: DraftRecord<unknown>) {
        remote.set(key, record);
      },
      async remove(key: string) {
        remote.delete(key);
      },
    };
    const { session } = sessionFor(storage, backup);
    sessions.push(session);
    const key = draftStorageKey("test", "chapter-1");
    storage.write(key, { v: 1, savedAt: 1, payload: { text: "旧本地" } });
    remote.set(key, { v: 1, savedAt: 2, payload: { text: "较新备份" } });

    await expect(session.restore("chapter-1", { text: "服务器" })).resolves.toEqual({ text: "较新备份" });
  });
});
