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
  ipcMain.handle("cloud:billing-plans", async () => cloud.billingPlans());
  ipcMain.handle("cloud:billing-subscription", async () => cloud.billingSubscription());
  ipcMain.handle("cloud:vpoints", async () => cloud.vpoints());
  ipcMain.handle("cloud:billing-payments", async () => cloud.billingPayments());
  ipcMain.handle("cloud:billing-purchase", async (_, payload = {}) => cloud.purchasePlan(payload.planId, payload.idempotencyKey));
  ipcMain.handle("cloud:billing-portal", async () => cloud.billingPortal());
  ipcMain.handle("cloud:membership-plans", async () => cloud.membershipPlans());
  ipcMain.handle("cloud:membership", async () => cloud.membership());
  ipcMain.handle("cloud:membership-purchase", async (_, payload = {}) => cloud.purchaseMembership(payload.listenerPlanId, payload.idempotencyKey));
  ipcMain.handle("cloud:membership-portal", async () => cloud.membershipPortal());
  ipcMain.handle("cloud:orders", async () => cloud.orders());
  ipcMain.handle("cloud:open-external", async (_, url) => cloud.openExternal(url));
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
