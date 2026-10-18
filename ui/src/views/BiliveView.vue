<template>
  <div class="flex h-full flex-col">
    <!-- 顶部连接条 -->
    <header class="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-5">
      <div class="flex min-w-0 items-center gap-3">
        <BilibiliIcon class="h-5 w-5 shrink-0 text-ink-muted" />
        <h1 class="text-sm font-semibold text-ink">直播助手</h1>
        <VBadge v-if="isConnected" tone="live" dot pulse>LIVE · {{ currentRoomId }}</VBadge>
        <VBadge v-else-if="lastConnectionRoomId" tone="neutral">已断开 · 上次 {{ lastConnectionRoomId }}</VBadge>
        <VBadge v-else tone="neutral">未连接</VBadge>
        <span v-if="isConnected" class="flex items-center gap-1 text-xs text-ink-muted" title="人气值">
          <FireIcon class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="num">{{ popularity.toLocaleString() }}</span>
        </span>
      </div>

      <form class="ml-auto flex items-center gap-2" @submit.prevent="isConnected ? disconnect() : connectToRoom()">
        <VInput
          v-model="roomIdInput"
          size="sm"
          mono
          placeholder="直播间 ID"
          aria-label="直播间 ID"
          wrapper-class="w-40"
          :disabled="isConnected"
          inputmode="numeric"
        />
        <VButton v-if="isConnected" type="submit" variant="danger" size="sm" :icon="StopIcon">断开</VButton>
        <VButton v-else type="submit" variant="primary" size="sm" :icon="SignalIcon" :disabled="!roomIdInput">连接</VButton>
      </form>
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- 消息流 -->
      <section class="flex min-w-0 flex-1 flex-col">
        <div class="flex h-10 shrink-0 items-center gap-1 border-b border-line px-3" role="tablist" aria-label="消息类型">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="tab"
            :class="currentTab === tab.id && 'tab-active'"
            :aria-selected="currentTab === tab.id"
            @click="currentTab = tab.id"
          >
            {{ tab.name }}
            <span v-if="messages[tab.id].length" class="num ml-1 text-2xs text-ink-subtle">{{ messages[tab.id].length }}</span>
          </button>
          <VIconButton
            class="ml-auto"
            :icon="TrashIcon"
            label="清空当前列表"
            size="sm"
            :disabled="!messages[currentTab].length"
            @click="clearCurrent"
          />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <VEmptyState
            v-if="!messages[currentTab].length"
            :icon="currentTabMeta.icon"
            :title="`暂无${currentTabMeta.name}消息`"
            :description="isConnected ? '新消息会实时出现在这里，最新的在最上方。' : '在右上角输入直播间 ID 并连接后开始接收。'"
          />

          <ul v-else-if="currentTab === 'danmaku'" class="divide-y divide-line/60">
            <li v-for="(msg, index) in messages.danmaku" :key="index" class="list-row items-start gap-3 py-2">
              <span class="w-28 shrink-0 truncate text-xs font-medium" :class="roleTone(msg.uname).text">{{ msg.uname }}</span>
              <span class="min-w-0 flex-1 break-words text-sm text-ink">{{ msg.msg }}</span>
            </li>
          </ul>

          <ul v-else-if="currentTab === 'gift'" class="divide-y divide-line/60">
            <li v-for="(msg, index) in messages.gift" :key="index" class="list-row gap-3 py-2">
              <GiftIcon class="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <span class="truncate text-xs font-medium text-ink">{{ msg.uname }}</span>
              <span class="text-sm text-ink-muted">赠送 <span class="num text-ink">{{ msg.num }}</span> 个 {{ msg.giftName }}</span>
            </li>
          </ul>

          <ul v-else-if="currentTab === 'like'" class="divide-y divide-line/60">
            <li v-for="(msg, index) in messages.like" :key="index" class="list-row gap-3 py-2">
              <HeartIcon class="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span class="truncate text-xs font-medium text-ink">{{ msg.uname }}</span>
              <span class="text-sm text-ink-muted">{{ msg.text }}</span>
            </li>
          </ul>

          <ul v-else-if="currentTab === 'enter'" class="divide-y divide-line/60">
            <li v-for="(msg, index) in messages.enter" :key="index" class="list-row gap-3 py-2">
              <ArrowRightEndOnRectangleIcon class="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <span class="truncate text-xs font-medium text-ink">{{ msg.uname }}</span>
              <span class="text-sm text-ink-muted">进入直播间</span>
              <VBadge v-if="msg.medalLevel > 0" tone="accent">粉丝牌 {{ msg.medalLevel }}</VBadge>
            </li>
          </ul>

          <ul v-else-if="currentTab === 'system'" class="divide-y divide-line/60">
            <li v-for="(msg, index) in messages.system" :key="index" class="list-row items-start gap-3 py-2">
              <VBadge :tone="systemTone[msg.type].tone" class="mt-0.5 shrink-0">{{ systemTone[msg.type].label }}</VBadge>
              <span class="min-w-0 flex-1 break-words text-sm text-ink">{{ msg.content }}</span>
              <time class="num shrink-0 text-2xs text-ink-subtle">{{ new Date(msg.timestamp).toLocaleTimeString() }}</time>
            </li>
          </ul>
        </div>
      </section>

      <!-- 配置面板 -->
      <aside class="w-[340px] shrink-0 overflow-y-auto border-l border-line bg-surface" aria-label="直播助手设置">
        <!-- 连接 -->
        <section class="space-y-3 border-b border-line p-4">
          <h2 class="section-title">连接</h2>
          <div>
            <p class="field-label">最近房间</p>
            <div v-if="config.room_ids.length" class="flex flex-wrap gap-1.5">
              <button
                v-for="room in config.room_ids"
                :key="room.id"
                type="button"
                class="badge num cursor-pointer hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                :class="String(room.id) === roomIdInput && 'badge-accent'"
                :disabled="isConnected"
                @click="selectRoom(room)"
              >
                {{ room.id }}
              </button>
            </div>
            <p v-else class="text-xs text-ink-subtle">连接过的房间会出现在这里。</p>
          </div>
          <div>
            <div class="mb-1 flex items-center justify-between">
              <label for="sessdata" class="field-label mb-0">SESSDATA（可选）</label>
              <button type="button" class="text-2xs text-ink-subtle hover:text-ink" @click="showSessdataHelp = !showSessdataHelp">
                {{ showSessdataHelp ? "收起说明" : "如何获取？" }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                id="sessdata"
                v-model="config.SESSDATA"
                :type="showSessdata ? 'text' : 'password'"
                class="field field-sm font-mono"
                placeholder="B 站 Cookie 中的 SESSDATA"
                autocomplete="off"
                @change="saveConfig(false)"
              />
              <VIconButton :icon="showSessdata ? EyeSlashIcon : EyeIcon" :label="showSessdata ? '隐藏' : '显示'" size="sm" @click="showSessdata = !showSessdata" />
            </div>
            <div v-if="showSessdataHelp" class="mt-2 rounded-md bg-soft p-3 text-xs leading-5 text-ink-muted">
              <ol class="list-inside list-decimal space-y-0.5">
                <li>登录 B 站网页版，按 F12 打开开发者工具</li>
                <li>进入 Application（应用）→ Cookies → live.bilibili.com</li>
                <li>复制名为 SESSDATA 的值并粘贴到这里</li>
              </ol>
              <p class="mt-1.5">不填也能连接，但看不到完整的用户名。</p>
            </div>
          </div>
        </section>

        <!-- 语音播报 -->
        <section class="space-y-4 border-b border-line p-4">
          <div class="flex items-center justify-between">
            <h2 class="section-title">语音播报</h2>
            <VSwitch v-model="config.ttsEnabled" label="启用语音播报" @update:model-value="saveConfig(false)" />
          </div>

          <div :class="!config.ttsEnabled && 'pointer-events-none opacity-50'" class="space-y-4">
            <div>
              <p class="field-label">播报内容</p>
              <div class="flex flex-wrap gap-1.5">
                <ToggleChip v-for="item in readOptions" :key="item.key" v-model="config[item.key]" @update:model-value="saveConfig(false)">
                  {{ item.label }}
                </ToggleChip>
              </div>
            </div>

            <div>
              <p class="field-label">语音引擎</p>
              <VSegmented v-model="ttsMode" :options="engineOptions" label="语音引擎" size="sm" block />
            </div>

            <div v-if="ttsMode === 'cloud'" class="space-y-2">
              <VoiceSelect v-model="cloudVoiceId" label="官网音色" size="sm" placeholder="请选择音色" />
              <VButton size="sm" :disabled="!cloudVoiceId" @click="saveCloudVoice">保存音色</VButton>
            </div>

            <div v-else-if="ttsMode === 'sovits'" class="space-y-3">
              <VInput v-model="sovitsConfig.sovits_host" label="API 地址" size="sm" mono placeholder="http://127.0.0.1:5000/tts" />
              <div class="grid grid-cols-2 gap-2">
                <VInput v-model="sovitsConfig.sovits_model" label="模型" size="sm" />
                <VSelect v-model="sovitsConfig.sovits_language" label="语言" size="sm" :options="languageOptions" />
              </div>
              <VSlider v-model="sovitsSpeed" label="语速" :min="0.5" :max="2" :step="0.1" unit="x" :default-value="1" />
              <VButton size="sm" @click="saveSovitsConfig">保存 SoVITS 配置</VButton>
            </div>

            <p
              v-else-if="localChineseSupport"
              class="rounded-md px-3 py-2 text-xs"
              :class="localChineseSupport.supported ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'"
            >
              <template v-if="localChineseSupport.supported">
                已检测到中文语音{{ localChineseSupport.voiceName ? `（${localChineseSupport.voiceName}）` : "" }}，无需额外配置。
              </template>
              <template v-else>未检测到中文语音。请在系统「设置 → 时间和语言 → 语音」中安装中文语音包。</template>
            </p>
            <p v-else class="text-xs text-ink-subtle">使用系统自带语音，无需配置。</p>

            <div>
              <label for="tts-test" class="field-label">试听</label>
              <div class="flex gap-2">
                <input id="tts-test" v-model="testText" class="field field-sm" placeholder="输入一句测试文本" @keydown.enter="testTTS" />
                <VButton size="sm" :icon="SpeakerWaveIcon" @click="testTTS">试听</VButton>
              </div>
            </div>
          </div>
        </section>

        <!-- 数据记录 -->
        <section class="space-y-3 p-4">
          <h2 class="section-title">数据记录</h2>
          <div class="flex flex-wrap gap-1.5">
            <ToggleChip v-for="item in recordOptions" :key="item.key" v-model="config[item.key]" @update:model-value="saveConfig(false)">
              {{ item.label }}
            </ToggleChip>
          </div>
          <p class="text-xs text-ink-subtle">开关会立即保存。</p>
        </section>
      </aside>
    </div>

    <VConfirmDialog
      :open="!!pendingLeave"
      title="离开直播助手？"
      message="当前仍连接着直播间，离开页面会自动断开连接。"
      confirm-text="断开并离开"
      @close="pendingLeave = null"
      @confirm="confirmLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch, type Component } from "vue";
import { onBeforeRouteLeave, useRouter, type RouteLocationNormalized } from "vue-router";
import { useToast } from "vue-toastification";
import {
  ArrowRightEndOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  FireIcon,
  GiftIcon,
  HeartIcon,
  InformationCircleIcon,
  SignalIcon,
  SpeakerWaveIcon,
  StopIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import BilibiliIcon from "@/components/icon/bilibili.vue";
import VoiceSelect from "@/components/projects/VoiceSelect.vue";
import VBadge from "@/components/ui/VBadge.vue";
import VButton from "@/components/ui/VButton.vue";
import VConfirmDialog from "@/components/ui/VConfirmDialog.vue";
import VEmptyState from "@/components/ui/VEmptyState.vue";
import VIconButton from "@/components/ui/VIconButton.vue";
import VInput from "@/components/ui/VInput.vue";
import VSegmented from "@/components/ui/VSegmented.vue";
import VSelect from "@/components/ui/VSelect.vue";
import VSlider from "@/components/ui/VSlider.vue";
import VSwitch from "@/components/ui/VSwitch.vue";
import { useBiliLiveStore } from "@/stores/biliLive";
import { roleTone } from "@/utils/roleColor";
import type { BiliLiveConfig, SoVITSConfig } from "@/services/BiliLiveService";

type TabId = "danmaku" | "gift" | "like" | "enter" | "system";
type SystemType = "info" | "warning" | "error" | "notice";
type BoolKey = "readDanmaku" | "readGift" | "readEnter" | "readLike" | "recordDanmaku" | "recordGift" | "recordVisitor";
type TtsMode = "local" | "cloud" | "sovits";

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
  type: SystemType;
  content: string;
  timestamp: number;
}

const ToggleChip = defineComponent({
  props: { modelValue: { type: Boolean, default: false } },
  emits: ["update:modelValue"],
  setup(props, { emit, slots }) {
    return () =>
      h(
        "button",
        {
          type: "button",
          "aria-pressed": props.modelValue,
          class: [
            "inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs transition-colors duration-fast",
            props.modelValue
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
          ],
          onClick: () => emit("update:modelValue", !props.modelValue),
        },
        [props.modelValue ? h(CheckIcon, { class: "h-3.5 w-3.5", "aria-hidden": "true" }) : null, slots.default?.()]
      );
  },
});

const MAX_MESSAGES = 100;
const toast = useToast();
const router = useRouter();
const biliLiveStore = useBiliLiveStore();

const roomIdInput = ref("");
const isConnected = ref(false);
const currentRoomId = ref<string | null>(null);
const lastConnectionRoomId = ref<string | null>(null);
const popularity = ref(0);
const testText = ref("如果你能听到，说明语音配置成功。");
const showSessdataHelp = ref(false);
const showSessdata = ref(false);
const localChineseSupport = ref<{ supported: boolean; voiceName?: string } | null>(null);
const pendingLeave = ref<RouteLocationNormalized | null>(null);
let leaveConfirmed = false;

const messages = ref({
  danmaku: [] as DanmakuMessage[],
  gift: [] as GiftMessage[],
  like: [] as LikeMessage[],
  enter: [] as EnterMessage[],
  system: [] as SystemMessage[],
});

const tabs: { id: TabId; name: string; icon: Component }[] = [
  { id: "danmaku", name: "弹幕", icon: ChatBubbleLeftRightIcon },
  { id: "gift", name: "礼物", icon: GiftIcon },
  { id: "like", name: "点赞", icon: HeartIcon },
  { id: "enter", name: "进场", icon: ArrowRightEndOnRectangleIcon },
  { id: "system", name: "系统", icon: InformationCircleIcon },
];
const currentTab = ref<TabId>("danmaku");
const currentTabMeta = computed(() => tabs.find((t) => t.id === currentTab.value) || tabs[0]);

const systemTone: Record<SystemType, { tone: "info" | "warning" | "danger" | "accent"; label: string }> = {
  info: { tone: "info", label: "信息" },
  warning: { tone: "warning", label: "警告" },
  error: { tone: "danger", label: "错误" },
  notice: { tone: "accent", label: "通知" },
};

const readOptions: { key: BoolKey; label: string }[] = [
  { key: "readDanmaku", label: "弹幕" },
  { key: "readGift", label: "礼物" },
  { key: "readEnter", label: "进场" },
  { key: "readLike", label: "点赞" },
];
const recordOptions: { key: BoolKey; label: string }[] = [
  { key: "recordDanmaku", label: "弹幕" },
  { key: "recordGift", label: "礼物" },
  { key: "recordVisitor", label: "访客" },
];
const engineOptions: { label: string; value: TtsMode }[] = [
  { label: "系统语音", value: "local" },
  { label: "官网音色", value: "cloud" },
  { label: "SoVITS", value: "sovits" },
];
const languageOptions = [
  { label: "自动检测", value: "auto" },
  { label: "中文", value: "zh" },
  { label: "英文", value: "en" },
  { label: "日文", value: "ja" },
];
const engineNames: Record<TtsMode, string> = { local: "系统语音", cloud: "官网音色", sovits: "SoVITS" };

const config = ref<BiliLiveConfig>({
  room_ids: [],
  ttsEnabled: true,
  readDanmaku: true,
  readGift: true,
  readEnter: true,
  readLike: true,
  SESSDATA: "",
  recordDanmaku: true,
  recordGift: true,
  recordVisitor: true,
});

const sovitsConfig = ref<SoVITSConfig>({
  sovits_host: "http://127.0.0.1:5000/tts",
  sovits_model: "",
  sovits_language: "auto",
  sovits_speed: "1.0",
});
const sovitsSpeed = computed({
  get: () => Number(sovitsConfig.value.sovits_speed) || 1,
  set: (value: number) => (sovitsConfig.value.sovits_speed = value.toFixed(1)),
});

const cloudVoiceId = ref("");

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function safeClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const ttsMode = computed<TtsMode>({
  get: () => {
    const mode = biliLiveStore.getTTSMode();
    return mode === "cloud" || mode === "sovits" ? mode : "local";
  },
  set: (value) => {
    biliLiveStore
      .saveTTSMode(value)
      .then(async (response) => {
        if (response.success) {
          if (value === "local") await fetchLocalChineseSupport();
          toast.success(`语音引擎已切换为：${engineNames[value]}`);
        } else {
          toast.error(`切换失败：${response.error}`);
        }
      })
      .catch((error) => toast.error(`切换失败：${errorText(error)}`));
  },
});

async function loadConfig() {
  try {
    const response = await (window.api as any).biliLive.getConfig();
    if (!response.success || !response.data) {
      addSystemMessage("error", `加载配置失败：${response.error || "未知错误"}`);
      return;
    }
    const data = response.data;
    config.value.room_ids = (data.room_ids || []).map((room: any) => ({
      id: String(room.id),
      name: room.name || `房间 ${room.id}`,
    }));
    config.value.ttsEnabled = data.ttsEnabled ?? true;
    config.value.readDanmaku = data.readDanmaku ?? true;
    config.value.readGift = data.readGift ?? true;
    config.value.readEnter = data.readEnter ?? true;
    config.value.readLike = data.readLike ?? true;
    config.value.SESSDATA = data.SESSDATA ?? "";
    config.value.recordDanmaku = data.recordDanmaku ?? true;
    config.value.recordGift = data.recordGift ?? true;
    config.value.recordVisitor = data.recordVisitor ?? true;
    if (data.tts) (config.value as any).tts = data.tts;

    const mode = data.tts?.mode;
    biliLiveStore.setTTSModeLocal(["local", "cloud", "sovits"].includes(mode) ? mode : "local");
    if (data.tts?.sovits) sovitsConfig.value = data.tts.sovits;
    cloudVoiceId.value = data.tts?.cloud?.voiceId || "";
  } catch (error) {
    addSystemMessage("error", `加载配置失败：${errorText(error)}`);
  }
}

async function saveConfig(showToast = true) {
  try {
    const tts = ((config.value as any).tts ||= {});
    tts.mode = biliLiveStore.getTTSMode();
    const response = await biliLiveStore.saveBiliConfig(safeClone(config.value));
    if (!response.success) toast.error(`保存失败：${response.error}`);
    else if (showToast) toast.success("配置已保存");
  } catch (error) {
    toast.error(`保存配置出错：${errorText(error)}`);
  }
}

async function saveCloudVoice() {
  const tts = ((config.value as any).tts ||= {});
  tts.mode = "cloud";
  tts.cloud = { voiceId: cloudVoiceId.value };
  const result = await window.electron.invoke("bililive:get-config");
  const latest = result?.data || {};
  latest.tts = { ...(latest.tts || {}), mode: "cloud", cloud: { voiceId: cloudVoiceId.value } };
  const saved = await window.electron.invoke("bililive:save-bili-config", latest);
  if (saved?.success === false) toast.error(`保存失败：${saved.error || "未知错误"}`);
  else toast.success("官网音色已保存");
}

async function saveSovitsConfig() {
  try {
    const response = await biliLiveStore.saveSovitsConfig(safeClone(sovitsConfig.value));
    if (response.success) toast.success("SoVITS 配置已保存");
    else toast.error(`保存失败：${response.error}`);
  } catch (error) {
    toast.error(`保存失败：${errorText(error)}`);
  }
}

async function testTTS() {
  if (!testText.value) testText.value = "如果你能听到，说明语音配置成功。";
  try {
    const response = await biliLiveStore.testTTS(testText.value);
    if (!response.success) toast.error(`试听失败：${response.error}`);
  } catch (error) {
    toast.error(`试听失败：${errorText(error)}`);
  }
}

function selectRoom(room: Room) {
  roomIdInput.value = String(room.id);
}

async function connectToRoom() {
  const roomId = roomIdInput.value.trim();
  if (!roomId) {
    toast.warning("请输入房间 ID");
    return;
  }
  try {
    const index = config.value.room_ids.findIndex((r) => String(r.id) === roomId);
    const room = index === -1 ? { id: roomId, name: `房间 ${roomId}` } : config.value.room_ids.splice(index, 1)[0];
    config.value.room_ids.unshift(room);
    config.value.room_ids = config.value.room_ids.slice(0, 10);
    await saveConfig(false);

    const response = await biliLiveStore.connect(roomId);
    if (!response.success) toast.error(`连接失败：${response.error}`);
  } catch (error) {
    toast.error(`连接失败：${errorText(error)}`);
  }
}

async function disconnect(reason = "用户手动断开") {
  try {
    if (currentRoomId.value) lastConnectionRoomId.value = currentRoomId.value;
    addSystemMessage("info", `正在断开直播间连接：${reason}`);
    const response = await biliLiveStore.disconnect();
    if (!response.success) toast.error(`断开连接失败：${response.error}`);
  } catch (error) {
    toast.error(`断开连接失败：${errorText(error)}`);
  }
}

function push<T>(list: T[], item: T) {
  list.unshift(item);
  if (list.length > MAX_MESSAGES) list.pop();
}

function addSystemMessage(type: SystemType, content: string) {
  push(messages.value.system, { type, content, timestamp: Date.now() });
}

function clearCurrent() {
  messages.value[currentTab.value] = [];
}

watch(isConnected, (now, before) => {
  if (before && !now && currentRoomId.value) lastConnectionRoomId.value = currentRoomId.value;
});

type ChannelApi = {
  listenToChannel: (channel: string, callback: (data: any) => void) => void;
  removeListener: (channel: string) => void;
};
const channels = [
  "bililive-connection-status",
  "bililive-popularity",
  "bililive-danmaku",
  "bililive-gift",
  "bililive-like",
  "bililive-enter",
  "bililive-message",
  "bililive-tts-status",
  "bililive-raw-message",
  "bililive-debug-message",
];

function setupListeners() {
  const electron = window.electron as unknown as ChannelApi;

  electron.listenToChannel("bililive-connection-status", (data: any) => {
    isConnected.value = data.connected;
    if (data.connected) {
      currentRoomId.value = String(data.roomId);
      toast.success(`已连接到房间 ${data.roomId}`);
    } else {
      if (currentRoomId.value) lastConnectionRoomId.value = currentRoomId.value;
      currentRoomId.value = null;
    }
  });
  electron.listenToChannel("bililive-popularity", (data: number) => (popularity.value = data));
  electron.listenToChannel("bililive-danmaku", (data: DanmakuMessage) => push(messages.value.danmaku, data));
  electron.listenToChannel("bililive-gift", (data: GiftMessage) => push(messages.value.gift, data));
  electron.listenToChannel("bililive-like", (data: LikeMessage) => push(messages.value.like, data));
  electron.listenToChannel("bililive-enter", (data: EnterMessage) => push(messages.value.enter, data));
  electron.listenToChannel("bililive-message", (data: { type: SystemType; content: string }) => {
    addSystemMessage(data.type, data.content);
    const duplicated = ["Connection", "连接", "WebSocket", "room"].some((word) => data.content.includes(word));
    if (duplicated) return;
    if (data.type === "warning") toast.warning(data.content);
    else if (data.type === "error") toast.error(data.content);
    else toast.info(data.content);
  });
}

function removeListeners() {
  const electron = window.electron as unknown as ChannelApi;
  channels.forEach((channel) => electron.removeListener(channel));
}

async function fetchLocalChineseSupport() {
  if (ttsMode.value !== "local") return;
  try {
    const api = (window as any).electron?.biliLive;
    if (!api?.checkChineseSupport) return;
    const res = await api.checkChineseSupport();
    localChineseSupport.value = res?.success && res.data ? res.data : { supported: false };
  } catch {
    localChineseSupport.value = null;
  }
}

onMounted(async () => {
  try {
    await loadConfig();
    setupListeners();
    await fetchLocalChineseSupport();
  } catch (error) {
    toast.error(`初始化失败：${errorText(error)}`);
  }
});

onUnmounted(() => {
  if (isConnected.value) disconnect("页面导航");
  removeListeners();
});

onBeforeRouteLeave((to) => {
  if (!isConnected.value || leaveConfirmed) return true;
  pendingLeave.value = to;
  return false;
});

function confirmLeave() {
  const target = pendingLeave.value;
  pendingLeave.value = null;
  if (!target) return;
  leaveConfirmed = true;
  router.push(target.fullPath);
}
</script>
