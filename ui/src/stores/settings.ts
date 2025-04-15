import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  ServiceProviderConfig,
  ServiceProviderType,
  AzureServiceProviderConfig,
  AliyunServiceProviderConfig,
  TencentServiceProviderConfig,
  BaiduServiceProviderConfig
} from '@/types'

// 设置选项卡类型
export type SettingsTab = 'provider' | 'storage' | 'about';

// 支持的服务商
export const SUPPORTED_PROVIDERS = [
  { id: 'azure', name: '微软 Azure TTS', type: 'azure' as ServiceProviderType },
  { id: 'aliyun', name: '阿里云语音服务', type: 'aliyun' as ServiceProviderType },
  { id: 'tencent', name: '腾讯云语音服务', type: 'tencent' as ServiceProviderType },
  { id: 'baidu', name: '百度智能云', type: 'baidu' as ServiceProviderType }
];

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const defaultExportPath = ref<string>('')
  const activeTab = ref<SettingsTab>('provider')
  const activeProviderId = ref<string | null>(null)
  const serviceProviders = ref<ServiceProviderConfig[]>([])

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
  function setDefaultExportPath(path: string) {
    defaultExportPath.value = path
    localStorage.setItem('defaultExportPath', path)
  }

  // Load default export path from localStorage
  function loadDefaultExportPath() {
    const path = localStorage.getItem('defaultExportPath')
    if (path) {
      defaultExportPath.value = path
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

  // Load service providers from localStorage
  function loadServiceProviders() {
    const providers = localStorage.getItem('serviceProviders')
    if (providers) {
      try {
        serviceProviders.value = JSON.parse(providers).map((provider: any) => ({
          ...provider,
          createdAt: new Date(provider.createdAt),
          updatedAt: new Date(provider.updatedAt)
        }))
        
        // Set the first provider as active if there's at least one provider and none is currently active
        if (serviceProviders.value.length > 0 && !activeProviderId.value) {
          activeProviderId.value = serviceProviders.value[0].id
        }
      } catch (e) {
        console.error('Failed to parse service providers from localStorage', e)
      }
    }
  }

  // Save service providers to localStorage
  function saveServiceProviders() {
    localStorage.setItem('serviceProviders', JSON.stringify(serviceProviders.value))
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
  function addServiceProvider(config: Partial<ServiceProviderConfig>): ServiceProviderConfig {
    const now = new Date()
    const newProvider: ServiceProviderConfig = {
      id: crypto.randomUUID(),
      name: config.name || '',
      apiKey: config.apiKey || '',
      secretKey: config.secretKey,
      createdAt: now,
      updatedAt: now,
      ...config
    }
    
    serviceProviders.value.push(newProvider)
    saveServiceProviders()
    
    // Set as active if it's the first one
    if (serviceProviders.value.length === 1) {
      activeProviderId.value = newProvider.id
    }
    
    return newProvider
  }

  // Update service provider
  function updateServiceProvider(id: string, updates: Partial<ServiceProviderConfig>): ServiceProviderConfig | null {
    const index = serviceProviders.value.findIndex(p => p.id === id)
    if (index === -1) return null
    
    const now = new Date()
    const updatedProvider = {
      ...serviceProviders.value[index],
      ...updates,
      updatedAt: now
    }
    
    serviceProviders.value[index] = updatedProvider
    saveServiceProviders()
    return updatedProvider
  }

  // Delete service provider
  function deleteServiceProvider(id: string): boolean {
    const index = serviceProviders.value.findIndex(p => p.id === id)
    if (index === -1) return false
    
    serviceProviders.value.splice(index, 1)
    saveServiceProviders()
    
    // Update active provider if the deleted one was active
    if (activeProviderId.value === id) {
      activeProviderId.value = serviceProviders.value.length > 0 ? serviceProviders.value[0].id : null
    }
    
    return true
  }

  return {
    theme,
    defaultExportPath,
    activeTab,
    activeProviderId,
    activeProvider,
    serviceProviders,
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
    deleteServiceProvider
  }
}) 