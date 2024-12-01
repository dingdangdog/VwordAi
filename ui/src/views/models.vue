<script setup lang="ts">
import { ref } from "vue";
import request from "@/utils/request";
import type { VoiceModel } from "@/utils/model";
import CollectModelCard from "@/components/card/CollectModelCard.vue";
import StoreModelCard from "@/components/card/StoreModelCard.vue";
import { ModelCategoryItems } from "@/utils/global.store";

const modelCategory = ref("");
const models = ref<VoiceModel[]>();
const showModels = ref<VoiceModel[]>();
const getModels = (provider: string) => {
  modelCategory.value = provider;
  request("getModels", provider).then((res) => {
    console.log(res);
    models.value = res;
    showModels.value = models.value;
  });
};

getModels("collect");

const filterModelParam = ref("");
const filterModel = () => {
  if (!filterModelParam.value) {
    showModels.value = models.value;
    return;
  }
  const filterParam = filterModelParam.value.toLowerCase(); // 转换为小写
  showModels.value = models.value?.filter(
    (model) =>
      model.name.toLowerCase().includes(filterParam) ||
      model.code.toLowerCase().includes(filterParam) ||
      model.gender.toLowerCase().includes(filterParam) ||
      model.lang.toLowerCase().includes(filterParam)
  );
};
</script>

<template>
  <div class="h-full flex justify-between">
    <div class="w-40 h-full bg-black/20 flex flex-col">
      <a
        v-for="item in ModelCategoryItems"
        :key="item.code"
        class="p-2 hover:bg-gray-700 cursor-pointer duration-300"
        :class="modelCategory == item.code ? 'bg-gray-800' : ''"
        @click="getModels(item.code)"
      >
        {{ item.name }}
      </a>
    </div>
    <div class="flex-1 p-2 h-full w-full flex flex-col justify-between">
      <div class="w-full">
        <input
          class="w-52 h-8 bg-transparent border border-gray-400 p-2 rounded-md focus:outline-none"
          placeholder="筛选"
          v-model="filterModelParam"
          @keyup.enter="filterModel()"
        />
      </div>
      <div class="flex-1 w-full overflow-y-auto">
        <h1 class="text-center" v-show="models?.length == 0">暂无数据</h1>
        <div class="bg-gray-800 rounded-md" v-show="modelCategory != 'collect'">
          <div class="flex flex-wrap w-full">
            <StoreModelCard v-for="m in showModels" :key="m.code" :model="m" />
          </div>
        </div>
        <div class="bg-gray-800 rounded-md" v-show="modelCategory == 'collect'">
          <div class="flex flex-wrap w-full">
            <CollectModelCard
              v-for="m in showModels"
              :key="m.code"
              :model="m"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
