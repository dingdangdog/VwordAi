<template>
  <div class="container mx-auto p-4">
    <div v-if="projects.length === 0" class="card text-center py-12">
      <h2 class="text-xl font-semibold text-ink mb-4">
        暂无项目
      </h2>
      <p class="text-ink mb-6">
        您还没有创建任何项目，请点击上面的"新建项目"按钮开始使用。
      </p>
      <button
        @click="openCreateProjectModal"
        class="btn btn-primary mb-4 flex items-center mx-auto"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        新建项目
      </button>
    </div>

    <div v-else>
      <div class="flex justify-center mb-4 gap-4">
        <button
          @click="openCreateProjectModal"
          class="btn btn-primary flex items-center"
        >
          <PlusIcon class="h-5 w-5 mr-2" />
          新建项目
        </button>
        <button
          @click="importProject"
          class="btn btn-secondary flex items-center"
        >
          <ArrowDownTrayIcon class="h-5 w-5 mr-2" />
          导入项目
        </button>
        <input
          type="file"
          ref="fileInput"
          accept=".json"
          class="hidden"
          @change="handleFileImport"
        />
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projects"
          :key="project.id"
          class="card transition-shadow duration-200 shadow hover:shadow-md shadow-primary/20"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-ink">
              {{ project.title }}
            </h3>
            <div class="flex">
              <button
                @click="openEditProjectModal(project)"
                class="text-ink-muted hover:text-ink p-1"
              >
                <PencilSquareIcon class="h-5 w-5" />
              </button>
              <button
                @click="confirmDeleteProject(project)"
                class="text-ink-muted hover:text-red-500 p-1"
              >
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
          <p class="text-ink mb-4 line-clamp-2">
            {{ project.description || "无描述" }}
          </p>
          <div class="flex justify-between items-center mt-4">
            <span class="text-sm text-ink-muted">
              {{ formatDate(project.updateAt) }}
            </span>
            <router-link
              :to="`/projects/${project.id}`"
              class="btn btn-primary"
            >
              打开
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <ProjectFormModal
      v-if="showCreateModal"
      :title="'创建新项目'"
      :submitText="'创建'"
      :initialData="newProject"
      @close="showCreateModal = false"
      @submit="createProject"
    />

    <!-- Edit Project Modal -->
    <ProjectFormModal
      v-if="showEditModal"
      :title="'编辑项目'"
      :submitText="'保存'"
      :initialData="editingProject"
      @close="showEditModal = false"
      @submit="updateProject"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-if="showDeleteModal"
      :title="'删除项目'"
      :message="`确定要删除项目 (${deletingProject?.title}) 吗？此操作将同时删除该项目下的所有章节，且无法恢复。`"
      :confirmText="'删除'"
      :confirmButtonClass="'btn-danger'"
      @close="showDeleteModal = false"
      @confirm="deleteProject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { useProjectsStore } from "@/stores/projects";
import type { Project } from "@/types";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from "@heroicons/vue/24/outline";
import ProjectFormModal from "@/components/projects/ProjectFormModal.vue";
import ConfirmationModal from "@/components/common/ConfirmationModal.vue";
import { formatDate } from "@/utils/common";

const toast = useToast();
const projectsStore = useProjectsStore();

// Load projects on component mount
onMounted(() => {
  projectsStore.loadProjects();
});

// Project list
const projects = computed(() => projectsStore.projectsSorted);

// Modal states
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);

// Form data
const newProject = ref({
  title: "",
  description: "",
  defaultVoiceSettings: {},
});

const editingProject = ref<Project>();
const deletingProject = ref<Project>();
const fileInput = ref<HTMLInputElement>();

// Modal functions
function openCreateProjectModal() {
  newProject.value = {
    title: "",
    description: "",
    defaultVoiceSettings: {},
  };
  showCreateModal.value = true;
}

function openEditProjectModal(project: Project) {
  editingProject.value = { ...project };
  showEditModal.value = true;
}

function confirmDeleteProject(project: Project) {
  deletingProject.value = project;
  showDeleteModal.value = true;
}

// CRUD operations
async function createProject(projectData: {
  title: string;
  description: string;
  defaultVoiceSettings: any;
}) {
  const project = await projectsStore.createProject(
    projectData.title,
    projectData.description,
    projectData.defaultVoiceSettings
  );

  if (project) {
    toast.success(`项目 "${project.title}" 创建成功！`);
    showCreateModal.value = false;
  } else {
    toast.error("创建项目失败！");
  }
}

