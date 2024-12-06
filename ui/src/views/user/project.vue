<script setup lang="ts">
import type { Project } from "@/utils/cloud";
import { alertSuccess, formatDate, getProjectStatusText } from "@/utils/common";
import request from "@/utils/request";
import type { PageParam } from "@/utils/model";
import { ref } from "vue";
import {
  activeMenu,
  GlobalConfig,
  openProjectFlag,
  project,
} from "@/utils/global.store";
import router from "@/router";

const pageQuery = ref<PageParam>({ pageSize: 15, pageNum: 1 });
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

const getPages = () => {
  loading.value = true;
  request("userProject", pageQuery.value, query.value).then((res) => {
    tabledata.value = res;
    console.log(res);
    loading.value = false;
  });
};

const dottsConfirmDialog = ref(false);
const doItem = ref<Project>({});
const toDotts = (item: Project) => {
  request("getProjectDetail", item.id).then((res) => {
    doItem.value = res;
    dottsConfirmDialog.value = true;
  });
};
const startDotts = () => {
  request("cloudDotts", doItem.value.id).then((res) => {
    dottsConfirmDialog.value = false;
    alertSuccess("任务已提交");
    getPages();
  });
};
const cancelDotts = () => {
  doItem.value = {};
  dottsConfirmDialog.value = false;
};

// 粗略计算项目消费
const countWords = (item: Project) => {
  if (item?.voices && item.voices.length > 0) {
    let total = 0;
    item.voices.forEach((v) => {
      total += v.text.length;
    });
    total = total / 0.8;
    return Math.ceil(total);
  }
  return 0;
};

const getDetail = (item: Project) => {
  request("getProjectDetail", item.id).then((res) => {
    console.log(res);
  });
};

// 去编辑项目
const toEditProject = (item: Project) => {
  request("getProjectDetail", item.id).then((res) => {
    console.log(res);
    project.value = res;
    openProjectFlag.value = true;
    activeMenu.value = "";
    router.push({ path: "/" });
  });
};

// 将云端项目下载到本地
const pullProject = (item: Project) => {
  request("pullProject", item.id).then((res) => {
    console.log(res);
    alertSuccess("下载成功");
  });
};
// 下载项目的处理结果音频文件到本地
const downloadAudio = (item: Project) => {
  item.downloading = true;
  request("downloadAudio", item.id)
    .then((res) => {
      console.log(res);
      alertSuccess("下载成功");
    })
    .finally(() => {
      item.downloading = false;
    });
};
// 打开项目的本地文件夹
const openProjectFolder = (item: Project) => {
  request("pullProject", item.id).then((res) => {
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
  request("deleteProject", deleteItem.value.id).then((res) => {
    deleteConfirmDialog.value = false;
    alertSuccess("删除成功");
    getPages();
  });
};

const changePage = (param: {
  page: number;
  itemsPerPage: number;
  sortBy: any;
}) => {
  pageQuery.value.pageNum = param.page;
  pageQuery.value.pageSize = param.itemsPerPage;
  getPages();
};
</script>

<template>
  <div class="p-2">
    <div class="flex items-center py-2">
      <div class="w-80">
        <v-text-field
          clearable
          label="作品名称"
          v-model="query.name"
          variant="outlined"
          hide-details="auto"
        ></v-text-field>
      </div>
      <v-btn variant="tonal" class="ml-2" @click="getPages"> 查询 </v-btn>
    </div>
    <v-data-table-server
      class="bg-transparent h-[calc(100vh-9rem)]"
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
        <v-icon
          size="small"
          class="mx-1 hover:text-orange-400"
          @click="pullProject(item)"
          title="下载项目"
        >
          mdi-cloud-download
        </v-icon>
        <v-icon
          size="small"
          class="mx-1 hover:text-orange-400"
          @click="openProjectFolder(item)"
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
</template>

<style scoped>
.field-tag {
  max-width: 40rem;
  margin: 0.2rem;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
