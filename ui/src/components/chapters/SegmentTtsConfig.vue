<template>
  <div class="bg-surface-elevated rounded-lg shadow p-4 mb-4">
    <h3 class="text-lg font-semibold text-ink mb-4">
      TTS 配置
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- TTS 服务商 -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-ink"
            >TTS 服务商</span
          >
        </label>
        <select
          v-model="config.provider"
          class="select select-bordered w-full bg-surface-hover text-ink"
        >
          <option
            v-for="provider in ttsProviders"
            :key="provider.type"
            :value="provider.type"
          >
            {{ provider.name }}
          </option>
        </select>
      </div>

      <!-- 语音模型 -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-ink"
            >语音模型</span
          >
        </label>
        <select
          v-model="config.model"
          class="select select-bordered w-full bg-surface-hover text-ink"
        >
          <option
            v-for="model in availableModels"
            :key="model.id"
            :value="model.id"
          >
            {{ model.name }}
          </option>
        </select>
      </div>

      <!-- 语速 -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-ink">语速</span>
          <span class="label-text-alt text-ink-muted">{{ config.speed }}</span>
        </label>
        <input
          v-model="config.speed"
          type="range"
          min="-50"
          max="50"
          class="range range-sm"
        />
        <div class="flex justify-between text-xs text-ink-muted px-1">
          <span>慢</span>
          <span>正常</span>
          <span>快</span>
        </div>
      </div>

      <!-- 音调 -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-ink">音调</span>
          <span class="label-text-alt text-ink-muted">{{ config.pitch }}</span>
        </label>
        <input
          v-model="config.pitch"
          type="range"
          min="-50"
          max="50"
          class="range range-sm"
        />
        <div class="flex justify-between text-xs text-ink-muted px-1">
          <span>低</span>
          <span>正常</span>
          <span>高</span>
        </div>
      </div>

      <!-- 音量 -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-ink">音量</span>
          <span class="label-text-alt text-ink-muted">{{ config.volume }}</span>
        </label>
        <input
          v-model="config.volume"
          type="range"
          min="0"
          max="100"
          class="range range-sm"
        />
        <div class="flex justify-between text-xs text-ink-muted px-1">
          <span>小</span>
          <span>中</span>
          <span>大</span>
        </div>
      </div>
    </div>

    <div class="flex justify-end mt-4">
      <button @click="$emit('close')" class="btn btn-sm btn-outline mr-2">
        取消
      </button>
      <button @click="saveConfig" class="btn btn-sm btn-primary">保存</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useSettingsStore } from "@/stores/settings";
import type { SegmentTtsConfig } from "@/types/ReadNovels";

const props = defineProps<{
  initialConfig?: SegmentTtsConfig;
  segmentIndex: number;
}>();

const emit = defineEmits<{
  (e: "update", config: SegmentTtsConfig, index: number): void;
  (e: "close"): void;
}>();

const settingsStore = useSettingsStore();

// 默认配置
const defaultConfig: SegmentTtsConfig = {
  provider: "azure",
  model: "",
  speed: 0,
  pitch: 0,
  volume: 100,
};

// 合并初始配置和默认配置
const config = ref<SegmentTtsConfig>({
  ...defaultConfig,
  ...props.initialConfig,
});

// TTS服务商列表
const ttsProviders = computed(() => settingsStore.getTTSProviders());

// 根据选择的服务商获取可用的语音模型
const availableModels = computed(() => {
  if (!config.value.provider) return [];

  // 这里应该根据服务商类型返回对应的模型列表
  // 简化处理，返回一些示例模型
  return [
    { id: "female-1", name: "女声 1" },
    { id: "female-2", name: "女声 2" },
    { id: "male-1", name: "男声 1" },
    { id: "male-2", name: "男声 2" },
    { id: "narrator-1", name: "旁白 1" },
  ];
});

// 监听服务商变化，重置模型
watch(
  () => config.value.provider,
  () => {
    config.value.model = availableModels.value[0]?.id || "";
  }
);

// 初始化
onMounted(async () => {
  // 加载TTS设置
  await settingsStore.loadTTSSettings();

  // 如果没有设置服务商，使用默认服务商
  if (!config.value.provider) {
    config.value.provider = settingsStore.activeTTSProviderType;
  }

  // 如果没有设置模型，使用第一个可用模型
  if (!config.value.model && availableModels.value.length > 0) {
    config.value.model = availableModels.value[0].id;
  }
});

// 保存配置
function saveConfig() {
  emit("update", config.value, props.segmentIndex);
  emit("close");
}
</script>