async function updateProject(projectData: {
  title: string;
  description: string;
  defaultVoiceSettings: any;
}) {
  if (!editingProject.value) return;

  const result = await projectsStore.updateProject(editingProject.value.id, {
    title: projectData.title,
    description: projectData.description,
    defaultVoiceSettings: projectData.defaultVoiceSettings,
  });

  if (result) {
    toast.success(`项目 "${projectData.title}" 更新成功！`);
    showEditModal.value = false;
  } else {
    toast.error("更新项目失败！");
  }
}

async function deleteProject() {
  if (!deletingProject.value) return;

  const result = await projectsStore.deleteProject(deletingProject.value.id);

  if (result) {
    toast.success(`项目 "${deletingProject.value.title}" 已删除！`);
    showDeleteModal.value = false;
  } else {
    toast.error("删除项目失败！");
  }
}

function importProject() {
  // Trigger file input click
  if (fileInput.value) {
    fileInput.value.click();
  }
}

async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  try {
    // Read the file
    const content = await readFile(file);
    const projectData = JSON.parse(content);

    // Validate the import file structure
    if (
      !projectData.id ||
      !projectData.title ||
      !Array.isArray(projectData.chapters)
    ) {
      throw new Error("无效的项目导入文件格式");
    }

    // Check if project ID already exists
    const existingProject = projectsStore.projects.find(
      (p) => p.id === projectData.id
    );
    if (existingProject) {
      // Ask for confirmation to overwrite or create new
      if (
        !confirm(
          `项目 "${projectData.title}" 已存在，是否更新现有项目？点击"取消"将创建新项目。`
        )
      ) {
        // Create new project with new ID
        await createNewProjectFromImport(projectData);
      } else {
        // Update existing project
        await updateExistingProject(projectData);
      }
    } else {
      // Create project with existing ID
      await createNewProjectFromImport(projectData, false);
    }

    // Reset file input
    input.value = "";
  } catch (error) {
    console.error("导入项目失败:", error);
    toast.error(
      `导入失败: ${error instanceof Error ? error.message : "无效的文件格式"}`
    );
    // Reset file input
    input.value = "";
  }
}

// Function to read file content
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("读取文件失败"));
      }
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsText(file);
  });
}

// Function to create a new project from import data
async function createNewProjectFromImport(
  projectData: any,
  generateNewId: boolean = true
) {
  try {
    // Create new project
    const { title, description, defaultVoiceSettings } = projectData;
    const newProject = await projectsStore.createProject(
      title,
      description || "",
      defaultVoiceSettings || {}
    );

    if (!newProject) {
      throw new Error("创建项目失败");
    }

    // Add chapters
    if (projectData.chapters && projectData.chapters.length > 0) {
      for (const chapterData of projectData.chapters) {
        const chapter = await projectsStore.createChapter(
          newProject.id,
          chapterData.name,
          chapterData.text || "",
          chapterData.settings || {}
        );

        if (!chapter) {
          console.error(`导入章节 "${chapterData.name}" 失败`);
        }
      }
    }

    toast.success(`项目 "${title}" 导入成功`);
  } catch (error) {
    console.error("创建导入项目失败:", error);
    toast.error(
      `导入失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

// Function to update existing project from import data
async function updateExistingProject(projectData: any) {
  try {
    // Update project
    const result = await projectsStore.updateProject(projectData.id, {
      title: projectData.title,
      description: projectData.description || "",
      defaultVoiceSettings: projectData.defaultVoiceSettings || {},
    });

    if (!result) {
      throw new Error("更新项目失败");
    }

    // Delete existing chapters and add new ones
    const existingChapters = projectsStore.chapters.filter(
      (c) => c.projectId === projectData.id
    );
    for (const chapter of existingChapters) {
      await projectsStore.deleteChapter(chapter.id);
    }

    // Add chapters from import
    if (projectData.chapters && projectData.chapters.length > 0) {
      for (const chapterData of projectData.chapters) {
        const chapter = await projectsStore.createChapter(
          projectData.id,
          chapterData.name,
          chapterData.text || "",
          chapterData.settings || {}
        );

        if (!chapter) {
          console.error(`导入章节 "${chapterData.name}" 失败`);
        }
      }
    }

    toast.success(`项目 "${projectData.title}" 更新成功`);
  } catch (error) {
    console.error("更新导入项目失败:", error);
    toast.error(
      `导入失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}
</script>
