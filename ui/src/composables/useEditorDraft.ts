import { onBeforeUnmount, onMounted, ref } from "vue";
import { browserDraftBackup, browserDraftStorage, createDraftSession, type DraftStore } from "../utils/editorDraft";

function storageAvailable() {
  try {
    if (typeof localStorage === "undefined") return false;
    const probe = "vword.editorDraft.probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * 把当前编辑内容按实体 id 暂存到本机。
 * 连续输入最多间隔 400ms 落盘，关页、切到后台或卸载时再立即写一次。
 */
export function useEditorDraft<T>(scope: string) {
  const cached = ref(false);
  let currentId = "";
  const storage: DraftStore | undefined = storageAvailable() ? browserDraftStorage() : undefined;
  const backup = typeof indexedDB === "undefined" ? undefined : browserDraftBackup();
  const session = createDraftSession<T>({
    scope,
    storage,
    backup,
    onCached(id, isCached) {
      if (id === currentId) cached.value = isCached;
    },
  });

  let stop = () => {};

  onMounted(() => {
    stop = session.bind(window);
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      void navigator.storage.persist().catch(() => undefined);
    }
  });
  onBeforeUnmount(() => {
    session.flush();
    stop();
  });

  return {
    cached,
    focus(id: string) {
      currentId = id;
      cached.value = false;
    },
    schedule(id: string, payload: T, baseline: T) {
      currentId = id;
      session.schedule(id, payload, baseline);
    },
    commit(id: string, payload: T, baseline: T) {
      currentId = id;
      session.commit(id, payload, baseline);
    },
    forget(id: string) {
      session.forget(id);
      if (id === currentId) cached.value = false;
    },
    async restore(id: string, baseline: T) {
      currentId = id;
      return await session.restore(id, baseline);
    },
    flush() {
      session.flush();
    },
  };
}
