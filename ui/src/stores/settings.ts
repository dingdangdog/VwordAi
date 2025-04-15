import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { settingsApi } from "@/utils/api";
import type {
  Settings,
  ConnectionTestResult,
  ServiceProviderType,
} from "@/types";

// 设置选项卡类型
export type SettingsTab = "provider" | "storage" | "system" | "about";

// 支持的服务商
export const SUPPORTED_PROVIDERS = [
  { id: "azure", name: "微软 Azure TTS", type: "azure" as ServiceProviderType },
  {
    id: "aliyun",
    name: "阿里云语音服务",
    type: "aliyun" as ServiceProviderType,
  },
  {
    id: "tencent",
    name: "腾讯云语音服务",
    type: "tencent" as ServiceProviderType,
  },
  { id: "baidu", name: "百度智能云", type: "baidu" as ServiceProviderType },
  { id: "openai", name: "OpenAI TTS", type: "openai" as ServiceProviderType },
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
    if (isLoading.value) return;
    isLoading.value = true;

    try {
      const response = await settingsApi.getAll();
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

      const response = await settingsApi.testProviderConnection(type);

      if (response.success && response.data) {
        return {
          success: true,
          message: response.data.message || "Connection successful",
        };
      } else {
        return {
          success: false,
          message: response.error || "Connection failed",
        };
      }
    } catch (error) {
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
    config: any
  ): Promise<boolean> {
    try {
      // Update local settings first
      if (settings.value) {
        settings.value[type] = { ...settings.value[type], ...config };
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
  };
});
