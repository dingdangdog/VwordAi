<script setup lang="ts">
import { onMounted, ref } from "vue";
import { request, requestByToken } from "@/utils/request";
import type { PageParam } from "@/utils/model";
import {
  alertError,
  alertSuccess,
  formatDate,
  getProjectStatusText,
  selectFloder,
} from "@/utils/common";
import {
  openProjectFlag,
  saveProjectFlag,
  GlobalEditProject,
  GlobalConfig,
  GlobalUserLogin,
} from "@/utils/global.store";
import type { Project } from "@/utils/cloud";
import LoginForm from "@/components/form/LoginForm.vue";
import DottsEditor from "@/components/DottsEditor.vue";

onMounted(() => {
  taggleTable("local");
});

// 新建项目
const addProject = () => {
  GlobalEditProject.value = {
    layout: { provider: "azure" },
  };
  GlobalEditProject.value.create_by = Date.now();
  GlobalEditProject.value.content = "";
  GlobalEditProject.value.update_by = Date.now();
  GlobalEditProject.value.voices = [];
  // 初始化创建项目所在目录，并保存基本数据
  request("saveProject", GlobalEditProject.value)
    .then((res) => {
      GlobalEditProject.value = res;
      alertSuccess("创建成功");
      saveProjectFlag.value = true;
      // TODO 初始化项目
      // initEditor("");
      openProjectFlag.value = true;
    })
    .catch((err) => {
      alertError("创建失败");
    });
};

// 打开项目
const openProject = () => {
  selectFloder().then((path) => {
    if (path) {
      request("getProject", path).then((res) => {
        alertSuccess("打开成功");
        GlobalEditProject.value = res;
        GlobalEditProject.value.path = path;
        if (!GlobalEditProject.value.layout) {
          GlobalEditProject.value.layout = { provider: "azure" };
        }
        openProjectFlag.value = true;
      });
    }
  });
};

const pageQuery = ref<PageParam>({ pageSize: 5, pageNum: 1 });
const query = ref<Project>({});
const tabledata = ref<{ total?: number; data?: Project[] }>({});
const loading = ref(false);
const headers = ref([
  { title: "项目名", key: "name" },
  {
    title: "创建时间",
    key: "create_by",
    value: (p: Project) => {
      return formatDate(new Date(Number(p.create_by)));
    },
  },
  {
    title: "更新时间",
    key: "update_by",
    value: (p: Project) => {
      return formatDate(new Date(Number(p.update_by)));
    },
  },
  {
    title: "作品状态",
    key: "status",
    value: (p: Project) => {
      return getProjectStatusText(p.status || "");
    },
  },
  { title: "操作", key: "actions", sortable: false },
]);

const localProjects = ref<Project[]>([]);
const getLocalProjects = () => {
  loading.value = true;
  request("getLocalProjects")
    .then((res) => {
      console.log(res);
      localProjects.value = res;
    })
    .finally(() => {
      loading.value = false;
    });
};

const getProjectPages = () => {
  loading.value = true;
  requestByToken("userProject", pageQuery.value, query.value)
    .then((res) => {
      tabledata.value = res;
    })
    .finally(() => {
      loading.value = false;
    });
};

const changePage = (param: {
  page: number;
  itemsPerPage: number;
  sortBy: any;
}) => {
  pageQuery.value.pageNum = param.page;
  pageQuery.value.pageSize = param.itemsPerPage;
  getProjectPages();
};

const dottsConfirmDialog = ref(false);
const doItem = ref<Project>({});
const toDotts = (item: Project) => {
  requestByToken("getProjectDetail", item.id).then((res) => {
    doItem.value = res;
    dottsConfirmDialog.value = true;
  });
};
const startDotts = () => {
  requestByToken("cloudDotts", doItem.value.id).then((res) => {
    dottsConfirmDialog.value = false;
    alertSuccess("任务已提交");
    getProjectPages();
  });
};
const cancelDotts = () => {
  doItem.value = {};
  dottsConfirmDialog.value = false;
};
// 去编辑项目
const toEditProject = (item: Project) => {
  requestByToken("getProjectDetail", item.id).then((res) => {
    console.log(res);
    GlobalEditProject.value = res;
    openProjectFlag.value = true;
    // initEditor(project.value.content || "");
  });
};

