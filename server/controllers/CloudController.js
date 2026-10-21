const { ipcMain } = require("electron");
const Settings = require("../models/Settings");
const cloud = require("../services/cloudClient");
const sync = require("../services/cloudSync");

function init() {
  ipcMain.handle("cloud:login", async () => cloud.login("VwordAi Desktop"));
  ipcMain.handle("cloud:account", async () => cloud.account());
  ipcMain.handle("cloud:voices", async () => cloud.voices());
  ipcMain.handle("cloud:services", async (_, kind) => cloud.services(kind));
  ipcMain.handle("cloud:service-choices", async () => cloud.serviceChoices());
  ipcMain.handle("cloud:save-service-choice", async (_, choice) => cloud.saveServiceChoice(choice || {}));
  ipcMain.handle("cloud:set-quota-borrow", async (_, allow) => cloud.setQuotaBorrow(allow));
  ipcMain.handle("cloud:script-split", async (_, payload = {}) => {
    return cloud.scriptSplit(String(payload.text || ""), {
      useLlm: payload.useLlm !== false,
      speaker: payload.speaker,
    });
  });
  ipcMain.handle("cloud:sync", async () => sync.syncNow());
  ipcMain.handle("cloud:set-base", async (_, apiBase) => {
    Settings.updateSettings({ apiBase: String(apiBase || "").replace(/\/$/, "") });
    return { success: true };
  });
  ipcMain.handle("cloud:get-config", async () => {
    const settings = Settings.getSettings();
    return {
      success: true,
      data: { apiBase: settings.apiBase || "https://vwordai.com", signedIn: Boolean(settings.apiToken) },
    };
  });
  ipcMain.handle("cloud:logout", async () => {
    Settings.updateSettings({ apiToken: "" });
    return { success: true };
  });
}

module.exports = { init };
