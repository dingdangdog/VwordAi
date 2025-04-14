import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const defaultExportPath = ref<string>('')

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

  return {
    theme,
    defaultExportPath,
    initTheme,
    toggleTheme,
    setDefaultExportPath,
    loadDefaultExportPath
  }
}) 