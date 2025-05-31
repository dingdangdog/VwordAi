<template>
  <div>
    <!-- 连接状态横幅 -->
    <div
      v-if="isConnected"
      class="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-2 flex justify-between items-center"
    >
      <div class="flex items-center">
        <span
          class="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"
        ></span>
        <span>已连接到直播间: {{ currentRoomId }}</span>
      </div>
      <button
        @click="() => disconnect('用户手动断开')"
        class="text-sm px-2 py-1 bg-green-200 hover:bg-green-300 rounded"
      >
        断开连接
      </button>
    </div>
    <div
      v-else-if="lastConnectionRoomId"
      class="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-2"
    >
      已断开连接 (上次房间: {{ lastConnectionRoomId }})
    </div>

    <!-- 标题区域 -->
    <div
      class="flex justify-between items-center px-4 py-2 border-b border-gray-50 dark:border-gray-300"
    >
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-bold dark:text-white">BiliBili 直播助手</h1>

        <!-- 房间人气 -->
        <div v-if="isConnected" class="p-2 text-sm dark:text-gray-200">
          <span>人气值: {{ popularity }}</span>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span v-if="isConnected" class="text-green-500 flex items-center">
          <span
            class="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"
          ></span>
          已连接到房间: {{ currentRoomId }}
        </span>
        <span v-else class="text-gray-500">未连接</span>
        <!-- <button
            v-if="!isConnected"
            @click="connectToRoom"
            class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            连接
          </button> -->
        <button
          v-if="isConnected"
          @click="() => disconnect('用户手动断开')"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          断开
        </button>
      </div>
    </div>
  </div>
  <!-- 主体内容：消息显示区域和配置区域 -->
  <div class="flex h-full space-x-2 overflow-hidden">
    <!-- 左侧：消息显示区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 选项卡标签 -->
      <div class="flex border-b border-gray-100 dark:border-gray-400">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          @click="currentTab = tab.id"
          class="px-4 py-2 cursor-pointer"
          :class="[
            currentTab === tab.id
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white',
          ]"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- 消息显示区域 -->
      <div
        class="flex-1 overflow-auto p-4 max-h-[calc(100vh-13rem)] bg-gray-100/10"
        ref="messageContainer"
      >
        <!-- 弹幕 -->
        <div v-if="currentTab === 'danmaku'" class="space-y-2">
          <div
            v-for="(msg, index) in messages.danmaku"
            :key="index"
            class="flex items-start"
          >
            <span class="text-blue-500 font-semibold mr-2"
              >{{ msg.uname }}:</span
            >
            <span class="text-gray-500 dark:text-gray-200">{{ msg.msg }}</span>
          </div>
          <div
            v-if="messages.danmaku.length === 0"
            class="text-gray-500 dark:text-gray-200 text-center py-8"
          >
            暂无弹幕消息
          </div>
        </div>

        <!-- DEBUG - Raw Messages -->
        <div v-if="currentTab === 'debug'" class="space-y-2">
          <div class="bg-yellow-100/60 p-2 mb-4 text-yellow-800 rounded">
            <strong>调试模式</strong>: 显示所有原始消息，用于排查问题。
            <div class="flex mt-2">
              <button
                @click="clearDebugMessages"
                class="px-2 py-1 bg-yellow-200/50 text-yellow-800 rounded hover:bg-yellow-300 mr-2"
              >
                清空消息
              </button>
            </div>
          </div>

          <div
            v-for="(msg, index) in messages.debug"
            :key="index"
            class="border p-2 mb-2 rounded text-xs font-mono bg-gray-50 break-all"
          >
            <div class="flex justify-between mb-1">
              <span class="font-bold text-purple-600">{{
                msg.cmd || "Unknown"
              }}</span>
              <span class="text-gray-500">{{
                new Date(msg.timestamp).toLocaleTimeString()
              }}</span>
            </div>
            <pre
              class="whitespace-pre-wrap overflow-auto max-h-40 bg-gray-200"
              >{{ JSON.stringify(msg.data, null, 2) }}</pre
            >
          </div>
          <div
            v-if="messages.debug.length === 0"
            class="text-gray-500 text-center py-8"
          >
            暂无调试消息
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
            <span class="text-gray-500 dark:text-gray-200"
              >赠送了 {{ msg.num }} 个 {{ msg.giftName }}</span
            >
          </div>
          <div
            v-if="messages.gift.length === 0"
            class="text-gray-500 dark:text-gray-200 text-center py-8"
          >
            暂无礼物消息
          </div>
        </div>

        <!-- 点赞 -->
        <div v-if="currentTab === 'like'" class="space-y-2">
          <div
            v-for="(msg, index) in messages.like"
            :key="index"
            class="flex items-start"
          >
            <span class="text-orange-500 font-semibold mr-2">{{
              msg.uname
            }}</span>
            <span>{{ msg.text }}</span>
          </div>
          <div
            v-if="messages.like.length === 0"
            class="text-gray-500 dark:text-gray-200 text-center py-8"
          >
            暂无点赞消息
          </div>
        </div>

        <!-- 入场 -->
        <div v-if="currentTab === 'enter'" class="space-y-2">
          <div
            v-for="(msg, index) in messages.enter"
            :key="index"
            class="flex items-start"
          >
            <span class="text-green-500 font-semibold mr-2">{{
              msg.uname
            }}</span>
            <span class="text-gray-500 dark:text-gray-200">进入了直播间</span>
            <span v-if="msg.medalLevel > 0" class="ml-2 text-sm text-gray-500">
              (粉丝牌等级: {{ msg.medalLevel }})
            </span>
          </div>
          <div
            v-if="messages.enter.length === 0"
            class="text-gray-500 dark:text-gray-200 text-center py-8"
          >
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
                  msg.type === "info"
                    ? "信息"
                    : msg.type === "warning"
                      ? "警告"
                      : msg.type === "error"
                        ? "错误"
                        : "通知"
                }}
              </span>
              <span>{{ msg.content }}</span>
            </div>
            <div v-if="msg.timestamp" class="text-xs text-gray-500 mt-1">
              {{ new Date(msg.timestamp).toLocaleString() }}
            </div>
          </div>
          <div
            v-if="messages.system.length === 0"
            class="text-gray-500 dark:text-gray-200 text-center py-8"
          >
            暂无系统消息
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：配置表单区域 -->
    <div
      class="w-1/3 max-w-[30rem] p-1 h-full max-h-[calc(100vh-5rem)] rounded-sm overflow-auto"
    >
      <div class="space-y-2">
        <!-- 连接配置 -->
        <div class="shadow-sm rounded p-2 bg-gray-50 dark:bg-gray-600">
          <h2 class="text-base font-semibold mb-1.5 dark:text-white">
            连接设置
          </h2>
          <div class="space-y-2">
            <div>
              <label
                class="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-200"
                >房间ID</label
              >
              <div class="flex">
                <input
                  v-model="roomIdInput"
                  type="text"
                  class="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="请输入B站直播间ID"
                />
                <button
                  @click="connectToRoom"
                  class="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded disabled:bg-gray-300"
                  :disabled="isConnected || !roomIdInput"
                >
                  连接
                </button>
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-200"
                >SESSDATA</label
              >
              <div class="flex relative">
                <input
                  v-model="config.SESSDATA"
                  type="password"
                  class="flex-1 border rounded px-2 py-1 text-sm pr-8"
                  placeholder="B站cookie中的SESSDATA值"
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-2">
                  <button
                    @click="showSessdataHelp = !showSessdataHelp"
                    class="text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div
                v-if="showSessdataHelp"
                class="mt-1 text-xs text-gray-600 bg-gray-100 p-1.5 rounded dark:bg-gray-700 dark:text-gray-300"
              >
                <p>SESSDATA是B站登录后cookie中的一个字段，获取方法：</p>
                <ol class="list-decimal list-inside pl-2 mt-0.5">
                  <li>登录B站网页版</li>
                  <li>按F12打开开发者工具</li>
                  <li>找到"应用"或"Application"选项卡</li>
                  <li>左侧选择"Cookies" > "https://live.bilibili.com"</li>
                  <li>在右侧找到名为"SESSDATA"的Cookie，复制其值</li>
                </ol>
                <p class="mt-0.5">不填也可以连接，但无法获取完整用户名称</p>
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-200"
                >历史房间</label
              >
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="room in config.room_ids"
                  :key="room.id"
                  @click="selectRoom(room)"
                  class="px-1.5 py-0.5 bg-gray-200 rounded text-xs hover:bg-gray-300"
                >
                  {{ room.name || room.id }}
                </button>
                <div
                  v-if="config.room_ids.length === 0"
                  class="text-gray-500 text-xs py-0.5"
                >
                  暂无历史记录
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TTS设置 -->
        <div class="shadow-sm rounded p-2 bg-gray-50 dark:bg-gray-600">
          <div class="flex justify-between items-center mb-1.5">
            <h2 class="text-base font-semibold dark:text-white">
              语音设置 (TTS)
            </h2>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="config.ttsEnabled"
                class="sr-only peer"
                @change="saveConfig(false)"
              />
              <div
                class="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>

          <div class="space-y-2">
            <!-- TTS 引擎选择和测试放在同一行 -->
            <div class="flex space-x-2 items-center">
              <label
                class="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-200"
                >TTS 引擎</label
              >
              <select
                v-model="ttsMode"
                class="border rounded px-2 py-1 text-sm"
              >
                <option value="local">本地默认语音</option>
                <option value="azure">微软Azure</option>
                <option value="aliyun">阿里云Aliyun</option>
              </select>
              <button
                @click="testTTS"
                class="ml-1 px-2 py-1 bg-green-500 text-white text-xs rounded"
              >
                测试
              </button>
            </div>

            <div class="flex space-x-2 items-center">
              <label
                class="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-200"
                >测试文本</label
              >
              <input
                v-model="testText"
                type="text"
                class="flex-1 border rounded px-2 py-1 text-sm"
                placeholder="输入测试文本"
              />
            </div>

            <!-- 消息类型开关 -->
            <div class="flex space-x-2 items-center py-1">
              <label
                class="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-200"
                >播报消息类型</label
              >
              <div class="flex space-x-2">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="readDanmaku"
                    v-model="config.readDanmaku"
                    class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    @change="saveConfig(false)"
                  />
                  <label
                    for="readDanmaku"
                    class="ml-1 text-xs text-gray-700 dark:text-gray-200"
                    >弹幕</label
                  >
                </div>

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="readGift"
                    v-model="config.readGift"
                    class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    @change="saveConfig(false)"
                  />
                  <label
                    for="readGift"
                    class="ml-1 text-xs text-gray-700 dark:text-gray-200"
                    >礼物</label
                  >
                </div>

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="readEnter"
                    v-model="config.readEnter"
                    class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    @change="saveConfig(false)"
                  />
                  <label
                    for="readEnter"
                    class="ml-1 text-xs text-gray-700 dark:text-gray-200"
                    >进场</label
                  >
                </div>

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="readLike"
                    v-model="config.readLike"
                    class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    @change="saveConfig(false)"
                  />
                  <label
                    for="readLike"
                    class="ml-1 text-xs text-gray-700 dark:text-gray-200"
                    >点赞</label
                  >
                </div>
              </div>
            </div>

            <!-- 高级设置按钮 -->
            <div>
              <button
                @click="showAdvancedSettings = !showAdvancedSettings"
                class="w-full px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded flex justify-between items-center"
              >
                <span>高级设置</span>
                <span>{{ showAdvancedSettings ? "▲" : "▼" }}</span>
              </button>
            </div>
            <div v-if="showAdvancedSettings" class="pt-1.5 border-t">
              <!-- 根据选择的TTS类型显示不同的配置表单 -->
              <div v-if="ttsMode === 'azure'" class="space-y-1.5">
                <div>
                  <label
                    class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5"
                    >API Key</label
                  >
                  <input
                    v-model="azureConfig.azure_key"
                    type="password"
                    class="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div class="flex space-x-2">
                  <div class="flex-1">
                    <label
                      class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5"
                      >区域</label
                    >
                    <input
                      v-model="azureConfig.azure_region"
                      type="text"
                      class="w-full border rounded px-2 py-1 text-sm"
                      placeholder="例如: eastasia"
                    />
                  </div>
                  <div class="flex-1">
                    <label
                      class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-0.5"
                      >语音模型</label
                    >
                    <input
                      v-model="azureConfig.azure_model"
                      type="text"
                      class="w-full border rounded px-2 py-1 text-sm"
                      placeholder="例如: zh-CN-XiaoxiaoNeural"
                    />
                  </div>
                </div>
                <div class="pt-1.5">
                  <button
                    @click="saveAzureConfig"
                    class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    保存Azure配置
                  </button>
                </div>
              </div>

              <div v-if="ttsMode === 'aliyun'" class="space-y-1.5">
                <div class="flex space-x-2">
                  <div class="flex-1">
                    <label
                      class="block text-xs font-medium text-gray-700 mb-0.5"
                      >AppKey</label
                    >
                    <input
                      v-model="alibabaConfig.alibaba_appkey"
                      type="password"
                      class="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div class="flex-1">
                    <label
                      class="block text-xs font-medium text-gray-700 mb-0.5"
                      >Token</label
                    >
                    <input
                      v-model="alibabaConfig.alibaba_token"
                      type="password"
                      class="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-0.5"
                    >语音模型</label
                  >
                  <select
                    v-model="alibabaConfig.alibaba_model"
                    class="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="xiaoyun">小云</option>
                    <option value="xiaogang">小刚</option>
                    <option value="ruoxi">若希</option>
                    <option value="siqi">思琪</option>
                  </select>
                </div>
                <div class="pt-1.5">
                  <button
                    @click="saveAlibabaConfig"
                    class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    保存阿里云配置
                  </button>
                </div>
              </div>

              <div v-if="ttsMode === 'sovits'" class="space-y-1.5">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-0.5"
                    >API地址</label
                  >
                  <input
                    v-model="sovitsConfig.sovits_host"
                    type="text"
                    class="w-full border rounded px-2 py-1 text-sm"
                    placeholder="例如: http://127.0.0.1:5000/tts"
                  />
                </div>
                <div class="flex space-x-2">
                  <div class="flex-1">
                    <label
                      class="block text-xs font-medium text-gray-700 mb-0.5"
                      >模型</label
                    >
                    <input
                      v-model="sovitsConfig.sovits_model"
                      type="text"
                      class="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div class="flex-1">
                    <label
                      class="block text-xs font-medium text-gray-700 mb-0.5"
                      >语言</label
                    >
                    <select
                      v-model="sovitsConfig.sovits_language"
                      class="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="auto">自动检测</option>
                      <option value="zh">中文</option>
                      <option value="en">英文</option>
                      <option value="ja">日文</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-0.5">
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
                <div class="pt-1.5">
                  <button
                    @click="saveSovitsConfig"
                    class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    保存SoVITS配置
                  </button>
                </div>
              </div>

              <div v-if="ttsMode === 'local'" class="space-y-1.5">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  本地语音无需配置
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据记录设置 -->
        <div class="shadow-sm rounded p-2 bg-gray-50 dark:bg-gray-600">
          <div class="flex justify-between items-center mb-1.5">
            <h2 class="text-base font-semibold dark:text-white">数据记录</h2>
          </div>

          <div class="space-y-2">
            <div>
              <label
                class="block text-xs font-medium text-gray-700 mb-0.5 dark:text-gray-200"
                >记录类型</label
              >
              <div class="flex space-x-3">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="recordDanmaku"
                    v-model="config.recordDanmaku"
                    class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    @change="saveConfig(false)"
                  />
                  <label
                    for="recordDanmaku"
                    class="ml-1 text-xs text-gray-700 dark:text-gray-200"
                    >弹幕</label
                  >
                </div>

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="recordGift"
                    v-model="config.recordGift"
                    class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    @change="saveConfig(false)"
                  />
                  <label
                    for="recordGift"
                    class="ml-1 text-xs text-gray-700 dark:text-gray-200"
                    >礼物</label
                  >
                </div>

                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="recordVisitor"
                    v-model="config.recordVisitor"
                    class="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
                    @change="saveConfig(false)"
                  />
                  <label
                    for="recordVisitor"
                    class="ml-1 text-xs text-gray-700 dark:text-gray-200"
                    >访客</label
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 保存设置按钮 -->
        <div class="flex justify-center p-2 bg-gray-50 dark:bg-gray-600">
          <button
            @click="saveConfig(true)"
            class="px-3 py-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white text-sm rounded disabled:bg-gray-300"
            :disabled="isSaving"
          >
            <span v-if="isSaving"> 正在保存... </span>
            <span v-else> 保存配置 </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from "vue";
