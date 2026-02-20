import { defineStore } from "pinia";
import { ref } from "vue";
import { settingsApi } from "@/api";
import type {
  Settings,
  ConnectionTestResult,
  TTSProviderType,
  LLMProviderType,
  LLMProviderConfig,
  LLMProtocol,
  ServiceProviderStatus,
  TTSProviderConfig,
} from "@/types";

// 设置选项卡类型（语音服务合并 TTS 配置与语音模型）
export type SettingsTab = "voice" | "llm" | "system" | "about";

// 支持的TTS服务商
export const SUPPORTED_TTS_PROVIDERS = [
  { id: "azure", name: "Azure", type: "azure" as TTSProviderType },
  { id: "aliyun", name: "阿里云", type: "aliyun" as TTSProviderType },
  // { id: "tencent", name: "腾讯云", type: "tencent" as TTSProviderType },
  // { id: "openai", name: "OpenAI", type: "openai" as TTSProviderType },
];

// 可选协议列表（用于新增服务商时选择）
export const LLM_PROTOCOLS: { value: LLMProtocol; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "volcengine", label: "火山引擎" },
  { value: "aliyun", label: "阿里云百炼" },
  { value: "gemini", label: "Google Gemini" },
  { value: "claude", label: "Anthropic Claude" },
];