// 粗略计算项目消费
const countWords = (item: Project) => {
  if (item?.voices && item.voices.length > 0) {
    let total = 0;
    item.voices.forEach((v) => {
      total += v?.text?.length || 0;
    });
    total = total / 0.8;
    return Math.ceil(total);
  }
  return 0;
};

// 下载项目的处理结果音频文件到本地
const downloadAudio = (item: Project) => {
  item.downloading = true;
  requestByToken("downloadAudio", item.id)
    .then((res) => {
      // console.log(res);
      alertSuccess("下载成功");
    })
    .finally(() => {
      item.downloading = false;
    });
};
// 打开项目的本地文件夹
const openCloudProjectFolder = (item: Project) => {
  requestByToken("pullProject", item.id).then((res) => {
    const projectPath = `${GlobalConfig.value.dataPath}/${item.id}`;
    // @ts-ignore
    window.electron
      .openFolder(projectPath)
      .then(() => {})
      .catch((res: any) => {
        console.log(res);
      });
  });
};

const deleteConfirmDialog = ref(false);
const deleteItem = ref<Project>({});
const toDelete = (item: Project) => {
  deleteItem.value = item;
  deleteConfirmDialog.value = true;
};
const cancelDelete = () => {
  deleteItem.value = {};
  deleteConfirmDialog.value = false;
};
const deleteProject = () => {
  if (!deleteItem.value.id) {
    return;
  }
  requestByToken("deleteProject", deleteItem.value.id).then((res) => {
    deleteConfirmDialog.value = false;
    alertSuccess("删除成功");
    getProjectPages();
  });
};

// local cloud
const tableFlag = ref("local");
const taggleTable = (flag: string) => {
  tableFlag.value = flag;
  if (flag == "local") {
    getLocalProjects();
  } else {
    getProjectPages();
  }
};

const deleteLocalProject = (item: Project) => {
  request("deleteLocalProject", item).then((res) => {});
};

const editLocalProject = (item: Project) => {};
</script>

