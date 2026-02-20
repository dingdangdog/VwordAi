<template>
  <div class="voice-service-settings m-2">
    <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
      <!-- 左侧服务商列表 -->
      <div class="w-full md:w-64 flex-shrink-0">
        <div class="card p-4">
          <ul class="space-y-2">
            <li v-for="provider in providers" :key="provider.id">
              <button class="w-full flex items-center px-3 py-2 rounded-md transition-colors text-left" :class="selectedProviderType === provider.type
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                " @click="selectProvider(provider.type)">
                <CloudIcon class="h-5 w-5 mr-2" :class="selectedProviderType === provider.type
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                  " />
                <span>{{ provider.name }}</span>
                <span class="ml-auto">
                  <span v-if="provider.status === 'success'"
                    class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                  <span v-else-if="provider.status === 'failure'"
                    class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                  <span v-else-if="provider.status === 'untested'"
                    class="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                  <span v-else class="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 inline-block"></span>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 右侧：Tab 切换 -->
      <div class="flex-1">
        <div class="card p-4 md:p-6">
          <!-- 子 Tab -->
          <div class="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav class="flex -mb-px">
              <button v-for="t in subTabs" :key="t.id" @click="subTab = t.id"
                class="py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors" :class="subTab === t.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ">
                <component :is="t.icon" class="h-4 w-4 inline-block mr-1.5" />
                {{ t.name }}
              </button>
            </nav>
          </div>

          <!-- TTS 配置 -->
          <div v-show="subTab === 'config'" class="sub-panel">
            <AzureTTSProviderForm v-if="selectedProviderType === 'azure'" :provider="providerData"
              @update="updateProviderField" @save="saveCurrentProvider" @test="testCurrentProvider" />
            <AliyunTTSProviderForm v-else-if="selectedProviderType === 'aliyun'" :provider="providerData"
              @update="updateProviderField" @save="saveCurrentProvider" @test="testCurrentProvider" />
            <TencentTTSProviderForm v-else-if="selectedProviderType === 'tencent'" :provider="providerData"
              @update="updateProviderField" @save="saveCurrentProvider" @test="testCurrentProvider" />
            <OpenaiTTSProviderForm v-else-if="selectedProviderType === 'openai'" :provider="providerData"
              @update="updateProviderField" @save="saveCurrentProvider" @test="testCurrentProvider" />
            <div v-else class="flex flex-col items-center justify-center text-center py-12">
              <ServerIcon class="h-16 w-16 text-gray-400 mb-4" />
              <p class="text-lg text-gray-700 dark:text-gray-300">
                请从左侧选择一个服务商进行配置
              </p>
            </div>
          </div>

          <!-- 语音模型 -->
          <div v-show="subTab === 'models'" class="sub-panel">
            <div v-if="!selectedProviderType" class="text-center py-12 text-gray-500">
              请从左侧选择一个服务商查看语音模型
            </div>
            <template v-else>
              <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h2 class="text-lg font-semibold dark:text-gray-200">
                  语音模型 ({{ filteredModels.length }})
                </h2>
                <div class="relative">
                  <input type="text" v-model="searchQuery" placeholder="搜索模型..."
                    class="px-3 py-2 bg-white dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div class="flex flex-wrap gap-2 mb-4">
                <div class="inline-flex rounded-md shadow-sm">
                  <button @click="filterGender = ''" :class="filterGender === ''
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    "
                    class="px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-l-md hover:bg-gray-50 dark:hover:bg-gray-600">
                    全部
                  </button>
                  <button @click="filterGender = '0'" :class="filterGender === '0'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    "
                    class="px-3 py-1 text-sm font-medium border-t border-b border-r border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                    女声
                  </button>
                  <button @click="filterGender = '1'" :class="filterGender === '1'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    "
                    class="px-3 py-1 text-sm font-medium border-t border-b border-r border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-50 dark:hover:bg-gray-600">
                    男声
                  </button>
                </div>
              </div>
              <div v-if="isLoadingModels" class="flex justify-center py-6">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
              <div v-else-if="filteredModels.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
                没有找到符合条件的语音模型
              </div>
              <div v-else
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-18rem)] overflow-y-auto">
                <div v-for="model in filteredModels" :key="model.code"
                  class="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div class="p-3">
                    <div class="flex justify-between items-center">
                      <h3 class="font-semibold text-gray-900 dark:text-white">
                        {{ model.name }}
                      </h3>
                      <span :class="model.gender === '0'
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        " class="px-2 py-0.5 text-xs rounded-full">
                        {{ model.gender === "0" ? "女声" : "男声" }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {{ model.lang }}
                    </p>
                    <div class="mt-3 flex justify-between items-center">
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ model.code }}
                      </div>
                      <button @click="playTest(model)" :disabled="isTestingModel[model.code]"
                        class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50">
                        <span v-if="isTestingModel[model.code]">测试中...</span>
                        <span v-else>试听</span>
                      </button>
                    </div>
                    <div v-if="model.emotions && model.emotions.length > 0" class="flex flex-wrap gap-1 mt-1">
                      <span v-for="emotion in model.emotions.slice(0, 3)" :key="emotion.code"
                        class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-0.5 rounded">
                        {{ emotion.name }}
                      </span>
                      <span v-if="model.emotions.length > 3" class="text-xs text-gray-500 dark:text-gray-400">
                        +{{ model.emotions.length - 3 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import { SUPPORTED_TTS_PROVIDERS, useSettingsStore } from "@/stores/settings";
import { ServerIcon, CloudIcon, MicrophoneIcon, SpeakerWaveIcon } from "@heroicons/vue/24/outline";
import type { TTSProviderType, ServiceProviderStatus } from "@/types";
import type { VoiceModel } from "@/types";
import AliyunTTSProviderForm from "./tts/AliyunProviderForm.vue";
import AzureTTSProviderForm from "./tts/AzureProviderForm.vue";
import OpenaiTTSProviderForm from "./tts/OpenaiProviderForm.vue";
import TencentTTSProviderForm from "./tts/TencentProviderForm.vue";
import { getProcessedVoiceModels } from "@/utils/voice-utils";

const subTabs = [
  { id: "config" as const, name: "TTS 配置", icon: MicrophoneIcon },
  { id: "models" as const, name: "语音模型", icon: SpeakerWaveIcon },
];

const subTab = ref<"config" | "models">("config");
const selectedProviderType = ref<TTSProviderType | null>(null);
const providerData = ref<any>({});
const toast = useToast();
const settingsStore = useSettingsStore();
const isLoading = ref(false);

const searchQuery = ref("");
const filterGender = ref("");
const voiceModels = ref<VoiceModel[]>([]);
const isLoadingModels = ref(false);
const isTestingModel = ref<Record<string, boolean>>({});

const providers = computed(() => {
  return SUPPORTED_TTS_PROVIDERS.map((provider) => {
    const status = settingsStore.getTTSProviderStatus(provider.type);
    return { ...provider, status };
  });
});

const filteredModels = computed(() => {
  if (!selectedProviderType.value) return [];
  return voiceModels.value.filter((model) => {
    if (model.provider !== selectedProviderType.value) return false;
    if (filterGender.value && model.gender !== filterGender.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      return (
        model.name.toLowerCase().includes(q) ||
        model.code.toLowerCase().includes(q) ||
        model.lang.toLowerCase().includes(q)
      );
    }
    return true;
  });
});

onMounted(async () => {
  if (!settingsStore.ttsSettings) {
    await settingsStore.loadTTSSettings();
  }
  if (SUPPORTED_TTS_PROVIDERS.length > 0) {
    selectProvider(SUPPORTED_TTS_PROVIDERS[0].type);
  }
  loadVoiceModels();
});

async function loadVoiceModels() {
  isLoadingModels.value = true;
  try {
    voiceModels.value = getProcessedVoiceModels();
  } catch (e) {
    console.error("Failed to load voice models:", e);
    toast.error("加载语音模型失败");
  } finally {
    isLoadingModels.value = false;
  }
}

function selectProvider(type: TTSProviderType) {
  selectedProviderType.value = type;
  const config = settingsStore.getTTSProviderConfig(type);
  providerData.value = config ? { ...config } : { status: "unconfigured" as ServiceProviderStatus };
}

function updateProviderField(field: string, value: any) {
  providerData.value[field] = value;
}

async function saveCurrentProvider(data?: Record<string, any>) {
  if (!selectedProviderType.value) {
    toast.warning("请先选择一个服务商");
    return;
  }
  isLoading.value = true;
  try {
    const type = selectedProviderType.value;
    const providerConfig = data || { ...providerData.value };
    const success = await settingsStore.updateTTSProvider(type, providerConfig);
    if (success) {
      await settingsStore.loadTTSSettings();
      const updatedConfig = settingsStore.getTTSProviderConfig(type);
      providerData.value = updatedConfig ? { ...updatedConfig } : providerData.value;
      toast.success("服务商配置保存成功");
      if (settingsStore.isTTSProviderConfiguredButUntested(type)) {
        toast.info("建议您测试配置以确保能正常工作");
      }
    } else {
      toast.error("保存失败: 未知错误");
    }
  } catch (error) {
    console.error("Save provider config error:", error);
    toast.error(`保存失败: ${error instanceof Error ? error.message : "未知错误"}`);
  } finally {
    isLoading.value = false;
  }
}

async function testCurrentProvider(providerConfig: Record<string, any> | null = null) {
  if (!selectedProviderType.value) {
    toast.warning("请先选择一个服务商");
    return;
  }
  const configToTest = providerConfig || providerData.value;
  if (!configToTest) {
    toast.warning("请先完成配置");
    return;
  }
  isLoading.value = true;
  try {
    if (providerConfig) await saveCurrentProvider(providerConfig);
    const result = await settingsStore.testTTSProviderConnection(
      selectedProviderType.value,
      configToTest
    );
    if (result.success) {
      toast.success("连接测试成功");
      await settingsStore.loadTTSSettings();
      const updatedConfig = settingsStore.getTTSProviderConfig(selectedProviderType.value);
      if (updatedConfig) providerData.value = { ...updatedConfig };
      if (result?.data?.audioData) {
        const audioBlob = new Blob(
          [new Uint8Array(result.data.audioData).buffer],
          { type: "audio/wav" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        audio.play();
      }
    } else {
      toast.error(result?.message || "连接测试失败");
      await settingsStore.loadTTSSettings();
      const updatedConfig = settingsStore.getTTSProviderConfig(selectedProviderType.value);
      if (updatedConfig) providerData.value = { ...updatedConfig };
    }
  } catch (error) {
    console.error("Test provider connection error:", error);
    toast.error(`测试失败: ${error instanceof Error ? error.message : "未知错误"}`);
    await settingsStore.loadTTSSettings();
  } finally {
    isLoading.value = false;
  }
}

async function playTest(model: VoiceModel) {
  isTestingModel.value[model.code] = true;
  try {
    const testText = `你好，我是${model.name}。`;
    const result = await settingsStore.testTTSProviderConnection(
      model.provider as TTSProviderType,
      { text: testText, model: model.code }
    );
    if (result.success && result.data?.audioData) {
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
      toast.error(`试听失败: ${result?.message || "未能获取音频数据"}`);
    }
  } catch (error) {
    console.error("Test play error:", error);
    toast.error(`试听失败: ${error instanceof Error ? error.message : "未知错误"}`);
  } finally {
    isTestingModel.value[model.code] = false;
  }
}
</script>

<style scoped>
.sub-panel {
  min-height: 200px;
}
</style>