import { useToast } from "vue-toastification";
import { useBiliLiveStore } from "@/stores/biliLive";
import { useSettingsStore } from "@/stores/settings";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import type {
  BiliLiveConfig,
  AzureConfig,
  AlibabaConfig,
  SoVITSConfig,
} from "@/services/BiliLiveService";

/**
 * 深度克隆对象并确保可序列化
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
function safeClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// 注意：由于Electron预加载脚本和TypeScript定义之间的差异，
// 我们使用类型断言(as)来处理window.electron和window.api对象。
// 为了确保类型安全，我们引入了必要的接口类型。

// TypeScript interfaces
interface Tab {
  id: string;
  name: string;
}

interface Room {
  id: string | number;
  name: string;
}

interface DanmakuMessage {
  uname: string;
  msg: string;
}

interface GiftMessage {
  uname: string;
  num: number;
  giftName: string;
}

interface LikeMessage {
  uname: string;
  text: string;
}

interface EnterMessage {
  uname: string;
  medalLevel: number;
}

interface SystemMessage {
  type: "info" | "warning" | "error" | "notice";
  content: string;
  timestamp: number;
}

interface DebugMessage {
  cmd: string;
  data: any;
  timestamp: number;
}

// 获取toast通知实例
const toast = useToast();
// 获取BiliLive store和Settings store
const biliLiveStore = useBiliLiveStore();
const settingsStore = useSettingsStore();

// 状态变量
const roomIdInput = ref("");
const isConnected = ref(false);
const currentRoomId = ref<string | null>(null);
const lastConnectionRoomId = ref<string | null>(null);
const popularity = ref(0);
const showAdvancedSettings = ref(false);
const testText = ref("如果你能听到，说明语音配置成功。");
const showSessdataHelp = ref(false);
const isSaving = ref(false);

// 消息容器引用，用于自动滚动
const messageContainer = ref<HTMLElement | null>(null);

// 消息列表，按类型分类
const messages = ref({
  danmaku: [] as DanmakuMessage[],
  gift: [] as GiftMessage[],
  like: [] as LikeMessage[],
  enter: [] as EnterMessage[],
  system: [] as SystemMessage[],
  debug: [] as DebugMessage[],
});

// 标签页设置
const currentTab = ref("danmaku");
const tabs: Tab[] = [
  { id: "danmaku", name: "弹幕" },
  { id: "gift", name: "礼物" },
  { id: "like", name: "点赞" },
  { id: "enter", name: "进场" },
  { id: "system", name: "系统" },
  // { id: "debug", name: "调试" },
];

// 配置
const config = ref<BiliLiveConfig>({
  room_ids: [], // 历史房间ID
  ttsEnabled: true, // 是否启用TTS
  readDanmaku: true, // 是否播报弹幕
  readGift: true, // 是否播报礼物
  readEnter: true, // 是否播报进场
  readLike: true, // 是否播报点赞
  SESSDATA: "", // 新增SESSDATA字段
  recordDanmaku: true, // 是否记录弹幕
  recordGift: true, // 是否记录礼物
  recordVisitor: true, // 是否记录访客
});

// 获取TTS模式（从BiliLive store）
const ttsMode = computed({
  get: () => {
    // 直接从BiliLive store获取TTS模式
    const mode = biliLiveStore.getTTSMode();
    console.log(`当前TTS模式: ${mode}`);
    return mode;
  },
  set: (value: string) => {
    // 确保值在允许的范围内
    if (!["local", "azure", "aliyun", "sovits"].includes(value)) {
      console.warn(`Invalid TTS mode: ${value}, defaulting to local`);
      value = "local";
    }

    console.log(`[ttsMode.setter] 设置TTS模式为: ${value}`);

    // 如果是Azure模式，确保在settings中启用
    if (value === "azure") {
      // 启用Azure服务提供商
      const currentConfig = settingsStore.getTTSProviderConfig("azure") || {};
      settingsStore.updateTTSProvider("azure", {
        ...currentConfig,
        enabled: true,
      });
    } else if (value !== "azure") {
      // 如果不是Azure模式，禁用settings中的Azure
      const currentConfig = settingsStore.getTTSProviderConfig("azure") || {};
      settingsStore.updateTTSProvider("azure", {
        ...currentConfig,
        enabled: false,
      });
    }

    // 简化：直接保存到后端，不依赖复杂的内存管理
    console.log(`[ttsMode.setter] 直接保存TTS模式: ${value}`);
    biliLiveStore
      .saveTTSMode(value)
      .then((response) => {
        if (response.success) {
          console.log(`[ttsMode.setter] TTS模式保存成功: ${value}`);
        } else {
          console.error(`[ttsMode.setter] TTS模式保存失败:`, response.error);
        }
      })
      .catch((error) => {
        console.error(`[ttsMode.setter] TTS模式保存异常:`, error);
      });
  },
});

// 使用settings store中的配置
const azureConfig = computed({
  get: () => {
    // 首先尝试从本地配置中获取 tts.azure 设置
    if (config.value && config.value.tts && config.value.tts.azure) {
      return {
        azure_key: config.value.tts.azure.azure_key || "",
        azure_region: config.value.tts.azure.azure_region || "",
        azure_model: config.value.tts.azure.azure_model || "",
        speed: config.value.tts.azure.speed || 1.0,
        pitch: config.value.tts.azure.pitch || 0,
      };
    }

    // 后备方案：从设置存储中获取
    const provider = settingsStore.getTTSProviderConfig("azure") || {};
    return {
      azure_key: provider.key || "",
      azure_region: provider.region || "",
      azure_model: provider.voiceName || "",
      speed: provider.speed || 1.0,
      pitch: provider.pitch || 0,
    };
  },
  set: () => {}, // 不需要设置器，使用特定方法更新
});

// 阿里云和SoVITS配置保持原样，但可以在将来也集成到settings中
const alibabaConfig = ref<AlibabaConfig>({
  alibaba_appkey: "",
  alibaba_token: "",
  alibaba_model: "xiaoyun",
  speed: 100,
});

const sovitsConfig = ref<SoVITSConfig>({
  sovits_host: "http://127.0.0.1:5000/tts",
  sovits_model: "",
  sovits_language: "auto",
  sovits_speed: "1.0",
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
    // 先加载设置存储中的服务提供商配置
    await settingsStore.loadSettings();

    // 加载B站直播特有配置
    const api = window.api as any;
    const response = await api.biliLive.getConfig();
    if (response.success && response.data) {
      if (response.data.room_ids) {
        // 将所有房间ID统一为字符串类型
        config.value.room_ids = response.data.room_ids.map((room: any) => ({
          id: String(room.id),
          name: room.name || `房间 ${room.id}`,
        }));
      }

      // 设置基本配置项
      config.value.ttsEnabled = response.data.ttsEnabled ?? true;
      config.value.readDanmaku = response.data.readDanmaku ?? true;
      config.value.readGift = response.data.readGift ?? true;
      config.value.readEnter = response.data.readEnter ?? true;
      config.value.readLike = response.data.readLike ?? true;
      config.value.SESSDATA = response.data.SESSDATA ?? "";

      // 加载数据记录配置
      config.value.recordDanmaku = response.data.recordDanmaku ?? true;
      config.value.recordGift = response.data.recordGift ?? true;
      config.value.recordVisitor = response.data.recordVisitor ?? true;

      // 特殊处理：将tts配置添加到config.value中
      if (response.data.tts) {
        (config.value as any).tts = response.data.tts;
        console.log("Loaded TTS config:", response.data.tts);
      }

      // 加载阿里云和SoVITS配置（保持原样）
      if (response.data.tts && response.data.tts.alibaba) {
        alibabaConfig.value = response.data.tts.alibaba;
      }

      if (response.data.tts && response.data.tts.sovits) {
        sovitsConfig.value = response.data.tts.sovits;
      }
    } else {
      // 配置加载失败，显示错误
      console.error("Failed to load config:", response.error);
      addSystemMessage(
        "error",
        "加载配置失败: " + (response.error || "未知错误")
      );
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to load config:", error);
    addSystemMessage("error", "加载配置失败: " + error.message);
  }
}

/**
 * 保存B站配置
 * @param {boolean} showToast 是否显示保存成功的toast通知，默认为true
 */
