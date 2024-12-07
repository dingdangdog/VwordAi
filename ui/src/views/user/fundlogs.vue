<script setup lang="ts">
import type { FundLog, Order } from "@/utils/cloud";
import { formatDate } from "@/utils/common";
import { requestByToken } from "@/utils/request";
import type { PageParam } from "@/utils/model";
import { ref } from "vue";

const pageQuery = ref<PageParam>({ pageSize: 15, pageNum: 1 });
const query = ref<FundLog>({});
const tabledata = ref<{ total?: number; data?: Order[] }>({});
const loading = ref(false);
const headers = ref([
  { title: "交易类型", key: "type" },
  { title: "交易额", key: "num" },
  {
    title: "交易时间",
    key: "time",
    value: (log: FundLog) => {
      return formatDate(new Date(Number(log.time)));
    },
  },
  // { title: "Actions", key: "actions", sortable: false },
]);

const getPages = () => {
  loading.value = true;
  requestByToken("userFundlogs", pageQuery.value, query.value).then((res) => {
    tabledata.value = res;
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
  getPages();
};
</script>

<template>
  <div class="p-2">
    <!-- <div class="flex items-center py-2">
      <div class="w-80">
        <v-text-field
          clearable
          label="订单号"
          v-model="query.no"
          variant="outlined"
          hide-details="auto"
        ></v-text-field>
      </div>
      <v-btn variant="tonal" class="ml-2" @click="getPages"> 查询 </v-btn>
    </div> -->
    <v-data-table-server
      class="bg-transparent h-[calc(100vh-5rem)]"
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
        <!-- <v-icon size="small" class="me-2" @click="editItemProperty(item)">
          mdi-information
        </v-icon> -->
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
