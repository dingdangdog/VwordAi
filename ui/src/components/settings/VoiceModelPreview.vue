<template>
  <div class="voice-model-preview m-2">
    <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <!-- 左侧服务商列表 -->
      <div class="w-full md:w-64 flex-shrink-0">
        <div class="card p-4">
          <h2 class="text-lg font-semibold mb-3 dark:text-gray-200">
            语音服务商
          </h2>
          <ul class="space-y-2">
            <li v-for="provider in providers" :key="provider.id">
              <button
                class="w-full flex items-center px-3 py-2 rounded-md transition-colors text-left"
                :class="
                  selectedProvider === provider.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                "
                @click="selectProvider(provider.id)"
              >
                <MicrophoneIcon
                  class="h-5 w-5 mr-2"
                  :class="
                    selectedProvider === provider.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                />
                <span>{{ provider.name }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 右侧模型列表 -->
      <div class="flex-1">
        <div class="card p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold dark:text-gray-200">
              语音模型 ({{ filteredModels.length }})
            </h2>
            <div class="relative">
              <input
                type="text"
                v-model="searchQuery"
                placeholder="搜索模型..."
                class="px-3 py-2 bg-white dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- 过滤器 -->
          <div class="flex flex-wrap gap-2 mb-4">
            <div class="inline-flex rounded-md shadow-sm">
              <button
                @click="filterGender = ''"
                :class="
                  filterGender === ''
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                "
                class="px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-l-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                全部
              </button>
              <button
                @click="filterGender = '0'"
                :class="
                  filterGender === '0'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                "
                class="px-3 py-1 text-sm font-medium border-t border-b border-r border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                女声
              </button>
              <button
                @click="filterGender = '1'"
                :class="
                  filterGender === '1'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                "
                class="px-3 py-1 text-sm font-medium border-t border-b border-r border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                男声
              </button>
            </div>
          </div>

          <!-- 模型列表 -->
          <div v-if="isLoading" class="flex justify-center py-6">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"
            ></div>
          </div>

          <div
            v-else-if="filteredModels.length === 0"
            class="text-center py-6 text-gray-500 dark:text-gray-400"
          >
            没有找到符合条件的语音模型
          </div>

          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-18rem)] overflow-y-auto"
          >
            <div
              v-for="model in filteredModels"
              :key="model.code"
              class="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div class="p-3">
                <div class="flex justify-between items-center">
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    {{ model.name }}
                  </h3>
                  <span
                    :class="
                      model.gender === '0'
                        ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    "
                    class="px-2 py-0.5 text-xs rounded-full"
                  >
                    {{ model.gender === "0" ? "女声" : "男声" }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {{ model.lang }}
                </p>

                <!-- 情感和角色标签 -->
                <div class="mt-2">
                  <div
                    v-if="model.emotions && model.emotions.length > 0"
                    class="flex flex-wrap gap-1 mt-1"
                  >
                    <span
                      v-for="emotion in model.emotions.slice(0, 3)"
                      :key="emotion.code"
                      class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-0.5 rounded"
                    >
                      {{ emotion.name }}
                    </span>
                    <span
                      v-if="model.emotions.length > 3"
                      class="text-xs text-gray-500 dark:text-gray-400"
                    >
                      +{{ model.emotions.length - 3 }}
                    </span>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="mt-3 flex justify-between items-center">
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ model.code }}
                  </div>
                  <button
                    @click="playTest(model)"
                    :disabled="isTestingModel[model.code]"
                    class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50"
                  >
                    <span v-if="isTestingModel[model.code]">测试中...</span>
                    <span v-else>试听</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { MicrophoneIcon } from "@heroicons/vue/24/outline";
import { useToast } from "vue-toastification";
import { getTTSProviders } from "@/utils/voice-utils";
import { getProcessedVoiceModels } from "@/utils/voice-utils";
import type { VoiceModel } from "@/types";
import type { ServiceProviderType } from "@/types";
import { useSettingsStore } from "@/stores/settings";

const toast = useToast();
const isLoading = ref(false);
const selectedProvider = ref("");
const searchQuery = ref("");
const filterGender = ref("");
const providers = computed(() => getTTSProviders());
const voiceModels = ref<VoiceModel[]>([]);
const isTestingModel = ref<Record<string, boolean>>({});

// 根据选择的提供商和过滤条件过滤模型
const filteredModels = computed(() => {
  if (!selectedProvider.value) return [];

  return voiceModels.value.filter((model) => {
    // 按提供商过滤
    if (model.provider !== selectedProvider.value) return false;

    // 按性别过滤
    if (filterGender.value && model.gender !== filterGender.value) return false;

    // 按搜索词过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      return (
        model.name.toLowerCase().includes(query) ||
        model.code.toLowerCase().includes(query) ||
        model.lang.toLowerCase().includes(query)
      );
    }

    return true;
  });
});

// 初始化
onMounted(() => {
  loadVoiceModels();

  // 默认选择第一个提供商
  if (providers.value.length > 0) {
    selectedProvider.value = providers.value[0].id;
  }
});

// 加载语音模型
async function loadVoiceModels() {
  isLoading.value = true;
  try {
    voiceModels.value = getProcessedVoiceModels();
  } catch (error) {
    console.error("Failed to load voice models:", error);
    toast.error("加载语音模型失败");
  } finally {
    isLoading.value = false;
  }
}

// 选择提供商
function selectProvider(providerId: string) {
  selectedProvider.value = providerId;
}

// 试听功能
async function playTest(model: VoiceModel) {
  isTestingModel.value[model.code] = true;

  try {
    // 构建测试文本 - 使用模型名称作为测试文本
    const testText = `这是${model.name}的语音示例，谢谢您的聆听。`;

    // 使用 Settings Store 的测试连接功能
    const settingsStore = useSettingsStore();
    const result = await settingsStore.testServiceProviderConnection(
      model.provider as ServiceProviderType
    );

    if (result.success && result.data?.audioData) {
      // 创建音频元素并播放
      const audioBlob = new Blob(
        [new Uint8Array(result.data.audioData).buffer],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.play();

      toast.success(`${model.name} 语音模型试听成功`);
    } else {
      toast.error(`试听失败: ${result.message || "未能获取音频数据"}`);
    }
  } catch (error) {
    console.error("Test play error:", error);
    toast.error(
      `试听失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  } finally {
    isTestingModel.value[model.code] = false;
  }
}
</script>
