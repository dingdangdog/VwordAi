import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingsApi, serviceProviderApi } from '@/utils/api'
import type { 
  ServiceProvider,
  Settings,
  ChapterSettings,
  VoiceRole,
  ConnectionTestResult
} from '@/types'

// 设置选项卡类型
export type SettingsTab = 'provider' | 'storage' | 'system' | 'about';

// 支持的服务商
export const SUPPORTED_PROVIDERS = [
  { id: 'azure', name: '微软 Azure TTS', type: 'azure' },
  { id: 'aliyun', name: '阿里云语音服务', type: 'aliyun' },
  { id: 'tencent', name: '腾讯云语音服务', type: 'tencent' },
  { id: 'baidu', name: '百度智能云', type: 'baidu' }
];

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const defaultExportPath = ref<string>('')
  const activeTab = ref<SettingsTab>('provider')
  const activeProviderId = ref<string | null>(null)
  const serviceProviders = ref<ServiceProvider[]>([])
  const isLoading = ref(false)

  // Initialize theme based on localStorage or system preference
  function initTheme() {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || savedTheme === 'light') {
      theme.value = savedTheme
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.value = 'dark'
    }
    applyTheme()
  }

  // Toggle theme between light and dark
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
    applyTheme()
  }

  // Apply theme to document
  function applyTheme() {
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Set default export path
  async function setDefaultExportPath(path: string) {
    try {
      const response = await settingsApi.setDefaultExportPath(path)
      if (response.success) {
        defaultExportPath.value = path
        return true
      } else {
        console.error('Failed to set export path:', response.error)
        return false
      }
    } catch (error) {
      console.error('Failed to set export path:', error)
      return false
    }
  }

  // Load default export path from backend
  async function loadDefaultExportPath() {
    try {
      const response = await settingsApi.getDefaultExportPath()
      if (response.success && response.data?.path) {
        defaultExportPath.value = response.data.path
      }
    } catch (error) {
      console.error('Failed to load export path:', error)
    }
  }

  // Settings tabs management
  function setActiveTab(tab: SettingsTab) {
    activeTab.value = tab
  }

  // Set active provider
  function setActiveProvider(providerId: string | null) {
    activeProviderId.value = providerId
  }

  // Load service providers from backend
  async function loadServiceProviders() {
    isLoading.value = true
    try {
      const response = await serviceProviderApi.getAll()
      if (response.success && response.data) {
        serviceProviders.value = response.data
        
        // Set the first provider as active if there's at least one provider and none is currently active
        if (serviceProviders.value.length > 0 && !activeProviderId.value) {
          activeProviderId.value = serviceProviders.value[0].id
        }
      } else {
        console.error('Failed to load service providers:', response.error)
      }
    } catch (error) {
      console.error('Failed to load service providers:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Get all service providers
  function getServiceProviders() {
    return serviceProviders.value
  }

  // Get active provider
  const activeProvider = computed(() => {
    if (!activeProviderId.value) return null
    return serviceProviders.value.find(p => p.id === activeProviderId.value) || null
  })

  // Get provider by ID
  function getProviderById(id: string) {
    return serviceProviders.value.find(p => p.id === id) || null
  }

  // Add new service provider
  async function addServiceProvider(providerData: Partial<ServiceProvider>): Promise<ServiceProvider | null> {
    try {
      const response = await serviceProviderApi.create(providerData)
      
      if (response.success && response.data) {
        const newProvider = response.data
        serviceProviders.value.push(newProvider)
        
        // Set as active if it's the first one
        if (serviceProviders.value.length === 1) {
          activeProviderId.value = newProvider.id
        }
        
        return newProvider
      } else {
        console.error('Failed to create service provider:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to create service provider:', error)
      return null
    }
  }

  // Update service provider
  async function updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | null> {
    try {
      const response = await serviceProviderApi.update(id, updates)
      
      if (response.success && response.data) {
        const updatedProvider = response.data
        const index = serviceProviders.value.findIndex(p => p.id === id)
        
        if (index !== -1) {
          serviceProviders.value[index] = updatedProvider
        }
        
        return updatedProvider
      } else {
        console.error('Failed to update service provider:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to update service provider:', error)
      return null
    }
  }

  // Delete service provider
  async function deleteServiceProvider(id: string): Promise<boolean> {
    try {
      const response = await serviceProviderApi.delete(id)
      
      if (response.success) {
        const index = serviceProviders.value.findIndex(p => p.id === id)
        if (index !== -1) {
          serviceProviders.value.splice(index, 1)
        }
        
        // Update active provider if the deleted one was active
        if (activeProviderId.value === id) {
          activeProviderId.value = serviceProviders.value.length > 0 ? serviceProviders.value[0].id : null
        }
        
        return true
      } else {
        console.error('Failed to delete service provider:', response.error)
        return false
      }
    } catch (error) {
      console.error('Failed to delete service provider:', error)
      return false
    }
  }

  // Test service provider connection
  async function testServiceProviderConnection(id: string): Promise<ConnectionTestResult> {
    try {
      const response = await serviceProviderApi.testConnection(id)
      
      if (response.success && response.data) {
        return {
          success: true,
          message: response.data.message || 'Connection successful'
        }
      } else {
        return {
          success: false,
          message: response.error || 'Connection failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  // Get voice roles for a provider
  async function getVoiceRoles(providerId: string): Promise<VoiceRole[]> {
    try {
      const response = await serviceProviderApi.getVoiceRoles(providerId)
      
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Failed to get voice roles:', response.error)
        return []
      }
    } catch (error) {
      console.error('Failed to get voice roles:', error)
      return []
    }
  }

  // Get all settings
  async function getAllSettings(): Promise<Settings | null> {
    try {
      const response = await settingsApi.getAll()
      
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Failed to get settings:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to get settings:', error)
      return null
    }
  }

  // Update settings
  async function updateSettings(settingsData: Partial<Settings>): Promise<Settings | null> {
    try {
      const response = await settingsApi.update(settingsData)
      
      if (response.success && response.data) {
        // Update local values if present in the response
        if (settingsData.theme) {
          theme.value = settingsData.theme
          applyTheme()
        }
        
        if (settingsData.defaultExportPath) {
          defaultExportPath.value = settingsData.defaultExportPath
        }
        
        return response.data
      } else {
        console.error('Failed to update settings:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      return null
    }
  }

  return {
    theme,
    defaultExportPath,
    activeTab,
    activeProviderId,
    activeProvider,
    serviceProviders,
    isLoading,
    initTheme,
    toggleTheme,
    setDefaultExportPath,
    loadDefaultExportPath,
    setActiveTab,
    setActiveProvider,
    loadServiceProviders,
    getServiceProviders,
    getProviderById,
    addServiceProvider,
    updateServiceProvider,
    deleteServiceProvider,
    testServiceProviderConnection,
    getVoiceRoles,
    getAllSettings,
    updateSettings
  }
}) 