const saveConfig = async (showToast = true) => {
  try {
    isSaving.value = true;

    // 记录SESSDATA长度（不记录具体内容以避免敏感信息泄露）
    const sessdataLength = config.value.SESSDATA
      ? config.value.SESSDATA.length
      : 0;
    console.log(`正在保存B站配置，SESSDATA长度: ${sessdataLength}`);

    // 创建一个安全的配置副本
    const safeConfig = safeClone(config.value);
    console.log("保存的房间ID列表:", JSON.stringify(safeConfig.room_ids));

    const response = await biliLiveStore.saveBiliConfig(safeConfig);

    if (response.success) {
      if (showToast) {
        toast.success("配置保存成功");
      }
      console.log(
        "配置保存成功，当前房间ID列表:",
        JSON.stringify(config.value.room_ids)
      );
    } else {
      toast.error(`保存失败: ${response.error}`);
    }
  } catch (error) {
    console.error("保存配置出错:", error);
    toast.error("保存配置出错");
  } finally {
    isSaving.value = false;
  }
};

// 处理TTS模式变化
async function handleTTSModeChange() {
  try {
    console.log(`[handleTTSModeChange] TTS模式发生变化`);

    // 获取当前选择的模式
    const currentMode = ttsMode.value;
    console.log(`[handleTTSModeChange] 当前选择的模式: ${currentMode}`);

    // 自动保存
    await saveTTSMode(currentMode);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[handleTTSModeChange] 处理TTS模式变化失败:", error);
    toast.error("处理TTS模式变化失败: " + error.message);
  }
}

