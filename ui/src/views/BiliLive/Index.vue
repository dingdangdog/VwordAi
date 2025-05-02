<template>
  <div class="flex flex-col h-full">
    <!-- 标题区域 -->
    <div class="flex justify-between items-center p-4 border-b">
      <h1 class="text-xl font-bold dark:text-white">Bili 直播弹幕助手</h1>
      <div class="flex items-center space-x-4">
        <span v-if="isConnected" class="text-green-500 flex items-center">
          <span class="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          已连接到房间: {{ currentRoomId }}
        </span>
        <span v-else class="text-gray-500">未连接</span>
        <button
          v-if="!isConnected"
          @click="connectToRoom"
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          连接
        </button>
        <button
          v-else
          @click="disconnect"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          断开
        </button>
      </div>
    </div>

    <!-- 主体内容：消息显示区域和配置区域 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧：消息显示区域 -->
      <div class="w-2/3 flex flex-col overflow-hidden">
        <!-- 房间人气 -->
        <div v-if="isConnected" class="p-2 border-b text-sm">
          <span>人气值: {{ popularity }}</span>
        </div>

        <!-- 选项卡标签 -->
        <div class="flex border-b">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            class="px-4 py-2 cursor-pointer"
            :class="[
              currentTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'hover:bg-gray-100 dark:text-white',
            ]"
          >
            {{ tab.name }}
          </div>
        </div>

        <!-- 消息显示区域 -->
        <div class="flex-1 overflow-auto p-4" ref="messageContainer">
          <!-- 弹幕 -->
          <div v-if="currentTab === 'danmaku'" class="space-y-2">
            <div v-for="(msg, index) in messages.danmaku" :key="index" class="flex items-start">
              <span class="text-blue-500 font-semibold mr-2">{{ msg.uname }}:</span>
              <span>{{ msg.msg }}</span>
            </div>
            <div v-if="messages.danmaku.length === 0" class="text-gray-500 text-center py-8">
              暂无弹幕消息
            </div>
          </div>

          <!-- 礼物 -->
          <div v-if="currentTab === 'gift'" class="space-y-2">
            <div
              v-for="(msg, index) in messages.gift"
              :key="index"
              class="flex items-start text-pink-500"
            >
              <span class="font-semibold mr-2">{{ msg.uname }}</span>
              <span>赠送了 {{ msg.num }} 个 {{ msg.giftName }}</span>
            </div>
            <div v-if="messages.gift.length === 0" class="text-gray-500 text-center py-8">
              暂无礼物消息
            </div>
          </div>

          <!-- 点赞 -->
          <div v-if="currentTab === 'like'" class="space-y-2">
            <div v-for="(msg, index) in messages.like" :key="index" class="flex items-start">
              <span class="text-orange-500 font-semibold mr-2">{{ msg.uname }}</span>
              <span>{{ msg.text }}</span>
            </div>
            <div v-if="messages.like.length === 0" class="text-gray-500 text-center py-8">
              暂无点赞消息
            </div>
          </div>

          <!-- 入场 -->
          <div v-if="currentTab === 'enter'" class="space-y-2">
            <div v-for="(msg, index) in messages.enter" :key="index" class="flex items-start">
              <span class="text-green-500 font-semibold mr-2">{{ msg.uname }}</span>
              <span>进入了直播间</span>
              <span v-if="msg.medalLevel > 0" class="ml-2 text-sm text-gray-500">
                (粉丝牌等级: {{ msg.medalLevel }})
              </span>
            </div>
            <div v-if="messages.enter.length === 0" class="text-gray-500 text-center py-8">
              暂无进场消息
            </div>
          </div>

          <!-- 系统消息 -->
          <div v-if="currentTab === 'system'" class="space-y-2">
            <div
              v-for="(msg, index) in messages.system"
              :key="index"
              class="p-2 border rounded"
              :class="{
                'bg-blue-50 border-blue-200': msg.type === 'info',
                'bg-yellow-50 border-yellow-200': msg.type === 'warning',
                'bg-red-50 border-red-200': msg.type === 'error',
                'bg-purple-50 border-purple-200': msg.type === 'notice',
              }"
            >
              <div class="flex items-center">
                <span
                  class="mr-2 text-sm font-semibold"
                  :class="{
                    'text-blue-500': msg.type === 'info',
                    'text-yellow-500': msg.type === 'warning',
                    'text-red-500': msg.type === 'error',
                    'text-purple-500': msg.type === 'notice',
                  }"
                >
                  {{
                    msg.type === 'info'
                      ? '信息'
                      : msg.type === 'warning'
                      ? '警告'
                      : msg.type === 'error'
                      ? '错误'
                      : '通知'
                  }}
                </span>
                <span>{{ msg.content }}</span>
              </div>
              <div v-if="msg.timestamp" class="text-xs text-gray-500 mt-1">
                {{ new Date(msg.timestamp).toLocaleString() }}
              </div>
            </div>
            <div v-if="messages.system.length === 0" class="text-gray-500 text-center py-8">
              暂无系统消息
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：配置表单区域 -->
      <div class="w-1/3 p-4 overflow-auto">
        <div class="space-y-6">
          <!-- 连接配置 -->
          <div class="border rounded p-4 bg-gray-50">
            <h2 class="text-lg font-semibold mb-3">连接设置</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">房间ID</label>
                <div class="flex">
                  <input
                    v-model="roomIdInput"
                    type="text"
                    class="flex-1 border rounded px-3 py-2"
                    placeholder="请输入B站直播间ID"
                  />
                  <button
                    @click="connectToRoom"
                    class="ml-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                    :disabled="isConnected || !roomIdInput"
                  >
                    连接
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">历史房间</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="room in config.room_ids"
                    :key="room.id"
                    @click="selectRoom(room)"
                    class="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                  >
                    {{ room.name || room.id }}
                  </button>
                  <div v-if="config.room_ids.length === 0" class="text-gray-500 text-sm py-1">
                    暂无历史记录
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TTS设置 -->
          <div class="border rounded p-4 bg-gray-50">
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-lg font-semibold">语音设置 (TTS)</h2>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="config.ttsEnabled"
                  class="sr-only peer"
                  @change="saveBiliConfig"
                />
                <div
                  class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>

            <div class="space-y-4">
              <!-- TTS 引擎选择 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">TTS 引擎</label>
                <select
                  v-model="ttsMode"
                  @change="saveTTSMode"
                  class="w-full border rounded px-3 py-2"
                >
                  <option value="local">本地 TTS</option>
                  <option value="azure">Azure TTS</option>
                  <option value="alibaba">阿里云 TTS</option>
                  <option value="sovits">SoVITS</option>
                </select>
              </div>

              <!-- 测试TTS -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">测试文本</label>
                <div class="flex">
                  <input
                    v-model="testText"
                    type="text"
                    class="flex-1 border rounded px-3 py-2"
                    placeholder="输入测试文本"
                  />
                  <button
                    @click="testTTS"
                    class="ml-2 px-4 py-2 bg-green-500 text-white rounded"
                  >
                    测试
                  </button>
                </div>
              </div>

              <!-- 消息类型开关 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">播报消息类型</label>
                <div class="flex flex-wrap gap-3">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="readDanmaku"
                      v-model="config.readDanmaku"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      @change="saveBiliConfig"
                    />
                    <label for="readDanmaku" class="ml-2 text-sm text-gray-700">弹幕</label>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="readGift"
                      v-model="config.readGift"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      @change="saveBiliConfig"
                    />
                    <label for="readGift" class="ml-2 text-sm text-gray-700">礼物</label>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="readEnter"
                      v-model="config.readEnter"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      @change="saveBiliConfig"
                    />
                    <label for="readEnter" class="ml-2 text-sm text-gray-700">进场</label>
                  </div>

                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="readLike"
                      v-model="config.readLike"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      @change="saveBiliConfig"
                    />
                    <label for="readLike" class="ml-2 text-sm text-gray-700">点赞</label>
                  </div>
                </div>
              </div>

              <!-- 高级设置按钮 -->
              <div>
                <button
                  @click="showAdvancedSettings = !showAdvancedSettings"
                  class="w-full px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded flex justify-between items-center"
                >
                  <span>高级设置</span>
                  <span>{{ showAdvancedSettings ? '▲' : '▼' }}</span>
                </button>
              </div>

              <!-- 高级设置 -->
              <div v-if="showAdvancedSettings" class="pt-3 border-t">
                <!-- 根据选择的TTS类型显示不同的配置表单 -->
                <div v-if="ttsMode === 'azure'" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      v-model="azureConfig.azure_key"
                      type="password"
                      class="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">区域</label>
                    <input
                      v-model="azureConfig.azure_region"
                      type="text"
                      class="w-full border rounded px-3 py-2"
                      placeholder="例如: eastasia"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">语音模型</label>
                    <input
                      v-model="azureConfig.azure_model"
                      type="text"
                      class="w-full border rounded px-3 py-2"
                      placeholder="例如: zh-CN-XiaoxiaoNeural"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      语速 ({{ azureConfig.speed }})
                    </label>
                    <input
                      v-model.number="azureConfig.speed"
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      音调 ({{ azureConfig.pitch || 0 }})
                    </label>
                    <input
                      v-model.number="azureConfig.pitch"
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      class="w-full"
                    />
                  </div>
                  <div class="pt-3">
                    <button
                      @click="saveAzureConfig"
                      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      保存Azure配置
                    </button>
                  </div>
                </div>

                <div v-if="ttsMode === 'alibaba'" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">AppKey</label>
                    <input
                      v-model="alibabaConfig.alibaba_appkey"
                      type="password"
                      class="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Token</label>
                    <input
                      v-model="alibabaConfig.alibaba_token"
                      type="password"
                      class="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">语音模型</label>
                    <select
                      v-model="alibabaConfig.alibaba_model"
                      class="w-full border rounded px-3 py-2"
                    >
                      <option value="xiaoyun">小云</option>
                      <option value="xiaogang">小刚</option>
                      <option value="ruoxi">若希</option>
                      <option value="siqi">思琪</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      语速 ({{ alibabaConfig.speed }})
                    </label>
                    <input
                      v-model.number="alibabaConfig.speed"
                      type="range"
                      min="50"
                      max="200"
                      step="1"
                      class="w-full"
                    />
                  </div>
                  <div class="pt-3">
                    <button
                      @click="saveAlibabaConfig"
                      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      保存阿里云配置
                    </button>
                  </div>
                </div>

                <div v-if="ttsMode === 'sovits'" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">API地址</label>
                    <input
                      v-model="sovitsConfig.sovits_host"
                      type="text"
                      class="w-full border rounded px-3 py-2"
                      placeholder="例如: http://127.0.0.1:5000/tts"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">模型</label>
                    <input
                      v-model="sovitsConfig.sovits_model"
                      type="text"
                      class="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">语言</label>
                    <select
                      v-model="sovitsConfig.sovits_language"
                      class="w-full border rounded px-3 py-2"
                    >
                      <option value="auto">自动检测</option>
                      <option value="zh">中文</option>
                      <option value="en">英文</option>
                      <option value="ja">日文</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      语速 ({{ sovitsConfig.sovits_speed }})
                    </label>
                    <input
                      v-model="sovitsConfig.sovits_speed"
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      class="w-full"
                    />
                  </div>
                  <div class="pt-3">
                    <button
                      @click="saveSovitsConfig"
                      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      保存SoVITS配置
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

