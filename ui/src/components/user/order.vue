<script setup lang="ts">
// 需要登录
definePageMeta({
  layout: "user",
  middleware: ["auth"],
});

const getOrdersPage = (
  page: PageParam,
  param: Order
): Promise<{ total: number; data: Order[] }> => {
  return doApi.post(`api/order/page`, { ...page, ...param });
};

const pageQuery = ref<PageParam>({ pageSize: 15, pageNum: 1 });
const query = ref<Order>({});
const tabledata = ref<{ total?: number; data?: Order[] }>({});
const loading = ref(false);
const headers = ref([
  { title: "订单号", key: "no" },
  { title: "金额(￥)", key: "price" },
  { title: "椟", key: "words" },
  {
    title: "创建时间",
    key: "create_by",
    value: (order: Order) => {
      return formatDate(new Date(Number(order.create_by)));
    },
  },
  {
    title: "订单状态",
    key: "status",
    value: (order: Order) => {
      return getOrderStatusText(order.status || "");
    },
  },
  { title: "支付时间", key: "pay_time" },
  // { title: "Actions", key: "actions", sortable: false },
]);

const getPages = () => {
  loading.value = true;
  getOrdersPage(pageQuery.value, query.value).then((res) => {
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
        ></v-text-field>
      </div>
      <v-btn variant="tonal" class="ml-2" @click="getPages"> 查询 </v-btn>
    </div>
    <v-data-table-server
      noDataText="noDataText"
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
