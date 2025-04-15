import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Chapter, ChapterSettings } from '@/types'
import { projectApi, chapterApi } from '@/utils/api'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const chapters = ref<Chapter[]>([])
  const currentProjectId = ref<string | null>(null)
  const isLoading = ref(false)

  // Project getters
  const currentProject = computed(() => {
    if (!currentProjectId.value) return null
    return projects.value.find(p => p.id === currentProjectId.value) || null
  })

  const projectsSorted = computed(() => {
    return [...projects.value].sort((a, b) => {
      return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
    })
  })

  // Chapter getters
  const chaptersForCurrentProject = computed(() => {
    if (!currentProjectId.value) return []
    return chapters.value
      .filter(c => c.projectId === currentProjectId.value)
      .sort((a, b) => {
        return a.order - b.order
      })
  })

  // Project methods
  async function loadProjects() {
    isLoading.value = true
    try {
      const response = await projectApi.getAll()
      if (response.success && response.data) {
        projects.value = response.data
      } else {
        console.error('Failed to load projects:', response.error)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(title: string, description: string = '', defaultSettings: Partial<ChapterSettings> = {}) {
    try {
      const response = await projectApi.create({
        title,
        description,
        author: '',
        tags: [],
        coverImage: null,
        defaultVoiceSettings: defaultSettings
      })
      
      if (response.success && response.data) {
        projects.value.push(response.data)
        return response.data
      } else {
        console.error('Failed to create project:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      return null
    }
  }

  async function updateProject(
    id: string,
    data: { title?: string; description?: string; author?: string; tags?: string[]; coverImage?: string | null; defaultVoiceSettings?: Partial<ChapterSettings> }
  ) {
    try {
      const response = await projectApi.update(id, data)
      
      if (response.success && response.data) {
        const index = projects.value.findIndex(p => p.id === id)
        if (index !== -1) {
          projects.value[index] = response.data
        }
        return response.data
      } else {
        console.error('Failed to update project:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to update project:', error)
      return null
    }
  }

  async function deleteProject(id: string) {
    try {
      const response = await projectApi.delete(id)
      
      if (response.success) {
        const index = projects.value.findIndex(p => p.id === id)
        if (index !== -1) {
          projects.value.splice(index, 1)
        }
        
        // Filter out deleted project's chapters
        chapters.value = chapters.value.filter(c => c.projectId !== id)
        
        if (currentProjectId.value === id) {
          currentProjectId.value = null
        }
        
        return true
      } else {
        console.error('Failed to delete project:', response.error)
        return false
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  }

  function setCurrentProject(id: string | null) {
    currentProjectId.value = id
    if (id) {
      loadChaptersByProjectId(id)
    }
  }

  // Chapter methods
  async function loadChaptersByProjectId(projectId: string) {
    isLoading.value = true
    try {
      const response = await chapterApi.getByProjectId(projectId)
      if (response.success && response.data) {
        chapters.value = response.data
      } else {
        console.error('Failed to load chapters:', response.error)
      }
    } catch (error) {
      console.error('Failed to load chapters:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function createChapter(projectId: string, name: string, text: string = '', settings: Partial<ChapterSettings> = {}) {
    try {
      const project = projects.value.find(p => p.id === projectId)
      if (!project) return null

      // Initialize with default settings
      const chapterSettings: Partial<ChapterSettings> = {
        serviceProvider: null,
        voice: null,
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        ...settings
      }

      const response = await chapterApi.create({
        projectId,
        name,
        text,
        settings: chapterSettings,
        order: chapters.value.filter(c => c.projectId === projectId).length + 1,
        wordCount: text.length
      })
      
      if (response.success && response.data) {
        chapters.value.push(response.data)
        return response.data
      } else {
        console.error('Failed to create chapter:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to create chapter:', error)
      return null
    }
  }

  async function updateChapter(
    id: string,
    data: { name?: string; text?: string; settings?: Partial<ChapterSettings>; order?: number }
  ) {
    try {
      const response = await chapterApi.update(id, data)
      
      if (response.success && response.data) {
        const index = chapters.value.findIndex(c => c.id === id)
        if (index !== -1) {
          chapters.value[index] = response.data
        }
        return response.data
      } else {
        console.error('Failed to update chapter:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to update chapter:', error)
      return null
    }
  }

  async function deleteChapter(id: string) {
    try {
      const response = await chapterApi.delete(id)
      
      if (response.success) {
        const index = chapters.value.findIndex(c => c.id === id)
        if (index !== -1) {
          chapters.value.splice(index, 1)
        }
        return true
      } else {
        console.error('Failed to delete chapter:', response.error)
        return false
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error)
      return false
    }
  }

  async function getChapter(id: string) {
    // Check if we already have it in memory
    const cachedChapter = chapters.value.find(c => c.id === id)
    if (cachedChapter) return cachedChapter
    
    try {
      const response = await chapterApi.getById(id)
      if (response.success && response.data) {
        return response.data
      } else {
        console.error('Failed to get chapter:', response.error)
        return null
      }
    } catch (error) {
      console.error('Failed to get chapter:', error)
      return null
    }
  }

  return {
    // State
    projects,
    chapters,
    currentProjectId,
    isLoading,
    // Getters
    currentProject,
    projectsSorted,
    chaptersForCurrentProject,
    // Project methods
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    // Chapter methods
    loadChaptersByProjectId,
    createChapter,
    updateChapter,
    deleteChapter,
    getChapter
  }
}) 