// 状态和数据
const roomIdInput = ref('');
const isConnected = ref(false);
const currentRoomId = ref(null);
const popularity = ref(0);
const showAdvancedSettings = ref(false);
const testText = ref('这是一条测试语音，如果你能听到，说明配置正确。');

// 消息容器引用，用于自动滚动
const messageContainer = ref(null);

// 消息列表，按类型分类
const messages = ref({
  danmaku: [], // 弹幕
  gift: [], // 礼物
  like: [], // 点赞
  enter: [], // 进场
  system: [], // 系统消息
});

// 标签页设置
const currentTab = ref('danmaku');
const tabs = [
  { id: 'danmaku', name: '弹幕' },
  { id: 'gift', name: '礼物' },
  { id: 'like', name: '点赞' },
  { id: 'enter', name: '进场' },
  { id: 'system', name: '系统' },
];

// 配置
const config = ref({
  room_ids: [], // 历史房间ID
  ttsEnabled: true, // 是否启用TTS
  readDanmaku: true, // 是否播报弹幕
  readGift: true, // 是否播报礼物
  readEnter: true, // 是否播报进场
  readLike: true, // 是否播报点赞
});

// TTS 配置
const ttsMode = ref('local'); // local, azure, alibaba, sovits
const azureConfig = ref({
  azure_key: '',
  azure_region: '',
  azure_model: '',
  speed: 1.0,
  pitch: 0,
});

