const { OpenAI } = require("openai");
const { default: axios } = require("axios");

const REQUEST_TIMEOUT = 20000;
const MAX_MODELS = 500;

/**
 * 按协议拉取模型列表。
 * 不支持或接口不存在时返回 supported:false，由调用方改为手动输入。
 * @param {object} config
 * @param {string} config.protocol
 * @returns {Promise<{supported: boolean, models: {id: string, name: string}[], message: string}>}
 */
async function listModels(config) {
  const protocol = config?.protocol;
  if (!protocol) {
    throw localError("请先选择协议");
  }

  try {
    let models = [];
    switch (protocol) {
      case "openai":
        models = await listOpenAICompatible(config.key, config.endpoint);
        break;
      case "azure":
        models = await listAzure(config);
        break;
      case "gemini":
        models = config.endpoint
          ? await listOpenAICompatible(config.key, config.endpoint)
          : await listGeminiNative(config.key);
        break;
      case "claude":
        models = config.endpoint
          ? await listOpenAICompatible(config.key, config.endpoint)
          : await listClaudeNative(config.key);
        break;
      case "volcengine":
        models = await listOpenAICompatible(
          config.key,
          config.endpoint || "https://ark.cn-beijing.volces.com/api/v3"
        );
        break;
      case "aliyun":
        models = await listAliyun(config);
        break;
      default:
        return {
          supported: false,
          models: [],
          message: "该协议暂不支持自动获取模型，请手动输入",
        };
    }

    return {
      supported: true,
      models,
      message: models.length
        ? `已获取 ${models.length} 个模型，可从列表选择或手动输入`
        : "接口未返回模型，请手动输入模型名称",
    };
  } catch (err) {
    if (err.local) throw err;
    const { status } = extractError(err);
    if (status === 404 || status === 405 || status === 501) {
      return {
        supported: false,
        models: [],
        message: "该服务商不支持获取模型列表，请手动输入模型名称",
      };
    }
    throw new Error(toUserMessage(err));
  }
}

async function listOpenAICompatible(key, endpoint) {
  const apiKey = requireText(key, "请先填写 API Key");
  const baseURL = (endpoint || "").trim() || undefined;
  const client = new OpenAI({
    apiKey,
    baseURL,
    timeout: REQUEST_TIMEOUT,
    maxRetries: 0,
  });
  const collected = [];
  const page = await client.models.list();
  if (page && typeof page[Symbol.asyncIterator] === "function") {
    for await (const model of page) {
      collected.push(model);
      if (collected.length >= MAX_MODELS) break;
    }
  } else if (Array.isArray(page?.data)) {
    collected.push(...page.data.slice(0, MAX_MODELS));
  }
  return modelsFromUnknown(collected);
}

async function listAzure(config) {
  const key = requireText(config.key, "请先填写 API Key");
  const endpoint = requireText(config.endpoint, "请先填写 Endpoint");
  if (!/openai\.azure\.com|cognitiveservices\.azure\.com/i.test(endpoint)) {
    return listOpenAICompatible(key, endpoint);
  }
  let resource;
  try {
    resource = new URL(endpoint);
  } catch {
    throw localError("Endpoint 不是有效地址");
  }
  const url = `${resource.protocol}//${resource.host}/openai/models?api-version=2024-10-21`;
  const res = await axios.get(url, {
    headers: { "api-key": key },
    timeout: REQUEST_TIMEOUT,
  });
  return modelsFromUnknown(res.data?.data || res.data?.value || []);
}

async function listGeminiNative(key) {
  const apiKey = requireText(key, "请先填写 API Key");
  const raw = [];
  let pageToken = "";
  for (let i = 0; i < 5; i += 1) {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await axios.get(url.toString(), { timeout: REQUEST_TIMEOUT });
    const batch = (res.data?.models || []).filter((model) => {
      const methods = model.supportedGenerationMethods || [];
      return methods.length === 0 || methods.includes("generateContent");
    });
    raw.push(...batch);
    pageToken = res.data?.nextPageToken || "";
    if (!pageToken || raw.length >= MAX_MODELS) break;
  }
  return modelsFromUnknown(raw);
}

