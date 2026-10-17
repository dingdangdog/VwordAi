const fs = require("fs-extra");
const path = require("path");
const storage = require("../utils/storage");
const Settings = require("../models/Settings");
const cloud = require("./cloudClient");
const { success, error } = require("../utils/result");

let timer = null;

function syncSoon() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    syncNow().catch((err) => console.error("[sync]", err.message));
  }, 800);
}

function mapProject(project) {
  const voice = project.defaultVoiceSettings || {};
  return {
    id: project.id,
    baseRevision: project.revision || 0,
    title: project.title,
    description: project.description || "",
    author: project.author || "",
    tags: project.tags || [],
    voiceId: voice.voiceId || null,
    speed: voice.speed ?? 1,
    pitch: voice.pitch ?? 0,
    volume: voice.volume ?? 100,
    deleted: Boolean(project.deletedAt),
    legacyProvider: voice.serviceProvider || "",
    legacyVoiceCode: voice.voice || "",
  };
}

function mapChapter(chapter) {
  const settings = chapter.settings || {};
  return {
    id: chapter.id,
    baseRevision: chapter.revision || 0,
    projectId: chapter.projectId,
    name: chapter.name,
    text: chapter.text || "",
    voiceId: settings.voiceId || null,
    speed: settings.speed ?? 1,
    pitch: settings.pitch ?? 0,
    volume: settings.volume ?? 100,
    status: chapter.status || "idle",
    deleted: Boolean(chapter.deletedAt),
    legacyProvider: settings.serviceProvider || "",
    legacyVoiceCode: settings.voice || "",
  };
}

async function syncNow() {
  const settings = Settings.getSettings();
  if (!settings.apiToken) return success({ skipped: true });
  const http = cloud.client();
  const since = settings.syncCursor || "";
  const pulled = await http.get("/sync", { params: since ? { since } : {} });
  if (!pulled.data?.ok) return error(pulled.data?.error?.message || "同步失败");
  applyPull(pulled.data.data);
  const projects = storage.readData("projects", []).filter((item) => item.dirty);
  const chapters = storage.readData("chapters", []).filter((item) => item.dirty);
  if (projects.length || chapters.length) {
    const pushed = await http.post("/import/local", {
      projects: projects.map(mapProject),
      chapters: chapters.map(mapChapter),
    });
    if (pushed.status === 409) {
      const fresh = await http.get("/sync");
      if (fresh.data?.ok) applyPull(fresh.data.data, true);
      return error("内容已在其他端更新，已改用云端版本");
    }
    if (!pushed.data?.ok) return error(pushed.data?.error?.message || "同步失败");
    markClean(pushed.data.data.applied || []);
  }
  Settings.updateSettings({ syncCursor: new Date().toISOString() });
  return success({ synced: true });
}

function applyPull(data, overwriteDirty = false) {
  mergeList("projects", data.projects || [], overwriteDirty, (local, remote) => ({
    ...local,
    id: remote.id,
    title: remote.title,
    description: remote.description || "",
    author: remote.author || "",
    tags: remote.tags || [],
    revision: remote.revision,
    deletedAt: remote.deletedAt,
    dirty: false,
    defaultVoiceSettings: {
      ...(local?.defaultVoiceSettings || {}),
      voiceId: remote.voiceId || "",
      speed: remote.speed,
      pitch: remote.pitch,
      volume: remote.volume,
    },
    updateAt: remote.updatedAt,
  }));
  mergeList("chapters", data.chapters || [], overwriteDirty, (local, remote) => ({
    ...local,
    id: remote.id,
    projectId: remote.projectId,
    name: remote.name,
    text: remote.text || "",
    revision: remote.revision,
    deletedAt: remote.deletedAt,
    dirty: false,
    status: remote.status || local?.status || "idle",
    audioFileId: remote.audioFileId || local?.audioFileId || "",
    settings: {
      ...(local?.settings || {}),
      voiceId: remote.voiceId || "",
      speed: remote.speed,
      pitch: remote.pitch,
      volume: remote.volume,
    },
    updateAt: remote.updatedAt,
  }));
}

function mergeList(file, remoteItems, overwriteDirty, mapper) {
  const localItems = storage.readData(file, []);
  for (const remote of remoteItems) {
    const index = localItems.findIndex((item) => item.id === remote.id);
    if (index === -1) {
      localItems.push(mapper({}, remote));
      continue;
    }
    if (localItems[index].dirty && !overwriteDirty) continue;
    localItems[index] = mapper(localItems[index], remote);
  }
  storage.saveData(file, localItems);
}

function markClean(applied) {
  const byKind = {
    projects: storage.readData("projects", []),
    chapters: storage.readData("chapters", []),
  };
  for (const item of applied) {
    const list = byKind[item.kind];
    const found = list?.find((row) => row.id === item.id);
    if (!found) continue;
    found.dirty = false;
    found.revision = item.revision;
  }
  storage.saveData("projects", byKind.projects);
  storage.saveData("chapters", byKind.chapters);
}

async function downloadAudio(audioId, outputPath) {
  const http = cloud.client();
  const response = await http.get(`/audio/${audioId}`, { responseType: "arraybuffer" });
  if (response.status >= 400) return error("音频下载失败");
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, Buffer.from(response.data));
  return success({ filePath: outputPath });
}

module.exports = { syncSoon, syncNow, downloadAudio };