const alibabaConfig = ref({
  alibaba_appkey: '',
  alibaba_token: '',
  alibaba_model: 'xiaoyun',
  speed: 100,
});

const sovitsConfig = ref({
  sovits_host: 'http://127.0.0.1:5000/tts',
  sovits_model: '',
  sovits_language: 'auto',
  sovits_speed: '1.0',
});

// 自动滚动消息容器到底部
function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
}

// 监听消息列表变化，自动滚动
watch(
  () => [
    messages.value.danmaku.length,
    messages.value.gift.length,
    messages.value.like.length,
    messages.value.enter.length,
    messages.value.system.length,
  ],
  () => {
    scrollToBottom();
  }
);

// 加载配置
async function loadConfig() {
  try {
    const response = await window.api.biliLive.getConfig();
    if (response.success && response.data) {
      if (response.data.room_ids) {
        config.value.room_ids = response.data.room_ids;
      }
      config.value.ttsEnabled = response.data.ttsEnabled ?? true;
      config.value.readDanmaku = response.data.readDanmaku ?? true;
      config.value.readGift = response.data.readGift ?? true;
      config.value.readEnter = response.data.readEnter ?? true;
      config.value.readLike = response.data.readLike ?? true;

      ttsMode.value = response.data.mode || 'local';
      
      if (response.data.azure) {
        azureConfig.value = response.data.azure;
      }
      
      if (response.data.alibaba) {
        alibabaConfig.value = response.data.alibaba;
      }
      
      if (response.data.sovits) {
        sovitsConfig.value = response.data.sovits;
      }
    } else {
      // 如果配置加载失败，使用默认配置
      const defaultResponse = await window.api.biliLive.getDefaultConfig();
      if (defaultResponse.success && defaultResponse.data) {
        config.value = { ...defaultResponse.data.bili };
        azureConfig.value = { ...defaultResponse.data.azure };
        alibabaConfig.value = { ...defaultResponse.data.alibaba };
        sovitsConfig.value = { ...defaultResponse.data.sovits };
      }
    }
  } catch (err) {
    console.error('Failed to load config:', err);
    addSystemMessage('error', '加载配置失败: ' + err.message);
  }
}