// 保存TTS模式
async function saveTTSMode(modeToSave?: string) {
  try {
    console.log(`[saveTTSMode] 开始保存TTS模式`);

    // 如果没有传入特定模式，则从store获取
    let currentMode: string;
    if (modeToSave) {
      currentMode = modeToSave;
      console.log(`[saveTTSMode] 使用传入的模式: ${currentMode}`);
    } else {
      currentMode = biliLiveStore.getTTSMode();
      console.log(`[saveTTSMode] 从store获取的当前模式: ${currentMode}`);
    }

    // 也检查computed的值用于调试
    const computedMode = ttsMode.value;
    console.log(`[saveTTSMode] computed ttsMode.value: ${computedMode}`);

    console.log(`[saveTTSMode] 正在保存TTS模式: ${currentMode}`);

    const response = await biliLiveStore.saveTTSMode(currentMode);
    if (response.success) {
      // 后端返回的data就是保存的模式字符串
      const savedMode = response.data || currentMode;
      toast.success(`TTS模式已切换为: ${savedMode}`);
      console.log(`[saveTTSMode] TTS模式保存成功: ${savedMode}`);
      console.log(`[saveTTSMode] 响应数据:`, response.data);
    } else {
      toast.error("保存TTS模式失败: " + response.error);
      console.error("[saveTTSMode] 保存TTS模式失败:", response.error);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[saveTTSMode] Failed to save TTS mode:", error);
    toast.error("保存TTS模式失败: " + error.message);
  }
}

// 保存Azure配置（更新为使用settings store）
async function saveAzureConfig() {
  try {
    // 从表单值更新settings store
    const currentConfig = settingsStore.getTTSProviderConfig("azure") || {};
    const updatedConfig = {
      ...currentConfig,
      key: azureConfig.value.azure_key,
      region: azureConfig.value.azure_region,
      voiceName: azureConfig.value.azure_model,
      enabled: ttsMode.value === "azure",
    };
    console.log("updatedConfig:", updatedConfig);

    // 创建一个安全的配置副本
    const safeAzureConfig = safeClone(azureConfig.value);

    // 同时更新BiliLive服务
    const response = await biliLiveStore.saveAzureConfig(safeAzureConfig);
    if (response.success) {
      toast.success("Azure TTS配置已保存");
    } else {
      toast.error("保存Azure配置失败: " + response.error);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to save Azure config:", error);
    toast.error("保存Azure配置失败: " + error.message);
  }
}

// 保存阿里云配置
async function saveAlibabaConfig() {
  try {
    // 创建一个安全的配置副本
    const safeConfig = safeClone(alibabaConfig.value);

    const response = await biliLiveStore.saveAlibabaConfig(safeConfig);
    if (response.success) {
      toast.success("阿里云 TTS配置已保存");
    } else {
      toast.error("保存阿里云配置失败: " + response.error);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to save Alibaba config:", error);
    toast.error("保存阿里云配置失败: " + error.message);
  }
}

// 保存SoVITS配置
async function saveSovitsConfig() {
  try {
    // 创建一个安全的配置副本
    const safeConfig = safeClone(sovitsConfig.value);

    const response = await biliLiveStore.saveSovitsConfig(safeConfig);
    if (response.success) {
      toast.success("SoVITS配置已保存");
    } else {
      toast.error("保存SoVITS配置失败: " + response.error);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to save SoVITS config:", error);
    toast.error("保存SoVITS配置失败: " + error.message);
  }
}

// 测试TTS
async function testTTS() {
  try {
    if (!testText.value) {
      testText.value = "如果你能听到，说明语音配置成功。";
    }

    const response = await biliLiveStore.testTTS(testText.value);
    if (!response.success) {
      toast.error("测试TTS失败: " + response.error);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to test TTS:", error);
    toast.error("测试TTS失败: " + error.message);
  }
}

// 选择历史房间
function selectRoom(room: Room) {
  roomIdInput.value = room.id.toString();
}

// 连接到直播间
async function connectToRoom() {
  if (!roomIdInput.value) {
    toast.warning("请输入房间ID");
    return;
  }

  try {
    // 在尝试连接前就保存房间ID到历史记录（无论成功失败）
    const roomIdStr = String(roomIdInput.value);
    const roomIndex = config.value.room_ids.findIndex(
      (r) => String(r.id) === roomIdStr
    );

    console.log(`尝试连接房间ID ${roomIdStr}，检查是否存在于历史记录`);

    if (roomIndex === -1) {
      // 新房间，添加到历史记录
      console.log(`将房间ID ${roomIdStr} 添加到历史记录`);
      config.value.room_ids.unshift({
        id: roomIdStr,
        name: `房间 ${roomIdStr}`,
      });
      // 限制最多保存10个历史记录
      if (config.value.room_ids.length > 10) {
        config.value.room_ids.pop();
      }
      // 立即保存配置
      await saveConfig(false);
    } else {
      // 已存在的房间，移动到最前面
      console.log(`房间ID ${roomIdStr} 已存在于历史记录，移动到最前面`);
      const existingRoom = config.value.room_ids.splice(roomIndex, 1)[0];
      config.value.room_ids.unshift(existingRoom);
      // 保存配置
      await saveConfig(false);
    }

    // 尝试连接
    const response = await biliLiveStore.connect(roomIdInput.value);
    if (!response.success) {
      toast.error("连接失败: " + response.error);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Connect failed:", error);
    toast.error("连接失败: " + error.message);
  }
}

/**
 * 断开连接
 * @param {string} reason 断开原因（可选）
 */
async function disconnect(reason = "用户手动断开") {
  try {
    // Store the current room ID before disconnecting
    if (currentRoomId.value) {
      lastConnectionRoomId.value = currentRoomId.value;
    }

    // Add log message with reason
    console.log(`正在断开直播间连接: ${reason}`);

    // Add system message with disconnect reason
    addSystemMessage("info", `正在断开直播间连接: ${reason}`);

    const response = await biliLiveStore.disconnect();
    if (!response.success) {
      toast.error("断开连接失败: " + response.error);
    }
  } catch (err) {
    const error = err as Error;
    console.error("Disconnect failed:", error);
    toast.error("断开连接失败: " + error.message);
  }
}

// Watch connection status to update lastConnectionRoomId
watch(
  () => isConnected.value,
  (newStatus, oldStatus) => {
    if (oldStatus && !newStatus && currentRoomId.value) {
      // If we just disconnected, save the last room ID
      lastConnectionRoomId.value = currentRoomId.value;
    }
  }
);

// 添加系统消息
function addSystemMessage(
  type: "info" | "warning" | "error" | "notice",
  content: string
) {
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
function addDanmakuMessage(data: DanmakuMessage) {
  messages.value.danmaku.unshift(data);
  if (messages.value.danmaku.length > 100) {
    messages.value.danmaku.pop();
  }
}

// 添加礼物消息
function addGiftMessage(data: GiftMessage) {
  messages.value.gift.unshift(data);
  if (messages.value.gift.length > 100) {
    messages.value.gift.pop();
  }
}

// 添加点赞消息
function addLikeMessage(data: LikeMessage) {
  messages.value.like.unshift(data);
  if (messages.value.like.length > 100) {
    messages.value.like.pop();
  }
}

// 添加进场消息
function addEnterMessage(data: EnterMessage) {
  messages.value.enter.unshift(data);
  if (messages.value.enter.length > 100) {
    messages.value.enter.pop();
  }
}

// Add debug message
function addDebugMessage(data: any) {
  // Add message to debug list
  messages.value.debug.unshift({
    cmd: data.cmd || "UNKNOWN",
    data: data,
    timestamp: Date.now(),
  });

  // Limit debug messages to avoid performance issues
  if (messages.value.debug.length > 200) {
    messages.value.debug.pop();
  }
}

// IPC 监听器
function setupListeners() {
  // 使用类型断言处理 electron API
  const electron = window.electron as unknown as {
    listenToChannel: (channel: string, callback: (data: any) => void) => void;
    removeListener: (channel: string) => void;
  };

  // 连接状态
  electron.listenToChannel("bililive-connection-status", (data: any) => {
    isConnected.value = data.connected;

    if (data.connected) {
      // Update current room ID if connected
      currentRoomId.value = data.roomId;

      // 连接成功时显示通知
      toast.success(`已连接到房间: ${data.roomId}`);
      console.log(`连接状态：已连接到房间 ${data.roomId}`);
    } else {
      // 如果断开连接，更新最后连接的房间ID并清除当前房间ID
      if (currentRoomId.value) {
        lastConnectionRoomId.value = currentRoomId.value;
      }
      currentRoomId.value = null;

      // 不再显示额外的断开连接通知，避免重复
      console.log("连接状态：已断开连接");
    }
  });

  // 人气值
  electron.listenToChannel("bililive-popularity", (data: number) => {
    popularity.value = data;
  });

  // 弹幕
  electron.listenToChannel("bililive-danmaku", (data: DanmakuMessage) => {
    console.log("Received danmaku:", data);
    addDanmakuMessage(data);
  });

  // 礼物
  electron.listenToChannel("bililive-gift", (data: GiftMessage) => {
    addGiftMessage(data);
  });

  // 点赞
  electron.listenToChannel("bililive-like", (data: LikeMessage) => {
    addLikeMessage(data);
  });

  // 进场
  electron.listenToChannel("bililive-enter", (data: EnterMessage) => {
    addEnterMessage(data);
  });

  // 系统消息
  electron.listenToChannel(
    "bililive-message",
    (data: {
      type: "info" | "warning" | "error" | "notice";
      content: string;
    }) => {
      // 将所有系统消息添加到消息历史列表中
      addSystemMessage(data.type, data.content);

      // 过滤掉一些会导致重复通知的消息类型
      const shouldSkipToast = (content: string) => {
        // 跳过已经在其它地方处理过的连接状态消息
        if (
          content.includes("Connection") ||
          content.includes("连接") ||
          content.includes("WebSocket") ||
          content.includes("room")
        ) {
          return true;
        }
        return false;
      };

      // 根据消息类型选择性地显示toast通知
      if (!shouldSkipToast(data.content)) {
        switch (data.type) {
          case "info":
            toast.info(data.content);
            break;
          case "warning":
            toast.warning(data.content);
            break;
          case "error":
            toast.error(data.content);
            break;
          case "notice":
            toast.info(data.content);
            break;
          default:
            toast.info(data.content);
        }
      }
    }
  );

  // TTS状态（正在播放）
  electron.listenToChannel(
    "bililive-tts-status",
    (data: { speaking: boolean; text: string }) => {
      // 可以显示当前正在播放的语音内容
      if (data.speaking && data.text) {
        console.log("Speaking:", data.text);
      }
    }
  );

  // 新增: 原始消息监听（用于调试）
  electron.listenToChannel("bililive-raw-message", (data: any) => {
    console.log("Received raw message:", data);
    addDebugMessage(data);
  });

  // 新增: 调试消息监听
  electron.listenToChannel("bililive-debug-message", (data: any) => {
    console.log("Received debug message:", data);
    addDebugMessage(data);
  });
}

// 移除监听器
function removeListeners() {
  // 使用类型断言处理 electron API
  const electron = window.electron as unknown as {
    listenToChannel: (channel: string, callback: (data: any) => void) => void;
    removeListener: (channel: string) => void;
  };

  electron.removeListener("bililive-connection-status");
  electron.removeListener("bililive-popularity");
  electron.removeListener("bililive-danmaku");
  electron.removeListener("bililive-gift");
  electron.removeListener("bililive-like");
  electron.removeListener("bililive-enter");
  electron.removeListener("bililive-message");
  electron.removeListener("bililive-tts-status");
  electron.removeListener("bililive-raw-message");
  electron.removeListener("bililive-debug-message");
}

onMounted(async () => {
  try {
    // 加载配置
    await loadConfig();

    // 设置监听器
    setupListeners();

    // toast.success("Bili直播弹幕助手已加载");
  } catch (err: unknown) {
    const error = err as Error;
    console.error("初始化失败:", error);
    toast.error("初始化失败: " + error.message);
  }
});

onUnmounted(() => {
  // Check if connected and disconnect when navigating away
  if (isConnected.value) {
    // Use the reason parameter to indicate it's due to navigation
    disconnect("页面导航");
  }

  // Remove all event listeners to prevent memory leaks
  removeListeners();
});

// Additional methods for local TTS
async function saveLocalConfig() {
  try {
    // 这里传一个空字符串，因为方法需要的是string类型参数
    const response = await biliLiveStore.saveLocalConfig("");
    if (response.success) {
      toast.success("本地TTS配置已保存");
    } else {
      toast.error("保存本地TTS配置失败: " + response.error);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Failed to save local config:", error);
    toast.error("保存本地TTS配置失败: " + error.message);
  }
}

// Additional methods for debugging
function clearDebugMessages() {
  messages.value.debug = [];
  toast.success("调试消息已清空");
}

// Add route navigation guard
onBeforeRouteLeave((to, from, next) => {
  if (isConnected.value) {
    const confirmLeave = window.confirm(
      "你当前正在连接直播间，离开页面会自动断开连接。确定要离开吗？"
    );

    if (confirmLeave) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});
</script>

<style scoped>
/* 定义一些边框、颜色等样式 */
</style>
