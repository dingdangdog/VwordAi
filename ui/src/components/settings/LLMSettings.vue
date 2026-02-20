<template>
  <div class="llm-setting m-2">
    <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <!-- 左侧：已配置的服务商列表 + 添加 -->
      <div class="w-full md:w-64 flex-shrink-0">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-ink">LLM 服务商</span>
            <button
              type="button"
              class="text-sm text-primary hover:underline"
              @click="startAddNew"
            >
              + 添加
            </button>
          </div>
          <ul class="space-y-2">
            <li v-for="p in providersList" :key="p.id">
              <button
                type="button"
                class="w-full flex items-center px-3 py-2 rounded-md transition-colors text-left"
                :class="
                  selectedId === p.id
                    ? 'bg-primary-muted text-primary'
                    : 'hover:bg-surface-hover text-ink'
                "
                @click="selectProvider(p.id)"
              >
                <CloudIcon
                  class="h-5 w-5 mr-2 flex-shrink-0"
                  :class="
                    selectedId === p.id
                      ? 'text-primary'
                      : 'text-ink-muted'
                  "
                />
                <span class="truncate">{{ p.name || p.id }}</span>
                <span
                  v-if="p.status"
                  class="ml-1 w-2 h-2 rounded-full flex-shrink-0"
                  :class="statusDotClass(p.status)"
                />
              </button>
            </li>
          </ul>
          <p v-if="providersList.length === 0" class="text-sm text-ink-muted mt-2">
            暂无服务商，点击「添加」创建
          </p>
        </div>
      </div>

      <!-- 右侧：编辑/新增表单 -->
      <div class="flex-1">
        <div class="card p-6">
          <LLMProviderForm
            v-if="selectedId !== null || isAddingNew"
            :key="formKey"
            :provider="providerData"
            :is-new="isAddingNew"
            :protocol-options="protocolOptions"
            @save="onSave"
            @delete="onDelete"
          />
          <div
            v-else
            class="flex flex-col items-center justify-center text-center py-12"
          >
            <ServerIcon class="h-16 w-16 text-ink-muted mb-4" />
            <p class="text-lg text-ink">
              请从左侧选择一个服务商，或点击「添加」新建
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { useSettingsStore } from "@/stores/settings";
import { LLM_PROTOCOLS } from "@/stores/settings";
import { ServerIcon, CloudIcon } from "@heroicons/vue/24/outline";
import type { LLMProviderConfig } from "@/types";
import LLMProviderForm from "./llm/LLMProviderForm.vue";

const toast = useToast();
const settingsStore = useSettingsStore();
const selectedId = ref<string | null>(null);
const isAddingNew = ref(false);
const formKey = ref(0);

const protocolOptions = LLM_PROTOCOLS;

const providersList = computed(() => settingsStore.getLLMProviders());

const providerData = computed((): LLMProviderConfig | null => {
  if (isAddingNew.value) return null;
  if (!selectedId.value) return null;
  const c = settingsStore.getLLMProviderConfig(selectedId.value);
  if (!c) return null;
  return { ...c, id: selectedId.value };
});

function statusDotClass(status: string) {
  switch (status) {
    case "success":
      return "bg-green-500";
    case "failure":
      return "bg-red-500";
    case "untested":
      return "bg-yellow-500";
    default:
      return "bg-border";
  }
}

onMounted(async () => {
  await settingsStore.loadLLMSettings();
  const list = settingsStore.getLLMProviders();
  if (list.length > 0 && !selectedId.value) {
    selectProvider(list[0].id);
  }
});

function selectProvider(id: string) {
  selectedId.value = id;
  isAddingNew.value = false;
  formKey.value += 1;
}

function startAddNew() {
  selectedId.value = null;
  isAddingNew.value = true;
  formKey.value += 1;
}

async function onSave(data: Partial<LLMProviderConfig>) {
  const id = data.id || (isAddingNew.value ? "" : selectedId.value);
  if (!id && !isAddingNew.value) {
    toast.warning("请先选择或新建服务商");
    return;
  }

  if (isAddingNew.value) {
    const newId = await settingsStore.addLLMProvider({
      name: data.name!,
      protocol: data.protocol!,
      key: data.key,
      appkey: data.appkey,
      token: data.token,
      endpoint: data.endpoint,
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      topP: data.topP,
    });
    if (newId) {
      toast.success("已添加服务商");
      isAddingNew.value = false;
      selectedId.value = newId;
      await settingsStore.loadLLMSettings();
      formKey.value += 1;
    } else {
      toast.error("添加失败");
    }
    return;
  }

  const ok = await settingsStore.updateLLMProvider(id!, data);
  if (ok) {
    toast.success("配置已保存");
    await settingsStore.loadLLMSettings();
    formKey.value += 1;
  } else {
    toast.error("保存失败");
  }
}

async function onDelete(id: string) {
  const ok = await settingsStore.deleteLLMProvider(id);
  if (ok) {
    toast.success("已删除");
    if (selectedId.value === id) selectedId.value = null;
    await settingsStore.loadLLMSettings();
    const list = settingsStore.getLLMProviders();
    if (list.length > 0 && !selectedId.value) selectProvider(list[0].id);
    formKey.value += 1;
  } else {
    toast.error("删除失败");
  }
}
</script>