<template>
  <div
    class="h-full w-full flex flex-col justify-center items-center px-2"
    v-show="!openProjectFlag"
  >
    <div class="flex w-full items-center py-2 border-b">
      <button
        class="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
        @click="addProject()"
      >
        新建项目
      </button>
      <button
        class="px-4 py-2 ml-4 rounded-md bg-gray-700 hover:bg-gray-600"
        @click="openProject()"
      >
        打开项目
      </button>
    </div>
    <div
      v-if="!GlobalUserLogin"
      class="flex-1 flex justify-center items-center"
    >
      <LoginForm class="w-96" />
    </div>
    <div class="w-full flex-1 pt-2">
      <div class="text-base font-bold text-center py-2">
        <span
          class="px-4 py-2 border-t border-x border-gray-600 rounded-t-md cursor-pointer hover:bg-gray-700"
          :class="tableFlag == 'local' ? 'bg-gray-800' : 'bg-gray-900'"
          @click="taggleTable('local')"
          >本地项目</span
        >
        <span
          class="px-4 py-2 border-t border-x border-gray-600 rounded-t-md cursor-pointer hover:bg-gray-700"
          :class="tableFlag == 'cloud' ? 'bg-gray-800' : 'bg-gray-900'"
          v-if="GlobalUserLogin"
          @click="taggleTable('cloud')"
          >云端项目</span
        >
      </div>
      <div
        class="border bg-gray-800 border-gray-200 rounded-md p-2"
        v-show="tableFlag === 'local'"
      >
        <div class="flex items-center justify-center">
          <div class="w-80">
            <v-text-field
              clearable
              label="作品名称"
              v-model="query.name"
              variant="outlined"
              hide-details="auto"
              append-inner-icon="mdi-magnify"
              @click:append-inner="getLocalProjects"
              @keyup.enter="getLocalProjects"
            ></v-text-field>
          </div>
        </div>
        <v-data-table
          class="bg-transparent h-[calc(100vh-15rem)]"
          noDataText="暂无数据"
          :headers="headers"
          :items="localProjects"
          :loading="loading"
          @update:options="getLocalProjects"
        >
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template v-slot:item.actions="{ item }">
            <v-icon
              size="small"
              class="mx-1 hover:text-orange-400"
              @click="toEditProject(item)"
              title="编辑项目"
            >
              mdi-pencil
            </v-icon>
            <v-icon
              size="small"
              class="mx-1 hover:text-orange-400"
              @click="toDotts(item)"
              :disabled="item.status != '0'"
              title="开始处理"
            >
              mdi-play-circle
            </v-icon>
            <v-icon
              size="small"
              class="mx-1 hover:text-orange-400"
              @click="openCloudProjectFolder(item)"
              title="打开项目文件夹"
            >
              mdi-folder-open
            </v-icon>
            <v-icon
              size="small"
              class="mx-1 hover:text-red-500"
              @click="toDelete(item)"
              title="删除"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
      </div>
      <div
        class="border bg-gray-800 border-gray-200 rounded-md p-2"
        v-show="tableFlag === 'cloud'"
      >
        <div class="flex items-center justify-center">
          <div class="w-80">
            <v-text-field
              clearable
              label="作品名称"
              v-model="query.name"
              variant="outlined"
              hide-details="auto"
              append-inner-icon="mdi-magnify"
              @click:append-inner="getProjectPages"
              @keyup.enter="getProjectPages"
            ></v-text-field>
          </div>
        </div>
        <v-data-table-server
          class="bg-transparent h-[calc(100vh-15rem)]"
          noDataText="暂无数据"
          :items-per-page="pageQuery.pageSize"
          :items="tabledata?.data"
          :itemsLength="tabledata?.total || 0"
          :headers="headers"
          :loading="loading"
          @update:options="changePage"
        >
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template v-slot:item.actions="{ item }">
            <v-icon
              size="small"
              class="mx-1 hover:text-orange-400"
              @click="toEditProject(item)"
              title="编辑项目"
            >
              mdi-pencil
            </v-icon>
            <v-icon
              size="small"
              class="mx-1 hover:text-orange-400"
              @click="toDotts(item)"
              :disabled="item.status != '0'"
              title="开始处理"
            >
              mdi-play-circle
            </v-icon>
            <v-icon
              size="small"
              class="mx-1 hover:text-orange-400"
              @click="downloadAudio(item)"
              :disabled="item.status != '2' || item.downloading"
              title="下载音频"
            >
              mdi-music-box
            </v-icon>
            <!-- <v-icon
          size="small"
          class="mx-1 hover:text-orange-400"
          @click="pullProject(item)"
          title="下载项目"
          >
            mdi-cloud-download
          </v-icon> -->
            <v-icon
              size="small"
              class="mx-1 hover:text-orange-400"
              @click="openCloudProjectFolder(item)"
              title="打开项目文件夹"
            >
              mdi-folder-open
            </v-icon>
            <v-icon
              size="small"
              class="mx-1 hover:text-red-500"
              @click="toDelete(item)"
              title="删除"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table-server>
      </div>
      <v-dialog v-model="deleteConfirmDialog" width="auto">
        <v-card>
          <v-card-title class="text-h5">
            确定删除项目 【{{ deleteItem?.name }}】吗?
          </v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-darken-1" variant="text" @click="cancelDelete"
              >取消</v-btn
            >
            <v-btn color="blue-darken-1" variant="text" @click="deleteProject"
              >确定</v-btn
            >
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="dottsConfirmDialog" width="auto">
        <v-card>
          <v-card-title class="text-h5">
            处理 【{{ doItem?.name }}】，预计消耗{{
              countWords(doItem)
            }}文，确定开始处理吗?
          </v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-darken-1" variant="text" @click="cancelDotts"
              >取消</v-btn
            >
            <v-btn color="blue-darken-1" variant="text" @click="startDotts"
              >确定</v-btn
            >
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
  <div class="flex-1 h-full" v-if="openProjectFlag">
    <DottsEditor @close="getProjectPages" />
  </div>
</template>

<style scoped></style>