// 保存B站配置
async function saveBiliConfig() {
  try {
    const response = await window.api.biliLive.saveBiliConfig(config.value);
    if (response.success) {
      addSystemMessage('info', '配置已保存');
    } else {
      addSystemMessage('error', '保存失败: ' + response.error);
    }
  } catch (err) {
    console.error('Failed to save bili config:', err);
    addSystemMessage('error', '保存配置失败: ' + err.message);
  }
}

// 保存TTS模式
async function saveTTSMode() {
  try {
    const response = await window.api.biliLive.saveTTSMode(ttsMode.value);
    if (response.success) {
      addSystemMessage('info', `TTS模式已切换为: ${ttsMode.value}`);
    } else {
      addSystemMessage('error', '保存TTS模式失败: ' + response.error);
    }
  } catch (err) {
    console.error('Failed to save TTS mode:', err);
    addSystemMessage('error', '保存TTS模式失败: ' + err.message);
  }
}

// 保存Azure配置
async function saveAzureConfig() {
  try {
    const response = await window.api.biliLive.saveAzureConfig(azureConfig.value);
    if (response.success) {
      addSystemMessage('info', 'Azure TTS配置已保存');
    } else {
      addSystemMessage('error', '保存Azure配置失败: ' + response.error);
    }
  } catch (err) {
    console.error('Failed to save Azure config:', err);
    addSystemMessage('error', '保存Azure配置失败: ' + err.message);
  }
}

// 保存阿里云配置
async function saveAlibabaConfig() {
  try {
    const response = await window.api.biliLive.saveAlibabaConfig(alibabaConfig.value);
    if (response.success) {
      addSystemMessage('info', '阿里云 TTS配置已保存');
    } else {
      addSystemMessage('error', '保存阿里云配置失败: ' + response.error);
    }
  } catch (err) {
    console.error('Failed to save Alibaba config:', err);
    addSystemMessage('error', '保存阿里云配置失败: ' + err.message);
  }
}

// 保存SoVITS配置
async function saveSovitsConfig() {
  try {
    const response = await window.api.biliLive.saveSovitsConfig(sovitsConfig.value);
    if (response.success) {
      addSystemMessage('info', 'SoVITS配置已保存');
    } else {
      addSystemMessage('error', '保存SoVITS配置失败: ' + response.error);
    }
  } catch (err) {
    console.error('Failed to save SoVITS config:', err);
    addSystemMessage('error', '保存SoVITS配置失败: ' + err.message);
  }
}

// 测试TTS
async function testTTS() {
  try {
    if (!testText.value) {
      testText.value = '这是一条测试语音，如果你能听到，说明配置正确。';
    }
    
    const response = await window.api.biliLive.testTTS(testText.value);
    if (!response.success) {
      addSystemMessage('error', '测试TTS失败: ' + response.error);
    }
  } catch (err) {
    console.error('Failed to test TTS:', err);
    addSystemMessage('error', '测试TTS失败: ' + err.message);
  }
}

// 选择历史房间
function selectRoom(room) {
  roomIdInput.value = room.id.toString();
}

