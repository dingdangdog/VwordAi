const axios = require("axios");
const fs = require("fs-extra");
const { shell } = require("electron");
const Settings = require("../models/Settings");
const { success, error } = require("../utils/result");

function cloudConfig() {
  const settings = Settings.getSettings() || {};
  return {
    apiBase: String(settings.apiBase || "https://vwordai.com").replace(/\/$/, ""),
    apiToken: String(settings.apiToken || ""),
  };
}

function client() {
  const config = cloudConfig();
  if (!config.apiToken) {
    throw new Error("请先登录官网账号");
  }
  return axios.create({
    baseURL: `${config.apiBase}/api/v1`,
    headers: { Authorization: `Bearer ${config.apiToken}` },
    timeout: 120000,
    validateStatus: () => true,
  });
}

function publicClient() {
  const config = cloudConfig();
  return axios.create({
    baseURL: `${config.apiBase}/api/v1`,
    timeout: 30000,
    validateStatus: () => true,
  });
}

async function synthesizeToFile({ text, voiceId, speed, pitch, volume, emotion, mimic, outputPath }) {
  const http = client();
  const response = await http.post(
    "/speech/synthesize",
    { text, voiceId, speed, pitch, volume, emotion: emotion || "", mimic: mimic || "", async: text.length > 500 },
    { responseType: "arraybuffer" },
  );
  const contentType = String(response.headers["content-type"] || "");
  if (contentType.includes("audio")) {
    await fs.outputFile(outputPath, Buffer.from(response.data));
    return success({ filePath: outputPath });
  }
  const payload = JSON.parse(Buffer.from(response.data).toString("utf8"));
  if (!payload.ok) return error(payload.error?.message || "合成失败，请稍后重试");
  const jobId = payload.data?.jobId;
  if (!jobId) return error("合成失败，请稍后重试");
  for (let i = 0; i < 40; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const job = await http.get(`/speech/jobs/${jobId}`);
    if (!job.data?.ok) return error(job.data?.error?.message || "合成失败，请稍后重试");
    if (job.data.data.status === "failed") return error("合成失败，请稍后重试");
    if (job.data.data.status === "succeeded" && job.data.data.audioId) {
      const audio = await http.get(`/audio/${job.data.data.audioId}`, { responseType: "arraybuffer" });
      await fs.outputFile(outputPath, Buffer.from(audio.data));
      return success({ filePath: outputPath, audioId: job.data.data.audioId });
    }
  }
  return error("合成仍在处理，请稍后重试");
}

async function scriptSplit(text, options = {}) {
  const http = client();
  const body = { task: "script-split", input: text };
  if (options.useLlm === false) {
    body.useLlm = false;
    if (options.speaker) body.speaker = String(options.speaker);
  }
  const response = await http.post("/text/tasks", body);
  if (!response.data?.ok) return error(response.data?.error?.message || "文本处理失败，请稍后重试");
  return success(response.data.data);
}

async function login(deviceName = "Electron") {
  const http = publicClient();
  const created = await http.post("/auth/device/code");
  if (!created.data?.ok) return error("无法开始登录");
  const { deviceCode, verificationUrl, userCode } = created.data.data;
  await shell.openExternal(verificationUrl);
  for (let i = 0; i < 60; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const token = await http.post("/auth/device/token", { deviceCode, deviceName });
    if (token.data?.data?.status === "pending") continue;
    if (token.data?.data?.token) {
      const settings = Settings.getSettings();
      Settings.updateSettings({ ...settings, apiToken: token.data.data.token });
      return success({ userCode });
    }
    if (token.data?.ok === false) return error(token.data.error?.message || "登录失败");
  }
  return error("登录确认超时");
}

async function account() {
  const http = client();
  const response = await http.get("/account");
  if (!response.data?.ok) return error(response.data?.error?.message || "无法读取账户");
  return success(response.data.data);
}

async function voices() {
  const http = publicClient();
  const response = await http.get("/voices");
  if (!response.data?.ok) return error("无法读取语音列表");
  return success(response.data.data);
}

async function services(kind) {
  const http = client();
  const response = await http.get("/services", { params: { kind } });
  if (!response.data?.ok) return error(response.data?.error?.message || "无法读取服务列表");
  return success(response.data.data);
}

async function serviceChoices() {
  const http = client();
  const response = await http.get("/services/choices");
  if (!response.data?.ok) return error(response.data?.error?.message || "无法读取服务选择");
  return success(response.data.data);
}

async function setQuotaBorrow(allow) {
  const http = client();
  const response = await http.patch("/account/quota-borrow", { allow: allow === true });
  if (!response.data?.ok) return error(response.data?.error?.message || "无法保存借用设置");
  return success(response.data.data);
}

async function request(method, path, options = {}) {
  try {
    const http = options.auth === false ? publicClient() : client();
    const response = method === "GET" ? await http.get(path) : await http.post(path, options.body || {});
    const payload = response.data;
    if (!payload || payload.ok !== true) return error(payload?.error?.message || "请求失败，请稍后重试");
    return success(payload.data);
  } catch (err) {
    return error(err && err.message ? err.message : "请求失败，请稍后重试");
  }
}

function billingPlans() {
  return request("GET", "/billing/plans", { auth: false });
}

function billingSubscription() {
  return request("GET", "/billing/subscription");
}

function vpoints() {
  return request("GET", "/billing/vpoints");
}

function billingPayments() {
  return request("GET", "/billing/payments", { auth: false });
}

function purchasePlan(planId, idempotencyKey) {
  return request("POST", "/billing/purchase", {
    body: { planId: String(planId || ""), idempotencyKey: String(idempotencyKey || "") },
  });
}

function billingPortal() {
  return request("POST", "/billing/portal", { body: {} });
}

function membershipPlans() {
  return request("GET", "/listen/membership/plans", { auth: false });
}

function membership() {
  return request("GET", "/listen/membership");
}

function purchaseMembership(listenerPlanId, idempotencyKey) {
  return request("POST", "/listen/membership/checkout", {
    body: { listenerPlanId: String(listenerPlanId || ""), idempotencyKey: String(idempotencyKey || "") },
  });
}

function membershipPortal() {
  return request("POST", "/listen/membership/portal", { body: {} });
}

function orders() {
  return request("GET", "/listen/orders");
}

async function openExternal(url) {
  const target = String(url || "");
  if (!/^https:\/\//i.test(target)) return error("无法打开链接");
  await shell.openExternal(target);
  return success(true);
}

async function saveServiceChoice(choice) {
  const http = client();
  const response = await http.put("/services/choices", choice);
  if (!response.data?.ok) return error(response.data?.error?.message || "无法保存服务选择");
  return success(response.data.data);
}

module.exports = {
  cloudConfig,
  synthesizeToFile,
  scriptSplit,
  login,
  account,
  voices,
  services,
  serviceChoices,
  saveServiceChoice,
  setQuotaBorrow,
  billingPlans,
  billingSubscription,
  vpoints,
  billingPayments,
  purchasePlan,
  billingPortal,
  membershipPlans,
  membership,
  purchaseMembership,
  membershipPortal,
  orders,
  openExternal,
  client,
};
