<template>
  <div>
    <div v-if="projects.length === 0" class="card text-center py-12">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        暂无项目
      </h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
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
      <button
        @click="openCreateProjectModal"
        class="btn btn-primary mb-4 flex items-center mx-auto"
      >
        <PlusIcon class="h-5 w-5 mr-2" />
        新建项目
      </button>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projects"
          :key="project.id"
          class="card hover:shadow-lg transition-shadow duration-200"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ project.title }}
            </h3>
            <div class="flex">
              <button
                @click="openEditProjectModal(project)"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
              >
                <PencilSquareIcon class="h-5 w-5" />
              </button>
              <button
                @click="confirmDeleteProject(project)"
                class="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 p-1"
              >
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
          <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {{ project.description || "无描述" }}
          </p>
          <div class="flex justify-between items-center mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(project.updateTime) }}
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
  defaultSettings: {},
});

const editingProject = ref<Project>();
const deletingProject = ref<Project>();

// Modal functions
function openCreateProjectModal() {
  newProject.value = {
    title: "",
    description: "",
    defaultSettings: {},
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
  defaultSettings: any;
}) {
  const project = await projectsStore.createProject(
    projectData.title,
    projectData.description,
    projectData.defaultSettings
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
  defaultSettings: any;
}) {
  if (!editingProject.value) return;

  const result = await projectsStore.updateProject(editingProject.value.id, {
    title: projectData.title,
    description: projectData.description,
    defaultVoiceSettings: projectData.defaultSettings,
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
</script>
