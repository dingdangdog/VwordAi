<script setup lang="ts">
import type { Project } from "@/utils/cloud";
import { formatDate, getProjectStatusText } from "@/utils/common";
import request from "@/utils/request";
import type { PageParam } from "@/utils/model";
import { ref } from "vue";

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
  { title: "Actions", key: "actions", sortable: false },
]);

const getPages = () => {
  loading.value = true;
  request("userProject", pageQuery.value, query.value).then((res) => {
    tabledata.value = res;
    loading.value = false;
  });
};

const downloadProject = (item: Project) => {};

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
      noDataText="暂无数据"
      :items-per-page="pageQuery.pageSize"
      :items="tabledata?.data"
      :itemsLength="tabledata?.total || 0"
      :headers="headers"
      :loading="loading"
      @update:options="changePage"
      height="70vh"
    >
      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.actions="{ item }">
        <v-icon
          size="small"
          class="me-2"
          @click="downloadProject(item)"
          :disabled="item.status == '2'"
        >
          mdi-information
        </v-icon>
      </template>
    </v-data-table-server>
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
