import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Chapter, TTSSettings } from '@/types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const chapters = ref<Chapter[]>([])
  const currentProjectId = ref<string | null>(null)

  // Project getters
  const currentProject = computed(() => {
    if (!currentProjectId.value) return null
    return projects.value.find(p => p.id === currentProjectId.value) || null
  })

  const projectsSorted = computed(() => {
    return [...projects.value].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  })

  // Chapter getters
  const chaptersForCurrentProject = computed(() => {
    if (!currentProjectId.value) return []
    return chapters.value
      .filter(c => c.projectId === currentProjectId.value)
      .sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
  })

  // Project methods
  function loadProjects() {
    const storedProjects = localStorage.getItem('projects')
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects)
        projects.value = parsedProjects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }))
      } catch (e) {
        console.error('Failed to parse projects from localStorage', e)
      }
    }
  }

  function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects.value))
  }

  function createProject(name: string, description: string = '', defaultSettings: TTSSettings = {}) {
    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      defaultSettings,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    projects.value.push(newProject)
    saveProjects()
    return newProject
  }

  function updateProject(
    id: string,
    data: { name?: string; description?: string; defaultSettings?: TTSSettings }
  ) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index === -1) return false

    const updatedProject = {
      ...projects.value[index],
      ...data,
      updatedAt: new Date()
    }

    projects.value[index] = updatedProject
    saveProjects()
    return updatedProject
  }

  function deleteProject(id: string) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index === -1) return false

    projects.value.splice(index, 1)
    
    // Also delete all chapters for this project
    chapters.value = chapters.value.filter(c => c.projectId !== id)
    
    saveProjects()
    saveChapters()
    
    if (currentProjectId.value === id) {
      currentProjectId.value = null
    }
    
    return true
  }

  function setCurrentProject(id: string | null) {
    currentProjectId.value = id
  }

  // Chapter methods
  function loadChapters() {
    const storedChapters = localStorage.getItem('chapters')
    if (storedChapters) {
      try {
        const parsedChapters = JSON.parse(storedChapters)
        chapters.value = parsedChapters.map((chapter: any) => ({
          ...chapter,
          createdAt: new Date(chapter.createdAt),
          updatedAt: new Date(chapter.updatedAt)
        }))
      } catch (e) {
        console.error('Failed to parse chapters from localStorage', e)
      }
    }
  }

  function saveChapters() {
    localStorage.setItem('chapters', JSON.stringify(chapters.value))
  }

  function createChapter(projectId: string, name: string, text: string = '') {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return null

    const newChapter: Chapter = {
      id: uuidv4(),
      projectId,
      name,
      text,
      settings: { ...project.defaultSettings },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    chapters.value.push(newChapter)
    saveChapters()
    return newChapter
  }

  function updateChapter(
    id: string,
    data: { name?: string; text?: string; settings?: TTSSettings }
  ) {
    const index = chapters.value.findIndex(c => c.id === id)
    if (index === -1) return false

    const updatedChapter = {
      ...chapters.value[index],
      ...data,
      updatedAt: new Date()
    }

    chapters.value[index] = updatedChapter
    saveChapters()
    return updatedChapter
  }

  function deleteChapter(id: string) {
    const index = chapters.value.findIndex(c => c.id === id)
    if (index === -1) return false

    chapters.value.splice(index, 1)
    saveChapters()
    return true
  }

  function getChapter(id: string) {
    return chapters.value.find(c => c.id === id) || null
  }

  return {
    // State
    projects,
    chapters,
    currentProjectId,
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
    loadChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    getChapter
  }
}) 