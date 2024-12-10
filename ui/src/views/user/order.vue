<script setup lang="ts">
import type { Order } from "@/utils/cloud";
import { formatDate, getOrderStatusText } from "@/utils/common";
import { requestByToken } from "@/utils/request";
import type { PageParam } from "@/utils/model";
import { ref } from "vue";

const pageQuery = ref<PageParam>({ pageSize: 15, pageNum: 1 });
const query = ref<Order>({});
const tabledata = ref<{ total?: number; data?: Order[] }>({});
const loading = ref(false);
const headers = ref([
  { title: "订单号", key: "no", width: "240", sortable: false },
  { title: "文", key: "words", maxWidth: "120", sortable: false },
  { title: "金额(￥)", key: "price", width: "90", sortable: false },
  {
    title: "订单状态",
    key: "status",
    width: "90",
    value: (order: Order) => {
      return getOrderStatusText(order.status || "");
    },
    sortable: false,
  },
  {
    title: "创建时间",
    key: "create_by",
    width: "240",
    value: (order: Order) => {
      return formatDate(new Date(Number(order.create_by)));
    },
    sortable: false,
  },
  {
    title: "支付时间",
    key: "pay_time",
    width: "240",
    sortable: false,
  },
  { title: "订单备注", key: "desc", width: "240", sortable: false },
  // { title: "Actions", key: "actions", sortable: false },
]);

const getPages = () => {
  loading.value = true;
  requestByToken("userOrder", pageQuery.value, query.value).then((res) => {
    console.log(res);
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
    <div class="flex items-center py-2">
      <div class="w-80">
        <v-text-field
          clearable
          label="订单号"
          v-model="query.no"
          variant="outlined"
          hide-details="auto"
          append-inner-icon="mdi-magnify"
          @click:append-inner="getPages"
          @keyup.enter="getPages"
        ></v-text-field>
      </div>
      <!-- <v-btn variant="tonal" class="ml-2" @click="getPages"> 查询 </v-btn> -->
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