// 连接到直播间
async function connectToRoom() {
  if (!roomIdInput.value) {
    addSystemMessage('warning', '请输入房间ID');
    return;
  }
  
  try {
    const response = await window.api.biliLive.connect(roomIdInput.value);
    if (!response.success) {
      addSystemMessage('error', '连接失败: ' + response.error);
    } else {
      addSystemMessage('info', '正在连接...');
    }
  } catch (err) {
    console.error('Connect failed:', err);
    addSystemMessage('error', '连接失败: ' + err.message);
  }
}

// 断开连接
async function disconnect() {
  try {
    const response = await window.api.biliLive.disconnect();
    if (!response.success) {
      addSystemMessage('error', '断开连接失败: ' + response.error);
    }
  } catch (err) {
    console.error('Disconnect failed:', err);
    addSystemMessage('error', '断开连接失败: ' + err.message);
  }
}

// 添加系统消息
function addSystemMessage(type, content) {
  messages.value.system.unshift({
    type,
    content,
    timestamp: Date.now(),
  });
  
  // 限制保存的消息数量
  if (messages.value.system.length > 100) {
    messages.value.system.pop();
  }
}

// 添加弹幕消息
function addDanmakuMessage(data) {
  messages.value.danmaku.unshift(data);
  if (messages.value.danmaku.length > 100) {
    messages.value.danmaku.pop();
  }
}

// 添加礼物消息
function addGiftMessage(data) {
  messages.value.gift.unshift(data);
  if (messages.value.gift.length > 100) {
    messages.value.gift.pop();
  }
}

// 添加点赞消息
function addLikeMessage(data) {
  messages.value.like.unshift(data);
  if (messages.value.like.length > 100) {
    messages.value.like.pop();
  }
}

// 添加进场消息
function addEnterMessage(data) {
  messages.value.enter.unshift(data);
  if (messages.value.enter.length > 100) {
    messages.value.enter.pop();
  }
}

// IPC 监听器
function setupListeners() {
  // 连接状态
  window.electron.listenToChannel('bililive-connection-status', (data) => {
    isConnected.value = data.connected;
    currentRoomId.value = data.roomId;
    
    if (data.connected) {
      addSystemMessage('info', `已连接到房间 ${data.roomId}`);
      
      // 保存该房间ID到历史记录
      const roomIndex = config.value.room_ids.findIndex(r => r.id === data.roomId);
      if (roomIndex === -1) {
        config.value.room_ids.unshift({ id: data.roomId, name: `房间 ${data.roomId}` });
        // 限制最多保存10个历史记录
        if (config.value.room_ids.length > 10) {
          config.value.room_ids.pop();
        }
        saveBiliConfig();
      }
    } else {
      addSystemMessage('info', '已断开连接');
    }
  });
  
  // 人气值
  window.electron.listenToChannel('bililive-popularity', (data) => {
    popularity.value = data;
  });
  
  // 弹幕
  window.electron.listenToChannel('bililive-danmaku', (data) => {
    addDanmakuMessage(data);
  });
  
  // 礼物
  window.electron.listenToChannel('bililive-gift', (data) => {
    addGiftMessage(data);
  });
  
  // 点赞
  window.electron.listenToChannel('bililive-like', (data) => {
    addLikeMessage(data);
  });
  
  // 进场
  window.electron.listenToChannel('bililive-enter', (data) => {
    addEnterMessage(data);
  });
  
  // 系统消息
  window.electron.listenToChannel('bililive-message', (data) => {
    addSystemMessage(data.type, data.content);
  });
  
  // TTS状态（正在播放）
  window.electron.listenToChannel('bililive-tts-status', (data) => {
    // 可以显示当前正在播放的语音内容
    if (data.speaking && data.text) {
      console.log('Speaking:', data.text);
    }
  });
}

// 移除监听器
function removeListeners() {
  window.electron.removeListener('bililive-connection-status');
  window.electron.removeListener('bililive-popularity');
  window.electron.removeListener('bililive-danmaku');
  window.electron.removeListener('bililive-gift');
  window.electron.removeListener('bililive-like');
  window.electron.removeListener('bililive-enter');
  window.electron.removeListener('bililive-message');
  window.electron.removeListener('bililive-tts-status');
}

onMounted(async () => {
  // 加载配置
  await loadConfig();
  
  // 设置监听器
  setupListeners();
  
  // 添加欢迎消息
  addSystemMessage('info', '欢迎使用 Bili 直播弹幕助手');
});

onUnmounted(() => {
  // 移除监听器
  removeListeners();
});
</script>

<style scoped>
/* 定义一些边框、颜色等样式 */
</style> 