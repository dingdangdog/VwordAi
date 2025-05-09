import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { settingsApi } from "@/api";
import type {
  Settings,
  ConnectionTestResult,
  ServiceProviderType,
  ServiceProviderStatus,
  ServiceProviderConfig,
} from "@/types";

// 设置选项卡类型
export type SettingsTab = "provider" | "storage" | "system" | "about";

// 支持的服务商
export const SUPPORTED_PROVIDERS = [
  { id: "azure", name: "Azure", type: "azure" as ServiceProviderType },
  { id: "aliyun", name: "阿里云", type: "aliyun" as ServiceProviderType },
  // { id: "tencent", name: "腾讯云", type: "tencent" as ServiceProviderType },
  // { id: "baidu", name: "百度云", type: "baidu" as ServiceProviderType },
  // { id: "openai", name: "OpenAI", type: "openai" as ServiceProviderType },
];

export const useSettingsStore = defineStore("settings", () => {
  const theme = ref<"light" | "dark">("light");
  const defaultExportPath = ref<string>("");
  const activeTab = ref<SettingsTab>("provider");
  const activeProviderType = ref<ServiceProviderType | null>(null);
  const settings = ref<Settings | null>(null);
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

  // Set active provider
  function setActiveProvider(providerType: ServiceProviderType | null) {
    activeProviderType.value = providerType;
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

  // Get service provider config
  function getServiceProviderConfig(type: ServiceProviderType) {
    if (!settings.value) return null;
    return settings.value[type];
  }

  // Get all service providers config
  function getServiceProviders() {
    if (!settings.value) return [];

    return SUPPORTED_PROVIDERS.map((provider) => ({
      ...provider,
      config: settings.value ? settings.value[provider.type] : null,
    }));
  }

  // 获取服务商状态
  function getServiceProviderStatus(
    type: ServiceProviderType
  ): ServiceProviderStatus {
    const config = getServiceProviderConfig(type);
    return config?.status || "unconfigured";
  }

  // 检查服务商是否已配置但未测试
  function isProviderConfiguredButUntested(type: ServiceProviderType): boolean {
    return getServiceProviderStatus(type) === "untested";
  }

  // 检查服务商是否配置成功
  function isProviderConfigurationSuccess(type: ServiceProviderType): boolean {
    return getServiceProviderStatus(type) === "success";
  }

  // 检查服务商是否配置失败
  function isProviderConfigurationFailure(type: ServiceProviderType): boolean {
    return getServiceProviderStatus(type) === "failure";
  }

  // Test service provider connection
  async function testServiceProviderConnection(
    type: ServiceProviderType
  ): Promise<ConnectionTestResult> {
    try {
      // Make sure settings are loaded
      if (!settings.value) {
        await loadSettings();
      }
      const config = getServiceProviderConfig(type);
      if (!config) {
        return {
          success: false,
          message: `No configuration found for ${type}`,
        };
      }

      let response = await window.electron.invoke(
        "settings:test-provider-connection",
        type,
        { ...config }
      );

      if (response.success && response.data) {
        // 更新本地状态
        if (settings.value && settings.value[type]) {
          settings.value[type].status =
            (response.data.status as ServiceProviderStatus) || "success";
        }

        return {
          success: true,
          message: response.data.message || "Connection successful",
          data: response.data,
        };
      } else {
        // 更新本地状态
        if (settings.value && settings.value[type]) {
          settings.value[type].status = "failure";
        }

        return {
          success: false,
          message: response.error || response.message || "Connection failed",
        };
      }
    } catch (error) {
      console.error("Failed to test service provider connection:", error);
      // 更新本地状态
      if (settings.value && settings.value[type]) {
        settings.value[type].status = "failure";
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  // Update service provider config
  async function updateServiceProvider(
    type: ServiceProviderType,
    config: Partial<ServiceProviderConfig>
  ): Promise<boolean> {
    try {
      // 检查是否有实际配置的变化（忽略status字段）
      let hasConfigChanges = false;

      if (settings.value && settings.value[type]) {
        const currentConfig = { ...settings.value[type] };
        delete currentConfig.status;

        const newConfigWithoutStatus = { ...config };
        delete newConfigWithoutStatus.status;

        // 检查是否有变化
        const currentStr = JSON.stringify(currentConfig);
        const newStr = JSON.stringify(newConfigWithoutStatus);
        hasConfigChanges = currentStr !== newStr;
      }

      // Update local settings first
      if (settings.value) {
        if (!settings.value[type]) {
          settings.value[type] = {} as any;
        }

        // 合并配置
        settings.value[type] = { ...settings.value[type], ...config };

        // 如果配置有变化，更新状态
        if (hasConfigChanges) {
          // 检查配置是否完整
          const isConfigComplete = checkProviderConfigComplete(
            type,
            settings.value[type]
          );
          settings.value[type].status = isConfigComplete
            ? "untested"
            : "unconfigured";
        }
      }

      // Update on backend
      const partialSettings: Partial<Settings> = {};
      partialSettings[type] = config;
      const response = await settingsApi.update(partialSettings);
      return response.success;
    } catch (error) {
      console.error(`Failed to update ${type} config:`, error);
      return false;
    }
  }

  // async function saveBiliConfig(key: string, config: any): Promise<boolean> {
  //   try {
  //     // Update locally first for immediate UI response
  //     if (settings.value && settings.value.blive) {
  //       settings.value.blive[key] = config;
  //     }
  //     const bliveConfig = settings.value?.blive || {};
  //     const response = await updateServiceProvider("blive", bliveConfig);
  //     return response;
  //   } catch (error) {
  //     console.error("Failed to save bili config:", error);
  //     return false;
  //   }
  // }

  // 检查服务商配置是否完整
  function checkProviderConfigComplete(
    type: ServiceProviderType,
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

  // Get all settings
  function getAllSettings(): Settings | null {
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

  // Load service providers (now integrated in loadSettings)
  async function loadServiceProviders() {
    return await loadSettings();
  }

  return {
    theme,
    defaultExportPath,
    activeTab,
    activeProviderType,
    settings,
    isLoading,
    initTheme,
    toggleTheme,
    applyTheme,
    setDefaultExportPath,
    loadDefaultExportPath,
    setActiveTab,
    setActiveProvider,
    testServiceProviderConnection,
    getAllSettings,
    updateSettings,
    loadSettings,
    getServiceProviders,
    getServiceProviderConfig,
    updateServiceProvider,
    loadServiceProviders,
    getServiceProviderStatus,
    isProviderConfiguredButUntested,
    isProviderConfigurationSuccess,
    isProviderConfigurationFailure,
  };
});
