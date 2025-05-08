import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { biliLiveService } from "@/services";
import type {
  BiliLiveConfig,
  AzureConfig,
  AlibabaConfig,
  SoVITSConfig,
} from "@/services/BiliLiveService";
import { useToast } from "vue-toastification";

// 消息类型定义
export interface DanmakuMessage {
  uid: number;
  uname: string;
  msg: string;
  timestamp: number;
  isAdmin?: boolean;
  medal?: {
    level: number;
    name: string;
  };
}

export interface GiftMessage {
  uid: number;
  uname: string;
  giftId: number;
  giftName: string;
  num: number;
  price: number;
  timestamp: number;
}

export interface LikeMessage {
  uid: number;
  uname: string;
  text: string;
  timestamp: number;
}

export interface EnterMessage {
  uid: number;
  uname: string;
  medalLevel: number;
  timestamp: number;
}

export interface SystemMessage {
  type: "info" | "warning" | "error" | "notice";
  content: string;
  timestamp: number;
}

/**
 * B站直播状态管理
 */
export const useBiliLiveStore = defineStore("biliLive", () => {
  // 获取Toast实例用于消息提示
  const toast = useToast();

  // 状态
  const isConnected = ref(false);
  const currentRoomId = ref<string | number | null>(null);
  const popularity = ref(0);
  const isLoading = ref(false);
  const lastError = ref<string | null>(null);

  // 消息列表
  const danmakuMessages = ref<DanmakuMessage[]>([]);
  const giftMessages = ref<GiftMessage[]>([]);
  const likeMessages = ref<LikeMessage[]>([]);
  const enterMessages = ref<EnterMessage[]>([]);
  const systemMessages = ref<SystemMessage[]>([]);

  // 配置
  const config = ref<BiliLiveConfig | null>(null);
  const ttsMode = ref<string>("local");

  // TTS配置
  const azureConfig = ref<AzureConfig>({
    azure_key: "",
    azure_region: "",
    azure_model: "",
    speed: 1.0,
    pitch: 0,
  });

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

  // 计算属性
  const isServiceEnabled = computed(() => {
    return !!config.value?.ttsEnabled;
  });

  /**
   * 错误处理工具函数
   * @param error 捕获的错误
   * @param defaultMessage 默认错误消息
   */
  const handleError = (error: unknown, defaultMessage: string) => {
    const errorMessage =
      error instanceof Error ? error.message : defaultMessage;
    console.error(`BiliLive Store Error: ${defaultMessage}`, error);
    lastError.value = errorMessage;
    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  };

  /**
   * 加载配置
   * @returns 配置数据
   */
  async function loadConfig() {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log("正在加载B站直播配置...");
      const response = await biliLiveService.loadConfig();

      if (response.success && response.data) {
        config.value = response.data;
        console.log("B站直播配置加载成功");

        if (response.data.mode) {
          ttsMode.value = response.data.mode;
        }

        if (response.data.azure) {
          azureConfig.value = { ...azureConfig.value, ...response.data.azure };
        }

        if (response.data.alibaba) {
          alibabaConfig.value = {
            ...alibabaConfig.value,
            ...response.data.alibaba,
          };
        }

        if (response.data.sovits) {
          sovitsConfig.value = {
            ...sovitsConfig.value,
            ...response.data.sovits,
          };
        }
      } else {
        console.warn("B站直播配置加载失败:", response.error);
        lastError.value = response.error || "加载配置失败";
      }

      return response.data;
    } catch (error) {
      return handleError(error, "加载配置失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存B站配置
   * @param configData 配置数据
   * @returns 保存结果
   */
  async function saveBiliConfig(configData: Partial<BiliLiveConfig>) {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log("正在保存B站配置...");
      const updatedConfig = { ...config.value, ...configData };

      // 记录SESSDATA长度（不记录具体内容以避免敏感信息泄露）
      const sessdataLength = updatedConfig.SESSDATA
        ? updatedConfig.SESSDATA.length
        : 0;
      console.log(`将要保存的SESSDATA长度: ${sessdataLength}`);

      const response = await biliLiveService.saveBiliConfig(
        updatedConfig as BiliLiveConfig
      );

      if (response.success) {
        config.value = updatedConfig as BiliLiveConfig;
        console.log("B站配置保存成功");
      } else {
        console.warn("B站配置保存失败:", response.error);
        lastError.value = response.error || "保存配置失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "保存配置失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存TTS模式
   * @param mode TTS模式
   * @returns 保存结果
   */
  async function saveTTSMode(mode: string) {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log(`正在保存TTS模式: ${mode}`);
      const response = await biliLiveService.saveTTSMode(mode);

      if (response.success) {
        ttsMode.value = mode;
        console.log(`TTS模式已更新为: ${mode}`);
      } else {
        console.warn("TTS模式保存失败:", response.error);
        lastError.value = response.error || "保存TTS模式失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "保存TTS模式失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存Azure配置
   * @param configData Azure配置
   * @returns 保存结果
   */
  async function saveAzureConfig(configData: Partial<AzureConfig>) {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log("正在保存Azure配置...");
      const updatedConfig = { ...azureConfig.value, ...configData };
      const response = await biliLiveService.saveAzureConfig(updatedConfig);

      if (response.success) {
        azureConfig.value = updatedConfig;
        console.log("Azure配置保存成功");
      } else {
        console.warn("Azure配置保存失败:", response.error);
        lastError.value = response.error || "保存Azure配置失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "保存Azure配置失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存阿里云配置
   * @param configData 阿里云配置
   * @returns 保存结果
   */
  async function saveAlibabaConfig(configData: Partial<AlibabaConfig>) {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log("正在保存阿里云配置...");
      const updatedConfig = { ...alibabaConfig.value, ...configData };
      const response = await biliLiveService.saveAlibabaConfig(updatedConfig);

      if (response.success) {
        alibabaConfig.value = updatedConfig;
        console.log("阿里云配置保存成功");
      } else {
        console.warn("阿里云配置保存失败:", response.error);
        lastError.value = response.error || "保存阿里云配置失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "保存阿里云配置失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存SoVITS配置
   * @param configData SoVITS配置
   * @returns 保存结果
   */
  async function saveSovitsConfig(configData: Partial<SoVITSConfig>) {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log("正在保存SoVITS配置...");
      const updatedConfig = { ...sovitsConfig.value, ...configData };
      const response = await biliLiveService.saveSovitsConfig(updatedConfig);

      if (response.success) {
        sovitsConfig.value = updatedConfig;
        console.log("SoVITS配置保存成功");
      } else {
        console.warn("SoVITS配置保存失败:", response.error);
        lastError.value = response.error || "保存SoVITS配置失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "保存SoVITS配置失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取可用的TTS声音
   * @returns 可用声音列表
   */
  async function refreshVoices() {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log("正在获取可用的TTS声音...");
      const response = await biliLiveService.getAvailableVoices();

      if (response.success) {
        console.log(`获取到${response.data.voices.length || 0}个声音`);
      } else {
        console.warn("获取声音列表失败:", response.error);
        lastError.value = response.error || "获取声音列表失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "获取声音列表失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存本地TTS配置
   * @param voice 声音名称
   * @returns 保存结果
   */
  async function saveLocalConfig(voice: string) {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log(`正在保存本地TTS配置, 声音: ${voice || "默认"}`);
      const response = await biliLiveService.saveLocalConfig(voice);

      if (response.success) {
        if (config.value) {
          config.value.localVoice = voice;
        }
        console.log("本地TTS配置保存成功");
      } else {
        console.warn("本地TTS配置保存失败:", response.error);
        lastError.value = response.error || "保存本地TTS配置失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "保存本地TTS配置失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 连接到直播间
   * @param roomId 房间ID
   * @returns 连接结果
   */
  async function connect(roomId: string | number) {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log(`正在连接到B站直播间 ${roomId}...`);
      const response = await biliLiveService.connect(roomId);

      if (response.success) {
        isConnected.value = true;
        currentRoomId.value = roomId;
        console.log(`已成功连接到直播间 ${roomId}`);
      } else {
        console.warn("连接直播间失败:", response.error);
        lastError.value = response.error || "连接直播间失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "连接直播间失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 断开连接
   * @returns 断开连接结果
   */
  async function disconnect() {
    isLoading.value = true;
    lastError.value = null;

    try {
      console.log("正在断开B站直播连接...");
      const response = await biliLiveService.disconnect();

      if (response.success) {
        isConnected.value = false;
        currentRoomId.value = null;
        console.log("已断开B站直播连接");
      } else {
        console.warn("断开连接失败:", response.error);
        lastError.value = response.error || "断开连接失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "断开连接失败");
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 测试TTS
   * @param text 测试文本
   * @returns 测试结果
   */
  async function testTTS(text: string) {
    lastError.value = null;

    try {
      console.log(`正在测试TTS: "${text}"`);
      const response = await biliLiveService.testTTS(text);

      if (!response.success) {
        console.warn("测试TTS失败:", response.error);
        lastError.value = response.error || "测试TTS失败";
      }

      return response;
    } catch (error) {
      return handleError(error, "测试TTS失败");
    }
  }

  /**
   * 添加弹幕消息
   * @param message 弹幕消息
   */
  function addDanmakuMessage(message: DanmakuMessage) {
    // 确保时间戳存在
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    danmakuMessages.value.unshift(message);

    // 控制消息列表大小
    if (danmakuMessages.value.length > 100) {
      danmakuMessages.value.pop();
    }
  }

  /**
   * 添加礼物消息
   * @param message 礼物消息
   */
  function addGiftMessage(message: GiftMessage) {
    // 确保时间戳存在
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    giftMessages.value.unshift(message);

    // 控制消息列表大小
    if (giftMessages.value.length > 100) {
      giftMessages.value.pop();
    }
  }

  /**
   * 添加点赞消息
   * @param message 点赞消息
   */
  function addLikeMessage(message: LikeMessage) {
    // 确保时间戳存在
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    likeMessages.value.unshift(message);

    // 控制消息列表大小
    if (likeMessages.value.length > 100) {
      likeMessages.value.pop();
    }
  }

  /**
   * 添加入场消息
   * @param message 入场消息
   */
  function addEnterMessage(message: EnterMessage) {
    // 确保时间戳存在
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    enterMessages.value.unshift(message);

    // 控制消息列表大小
    if (enterMessages.value.length > 100) {
      enterMessages.value.pop();
    }
  }

  /**
   * 添加系统消息
   * @param type 消息类型
   * @param content 消息内容
   */
  function addSystemMessage(
    type: "info" | "warning" | "error" | "notice",
    content: string
  ) {
    const message: SystemMessage = {
      type,
      content,
      timestamp: Date.now(),
    };

    systemMessages.value.unshift(message);

    // 控制消息列表大小
    if (systemMessages.value.length > 100) {
      systemMessages.value.pop();
    }

    // 同时显示toast通知
    switch (type) {
      case "info":
        toast.info(content);
        break;
      case "warning":
        toast.warning(content);
        break;
      case "error":
        toast.error(content);
        break;
      case "notice":
        toast.info(content);
        break;
    }
  }

  /**
   * 设置连接状态
   * @param connected 是否已连接
   * @param roomId 房间ID
   */
  function setConnectionStatus(
    connected: boolean,
    roomId: string | number | null
  ) {
    isConnected.value = connected;
    currentRoomId.value = roomId;

    if (connected && roomId) {
      addSystemMessage("info", `已连接到直播间: ${roomId}`);
    } else {
      addSystemMessage("info", "已断开连接");
    }
  }

  /**
   * 设置人气值
   * @param value 人气值
   */
  function setPopularity(value: number) {
    popularity.value = value;
  }

  /**
   * 清空消息
   */
  function clearMessages() {
    danmakuMessages.value = [];
    giftMessages.value = [];
    likeMessages.value = [];
    enterMessages.value = [];
    systemMessages.value = [];
  }

  /**
   * 获取当前TTS模式
   * @returns 当前TTS模式
   */
  function getTTSMode(): string | null {
    if (config.value && config.value.ttsMode) {
      return config.value.ttsMode;
    }

    // 如果没有在内存中找到，尝试从服务获取最新状态
    // console.log("TTS mode not found in memory config, fetching from service");
    return null;
  }

  return {
    // 状态
    isLoading,
    lastError,
    isConnected,
    currentRoomId,
    config,

    // 消息
    danmakuMessages,
    giftMessages,
    likeMessages,
    enterMessages,
    systemMessages,

    // 方法
    loadConfig,
    saveBiliConfig,
    saveTTSMode,
    saveAzureConfig,
    saveAlibabaConfig,
    saveSovitsConfig,
    saveLocalConfig,
    connect,
    disconnect,
    testTTS,
    refreshVoices,
    addDanmakuMessage,
    addGiftMessage,
    addLikeMessage,
    addEnterMessage,
    addSystemMessage,
    setPopularity,
    clearMessages,
    getTTSMode,
  };
});