async function listClaudeNative(key) {
  const apiKey = requireText(key, "请先填写 API Key");
  const raw = [];
  let afterId = "";
  for (let i = 0; i < 5; i += 1) {
    const url = new URL("https://api.anthropic.com/v1/models");
    url.searchParams.set("limit", "100");
    if (afterId) url.searchParams.set("after_id", afterId);
    const res = await axios.get(url.toString(), {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      timeout: REQUEST_TIMEOUT,
    });
    const data = res.data?.data || [];
    raw.push(...data);
    if (!res.data?.has_more || !data.length || raw.length >= MAX_MODELS) break;
    afterId = data[data.length - 1]?.id || "";
    if (!afterId) break;
  }
  return modelsFromUnknown(raw);
}

async function listAliyun(config) {
  const apiKey = requireText(config.token || config.appkey, "请先填写 Token");
  const headers = { Authorization: `Bearer ${apiKey}` };
  if (config.appkey) headers["X-DashScope-AppKey"] = config.appkey;

  const urls = [];
  const endpoint = (config.endpoint || "").trim();
  if (endpoint && /compatible-mode/i.test(endpoint)) {
    const base = endpoint
      .replace(/\/+$/, "")
      .replace(/\/models$/, "")
      .replace(/\/chat\/completions$/, "");
    urls.push(`${base}/models`);
  }
  urls.push("https://dashscope.aliyuncs.com/compatible-mode/v1/models");
  urls.push("https://dashscope.aliyuncs.com/api/v1/models?page_no=1&page_size=100");

  let lastError = null;
  for (const url of urls) {
    try {
      const res = await axios.get(url, { headers, timeout: REQUEST_TIMEOUT });
      const raw = res.data?.data || res.data?.output?.models || res.data?.models || [];
      const models = modelsFromUnknown(raw);
      if (models.length) return models;
    } catch (err) {
      lastError = err;
      const { status } = extractError(err);
      if (status === 401 || status === 403) throw err;
    }
  }
  if (lastError) throw lastError;
  return [];
}

function modelsFromUnknown(raw) {
  const map = new Map();
  const list = Array.isArray(raw) ? raw : [];
  for (const item of list) {
    if (!item) continue;
    if (typeof item === "string") {
      addModel(map, item, item);
      continue;
    }
    const rawName = typeof item.name === "string" ? item.name : "";
    const stripped = rawName.replace(/^models\//, "");
    const id = item.id || item.model || item.model_id || item.model_name || stripped;
    const displayName =
      item.display_name ||
      item.displayName ||
      item.model_name ||
      (rawName && !rawName.startsWith("models/") ? rawName : "");
    const name = displayName || id;
    addModel(map, id, name);
    if (map.size >= MAX_MODELS) break;
  }
  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function addModel(map, id, name) {
  const modelId = String(id || "").trim();
  if (!modelId || map.has(modelId)) return;
  const modelName = String(name || "").trim() || modelId;
  map.set(modelId, { id: modelId, name: modelName });
}

function requireText(value, message) {
  const text = String(value || "").trim();
  if (!text) throw localError(message);
  return text;
}

function localError(message) {
  const err = new Error(message);
  err.local = true;
  return err;
}

function extractError(err) {
  const status = err?.status || err?.response?.status || err?.statusCode || null;
  const message =
    err?.error?.message ||
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "获取模型列表失败";
  return { status, message: String(message) };
}

function toUserMessage(err) {
  const { status, message } = extractError(err);
  const code = err?.code || err?.cause?.code;
  if (status === 401 || status === 403) {
    return "鉴权失败，请检查密钥后重试，或直接输入模型名称";
  }
  if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ECONNABORTED") {
    return "无法连接服务商，请检查地址或网络，也可直接输入模型名称";
  }
  return sanitizeMessage(message);
}

function sanitizeMessage(message) {
  return String(message || "获取模型列表失败")
    .replace(/key=[^&\s]+/gi, "key=***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***")
    .slice(0, 300);
}

module.exports = {
  listModels,
  modelsFromUnknown,
  sanitizeMessage,
};