export const useSettingsStore = defineStore("settings", () => {
  const theme = ref<"light" | "dark">("light");
  const defaultExportPath = ref<string>("");
  const activeTab = ref<SettingsTab>("voice");
  const activeTTSProviderType = ref<TTSProviderType | null>(null);
  const activeLLMProviderType = ref<LLMProviderType | null>(null);
  const settings = ref<Settings | null>(null);
  const ttsSettings = ref<any | null>(null);
  const llmSettings = ref<any | null>(null);
  const bliveSettings = ref<any | null>(null);
  const isLoading = ref(false);

  // Initialize theme based on localStorage or system preference
  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      theme.value = savedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme.value = "dark";
    }
    applyTheme();
  }

  // Toggle theme between light and dark
  function toggleTheme() {
    theme.value = theme.value === "light" ? "dark" : "light";
    localStorage.setItem("theme", theme.value);
    applyTheme();
  }

  // Apply theme to document
  function applyTheme() {
    if (theme.value === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // Set default export path
  async function setDefaultExportPath(path: string) {
    try {
      // Update locally first for immediate UI response
      defaultExportPath.value = path;

      // Update the settings object
      if (settings.value) {
        settings.value.defaultExportPath = path;
      }

      // Save to backend
      await updateSettings({ defaultExportPath: path });
      return true;
    } catch (error) {
      console.error("Failed to set export path:", error);
      return false;
    }
  }

  // Load default export path from settings
  async function loadDefaultExportPath() {
    try {
      await loadSettings();
      if (settings.value) {
        defaultExportPath.value = settings.value.defaultExportPath;
      }
    } catch (error) {
      console.error("Failed to load export path:", error);
    }
  }

  // Settings tabs management
  function setActiveTab(tab: SettingsTab) {
    activeTab.value = tab;
  }

  // Set active TTS provider
  function setActiveTTSProvider(providerType: TTSProviderType | null) {
    activeTTSProviderType.value = providerType;
  }

  // Set active LLM provider
  function setActiveLLMProvider(providerType: LLMProviderType | null) {
    activeLLMProviderType.value = providerType;
  }

  // Load all settings
  async function loadSettings() {
    if (isLoading.value) return settings.value;
    isLoading.value = true;

    try {
      const response = await settingsApi.getAll();
      console.log("loadSettings response:", response);
      if (response.success && response.data) {
        settings.value = response.data;

        // Update local values
        if (settings.value?.theme) {
          theme.value = settings.value.theme;
          applyTheme();
        }

        if (settings.value?.defaultExportPath) {
          defaultExportPath.value = settings.value.defaultExportPath;
        }

        return settings.value;
      } else {
        console.error("Failed to load settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Load TTS settings
  async function loadTTSSettings() {
    try {
      const response = await settingsApi.getTTSSettings();
      console.log("loadTTSSettings response:", response);
      if (response.success && response.data) {
        ttsSettings.value = response.data;
        return ttsSettings.value;
      } else {
        console.error("Failed to load TTS settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to load TTS settings:", error);
      return null;
    }
  }

  // Load LLM settings
  async function loadLLMSettings() {
    try {
      const response = await settingsApi.getLLMSettings();
      console.log("loadLLMSettings response:", response);
      if (response.success && response.data) {
        llmSettings.value = response.data;
        return llmSettings.value;
      } else {
        console.error("Failed to load LLM settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to load LLM settings:", error);
      return null;
    }
  }

  // Load Blive settings
  async function loadBliveSettings() {
    try {
      const response = await settingsApi.getBliveSettings();
      console.log("loadBliveSettings response:", response);
      if (response.success && response.data) {
        bliveSettings.value = response.data;
        return bliveSettings.value;
      } else {
        console.error("Failed to load Blive settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to load Blive settings:", error);
      return null;
    }
  }

  // Get TTS service provider config
  function getTTSProviderConfig(type: TTSProviderType) {
    if (!ttsSettings.value) return null;
    return ttsSettings.value[type];
  }

  // Get LLM service provider config（按 providerId）
  function getLLMProviderConfig(providerId: LLMProviderType) {
    if (!llmSettings.value?.providers) return null;
    return llmSettings.value.providers[providerId] ?? null;
  }

  // Get all TTS service providers config
  function getTTSProviders() {
    if (!ttsSettings.value) return [];

    return SUPPORTED_TTS_PROVIDERS.map((provider) => ({
      ...provider,
      config: ttsSettings.value ? ttsSettings.value[provider.type] : null,
      status:
        ttsSettings.value && ttsSettings.value[provider.type]
          ? ttsSettings.value[provider.type].status
          : "unconfigured",
    }));
  }

  // Get all LLM service providers（从配置的 providers 列表）
  function getLLMProviders(): (LLMProviderConfig & { config: LLMProviderConfig | null })[] {
    const prov = llmSettings.value?.providers || {};
    return Object.entries(prov).map(([id, c]) => ({
      ...c,
      id,
      config: c,
      status: c.status || "unconfigured",
    }));
  }

  // 获取TTS服务商状态
  function getTTSProviderStatus(type: TTSProviderType): ServiceProviderStatus {
    const config = getTTSProviderConfig(type);
    return config?.status || "unconfigured";
  }

  // 获取LLM服务商状态
  function getLLMProviderStatus(providerId: LLMProviderType): ServiceProviderStatus {
    const config = getLLMProviderConfig(providerId);
    return config?.status || "unconfigured";
  }

  // 检查TTS服务商是否已配置但未测试
  function isTTSProviderConfiguredButUntested(type: TTSProviderType): boolean {
    return getTTSProviderStatus(type) === "untested";
  }

  // 检查LLM服务商是否已配置但未测试
  function isLLMProviderConfiguredButUntested(type: LLMProviderType): boolean {
    return getLLMProviderStatus(type) === "untested";
  }

  // 检查TTS服务商是否配置成功
  function isTTSProviderConfigurationSuccess(type: TTSProviderType): boolean {
    return getTTSProviderStatus(type) === "success";
  }

  // 检查LLM服务商是否配置成功
  function isLLMProviderConfigurationSuccess(type: LLMProviderType): boolean {
    return getLLMProviderStatus(type) === "success";
  }

  // 检查TTS服务商是否配置失败
  function isTTSProviderConfigurationFailure(type: TTSProviderType): boolean {
    return getTTSProviderStatus(type) === "failure";
  }

  // 检查LLM服务商是否配置失败
  function isLLMProviderConfigurationFailure(type: LLMProviderType): boolean {
    return getLLMProviderStatus(type) === "failure";
  }

  // Test TTS service provider connection
  async function testTTSProviderConnection(
    type: TTSProviderType,
    model?: any
  ): Promise<ConnectionTestResult> {
    try {
      // Make sure settings are loaded
      if (!ttsSettings.value) {
        await loadTTSSettings();
      }

      let response = await settingsApi.testTTSProviderConnection(type, model);

      if (response.success && response.data) {
        // 更新本地状态
        if (ttsSettings.value && ttsSettings.value[type]) {
          ttsSettings.value[type].status =
            (response.data.status as ServiceProviderStatus) || "success";
        }

        return {
          success: true,
          message: response.data.message || "Connection successful",
          data: response.data,
        };
      } else {
        // 更新本地状态
        if (ttsSettings.value && ttsSettings.value[type]) {
          ttsSettings.value[type].status = "failure";
        }

        return {
          success: false,
          message: response.error || "Connection failed",
        };
      }
    } catch (error) {
      console.error("Failed to test TTS service provider connection:", error);
      // 更新本地状态
      if (ttsSettings.value && ttsSettings.value[type]) {
        ttsSettings.value[type].status = "failure";
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  // Test LLM service provider connection
  async function testLLMProviderConnection(
    type: LLMProviderType,
    data?: any
  ): Promise<ConnectionTestResult> {
    try {
      // Make sure settings are loaded
      if (!llmSettings.value) {
        await loadLLMSettings();
      }

      let response = await settingsApi.testLLMProviderConnection(type, data);

      if (response.success && response.data) {
        if (llmSettings.value?.providers?.[type]) {
          llmSettings.value.providers[type].status =
            (response.data.status as ServiceProviderStatus) || "success";
        }

        return {
          success: true,
          message: response.data.message || "Connection successful",
          data: response.data,
        };
      } else {
        if (llmSettings.value?.providers?.[type]) {
          llmSettings.value.providers[type].status = "failure";
        }

        return {
          success: false,
          message: response.error || "Connection failed",
        };
      }
    } catch (error) {
      console.error("Failed to test LLM service provider connection:", error);
      if (llmSettings.value?.providers?.[type]) {
        llmSettings.value.providers[type].status = "failure";
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  // Update TTS service provider config
  async function updateTTSProvider(
    type: TTSProviderType,
    config: Partial<TTSProviderConfig>
  ): Promise<boolean> {
    try {
      // 检查是否有实际配置的变化（忽略status字段）
      let hasConfigChanges = false;

      if (ttsSettings.value && ttsSettings.value[type]) {
        const currentConfig = { ...ttsSettings.value[type] };
        delete currentConfig.status;

        const newConfigWithoutStatus = { ...config };
        delete newConfigWithoutStatus.status;

        // 检查是否有变化
        const currentStr = JSON.stringify(currentConfig);
        const newStr = JSON.stringify(newConfigWithoutStatus);
        hasConfigChanges = currentStr !== newStr;
      }

      // Update local settings first
      if (ttsSettings.value) {
        if (!ttsSettings.value[type]) {
          ttsSettings.value[type] = {} as any;
        }

        // 合并配置
        ttsSettings.value[type] = { ...ttsSettings.value[type], ...config };

        // 如果配置有变化，更新状态
        if (hasConfigChanges) {
          // 检查配置是否完整
          const isConfigComplete = checkTTSProviderConfigComplete(
            type,
            ttsSettings.value[type]
          );

          if (!config.status) {
            ttsSettings.value[type].status = isConfigComplete
              ? "untested"
              : "unconfigured";
          }
        }
      }

      // Update on backend
      const response = await settingsApi.updateTTSProviderSettings(
        type,
        config
      );
      return response.success;
    } catch (error) {
      console.error(`Failed to update ${type} TTS config:`, error);
      return false;
    }
  }

  // Update LLM service provider config（providerId + 部分配置）
  async function updateLLMProvider(
    providerId: LLMProviderType,
    config: Partial<LLMProviderConfig> & Record<string, any>
  ): Promise<boolean> {
    try {
      let hasConfigChanges = false;
      const prov = llmSettings.value?.providers || {};

      if (prov[providerId]) {
        const currentConfig = { ...prov[providerId] };
        delete currentConfig.status;
        const newConfigWithoutStatus = { ...config };
        delete newConfigWithoutStatus.status;
        hasConfigChanges =
          JSON.stringify(currentConfig) !== JSON.stringify(newConfigWithoutStatus);
      }

      if (llmSettings.value) {
        if (!llmSettings.value.providers) llmSettings.value.providers = {};
        const cur = llmSettings.value.providers[providerId] || {};
        llmSettings.value.providers[providerId] = { ...cur, ...config };

        if (hasConfigChanges && !config.status) {
          const isComplete = checkLLMProviderConfigComplete(
            providerId,
            llmSettings.value.providers[providerId]
          );
          llmSettings.value.providers[providerId].status = isComplete
            ? "untested"
            : "unconfigured";
        }
      }

      const response = await settingsApi.updateLLMProviderSettings(
        providerId,
        config
      );
      return response.success;
    } catch (error) {
      console.error(`Failed to update ${providerId} LLM config:`, error);
      return false;
    }
  }

  // 检查TTS服务商配置是否完整
  function checkTTSProviderConfigComplete(
    type: TTSProviderType,
    config: any
  ): boolean {
    switch (type) {
      case "azure":
        return Boolean(config.key && config.region);
      case "aliyun":
        return Boolean(config.appkey && config.token);
      case "tencent":
        return Boolean(config.secretId && config.secretKey);
      case "baidu":
        return Boolean(config.apiKey && config.secretKey);
      case "openai":
        return Boolean(config.apiKey);
      default:
        return false;
    }
  }

  // 检查LLM服务商配置是否完整（按 protocol）
  function checkLLMProviderConfigComplete(
    _providerId: LLMProviderType,
    config: any
  ): boolean {
    const protocol = config?.protocol || _providerId;
    switch (protocol) {
      case "volcengine":
      case "openai":
      case "azure":
      case "gemini":
      case "claude":
        return Boolean(config?.key && config?.model);
      case "aliyun":
        return Boolean(config?.appkey && config?.token);
      default:
        return false;
    }
  }

  // 新增 LLM 服务商，返回新 provider 的 id，失败返回 null
  async function addLLMProvider(
    data: Partial<LLMProviderConfig> & { name: string; protocol: LLMProtocol }
  ): Promise<string | null> {
    try {
      const id =
        data.id ||
        `${data.protocol}-${Date.now().toString(36)}`;
      const provider: LLMProviderConfig = {
        id,
        name: data.name,
        protocol: data.protocol,
        key: data.key,
        appkey: data.appkey,
        token: data.token,
        endpoint: data.endpoint,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        topP: data.topP,
        status: "unconfigured",
      };
      const response = await settingsApi.updateLLMProviderSettings(id, provider);
      if (response.success) {
        await loadLLMSettings();
        return id;
      }
      return null;
    } catch (e) {
      console.error("addLLMProvider:", e);
      return null;
    }
  }

  // 删除 LLM 服务商
  async function deleteLLMProvider(providerId: string): Promise<boolean> {
    try {
      const response = await settingsApi.deleteLLMProvider(providerId);
      if (response.success) {
        await loadLLMSettings();
        return true;
      }
      return false;
    } catch (e) {
      console.error("deleteLLMProvider:", e);
      return false;
    }
  }

  // Get all settings
  function getSettings(): Settings | null {
    return settings.value;
  }

  // Update settings
  async function updateSettings(
    settingsData: Partial<Settings>
  ): Promise<Settings | null> {
    try {
      // Update local copy first for responsive UI
      if (settings.value) {
        settings.value = { ...settings.value, ...settingsData };
      }

      // Update backend
      const response = await settingsApi.update(settingsData);

      if (response.success && response.data) {
        // Update entire settings object with response
        settings.value = response.data;

        // Update local values for reactive UI elements
        if (settingsData.theme) {
          theme.value = settingsData.theme;
          applyTheme();
        }

        if (settingsData.defaultExportPath) {
          defaultExportPath.value = settingsData.defaultExportPath;
        }

        return response.data;
      } else {
        console.error("Failed to update settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      return null;
    }
  }

  // Update TTS settings
  async function updateTTSSettings(data: any): Promise<any | null> {
    try {
      if (ttsSettings.value) {
        ttsSettings.value = { ...ttsSettings.value, ...data };
      } else {
        ttsSettings.value = data;
      }

      const response = await settingsApi.updateTTSSettings(data);
      if (response.success && response.data) {
        ttsSettings.value = response.data;
        return response.data;
      } else {
        console.error("Failed to update TTS settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to update TTS settings:", error);
      return null;
    }
  }

  // Update LLM settings
  async function updateLLMSettings(data: any): Promise<any | null> {
    try {
      if (llmSettings.value) {
        llmSettings.value = { ...llmSettings.value, ...data };
      } else {
        llmSettings.value = data;
      }

      const response = await settingsApi.updateLLMSettings(data);
      if (response.success && response.data) {
        llmSettings.value = response.data;
        return response.data;
      } else {
        console.error("Failed to update LLM settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to update LLM settings:", error);
      return null;
    }
  }

  // Update Blive settings
  async function updateBliveSettings(data: any): Promise<any | null> {
    try {
      if (bliveSettings.value) {
        bliveSettings.value = { ...bliveSettings.value, ...data };
      } else {
        bliveSettings.value = data;
      }

      const response = await settingsApi.updateBliveSettings(data);
      if (response.success && response.data) {
        bliveSettings.value = response.data;
        return response.data;
      } else {
        console.error("Failed to update Blive settings:", response.error);
        return null;
      }
    } catch (error) {
      console.error("Failed to update Blive settings:", error);
      return null;
    }
  }

  return {
    theme,
    defaultExportPath,
    activeTab,
    activeTTSProviderType,
    activeLLMProviderType,
    settings,
    ttsSettings,
    llmSettings,
    bliveSettings,
    isLoading,
    initTheme,
    toggleTheme,
    applyTheme,
    setDefaultExportPath,
    loadDefaultExportPath,
    setActiveTab,
    setActiveTTSProvider,
    setActiveLLMProvider,
    testTTSProviderConnection,
    testLLMProviderConnection,
    getSettings,
    updateSettings,
    loadSettings,
    loadTTSSettings,
    loadLLMSettings,
    loadBliveSettings,
    getTTSProviders,
    getLLMProviders,
    getTTSProviderConfig,
    getLLMProviderConfig,
    updateTTSProvider,
    updateLLMProvider,
    getTTSProviderStatus,
    getLLMProviderStatus,
    isTTSProviderConfiguredButUntested,
    isLLMProviderConfiguredButUntested,
    isTTSProviderConfigurationSuccess,
    isLLMProviderConfigurationSuccess,
    isTTSProviderConfigurationFailure,
    isLLMProviderConfigurationFailure,
    updateTTSSettings,
    updateLLMSettings,
    updateBliveSettings,
    addLLMProvider,
    deleteLLMProvider,
  };
});
