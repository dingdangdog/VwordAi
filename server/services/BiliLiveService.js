/**
 * BiliLive Service
 * Core logic for interacting with Bilibili Live
 */
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const log = require("electron-log");
const say = require("say");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const storage = require("../utils/storage");
const { success, error } = require("../utils/result");
const { BLiveClient } = require("../blive/client");

let client = null;
let win = null;
let currentRoomId = null;
let biliConfig = {};
let ttsConfig = {
  mode: "local",
  azure: {},
  alibaba: {},
  sovits: {},
};
let isConnecting = false;
let isClosing = false;
let giftMergeMap = new Map();

// Config keys for storage
const BILI_CONFIG_KEY = "bili"; // Changed from "bili_config" to match what's used in loadAllConfig
const BILI_AZURE_CONFIG_KEY = "bili_azureConfig";
const BILI_ALIBABA_CONFIG_KEY = "bili_alibabaConfig";
const BILI_SOVITS_CONFIG_KEY = "bili_sovitsConfig";

const DEFAULT_BILI_CONFIG = {
  platform: "win",
  room_ids: [], // {id, name}
  SESSDATA: "", // B站cookies中的SESSDATA字段值，登录后才有
  bilibili_heart_print: 10,
  continuous_gift_interval: 1, // 礼物合并时间间隔(秒)
  welcome_level: 0, // 欢迎进场的最低粉丝牌等级
  voice_text: {
    enter: "欢迎 {uname} 进入直播间，记得常来玩哦！",
    danmaku: "{uname}说：{msg}",
    gift: "感谢 {uname} 赠送的 {num}个{gift_name}，谢谢老板，老板大气！",
    like: "感谢 {uname} {like_text}",
    like_total: "本次直播点赞数量超过 {limit_num} 次，达到 {click_count} 次",
  },
  like_nums: [66, 188, 300, 500, 666, 888, 999, 1666],
  max_next_interval: 100, // 语音间隔 ms
  black_user: [], // 黑名单用户
  black_text: [], // 黑名单关键词
  ttsEnabled: true, // 是否启用TTS
  readDanmaku: true, // 是否播报弹幕
  readGift: true, // 是否播报礼物
  readEnter: true, // 是否播报进场
  readLike: true, // 是否播报点赞
  localVoice: "", // 本地TTS声音
};

const DEFAULT_AZURE_CONFIG = {
  azure_key: "",
  azure_model: "",
  azure_region: "",
  azure_endpoint: "",
  speed: 1.0,
  pitch: 0,
};

const DEFAULT_ALIBABA_CONFIG = {
  alibaba_appkey: "",
  alibaba_token: "",
  alibaba_model: "xiaoyun",
  alibaba_endpoint: "nls-gateway-cn-shanghai.aliyuncs.com",
  speed: 100, // 0-200
};

const DEFAULT_SOVITS_CONFIG = {
  sovits_host: "http://127.0.0.1:5000/tts",
  sovits_model: "",
  sovits_language: "auto",
  sovits_emotion: "",
  sovits_top_k: "",
  sovits_top_p: "",
  sovits_temperature: "",
  sovits_batch_size: "",
  sovits_speed: "1.0",
  sovits_save_temp: "false",
  sovits_stream: "false",
  sovits_format: "wav",
};

/**
 * Load all related configurations
 */
async function loadAllConfig() {
  try {
    // 加载B站配置
    const biliData = storage.read("bili", DEFAULT_BILI_CONFIG);
    console.log("biliData", biliData);
    console.log("DEFAULT_BILI_CONFIG", DEFAULT_BILI_CONFIG);

    // 确保正确合并默认配置和存储的配置
    biliConfig = {
      ...DEFAULT_BILI_CONFIG,
      ...(biliData || {}),
    };

    console.log("Merged biliConfig:", biliConfig);
    console.log("ttsEnabled value:", biliConfig.ttsEnabled);

    log.info(
      `(BiliLive Service) Blive Config loaded, SESSDATA length: ${
        biliConfig.SESSDATA ? String(biliConfig.SESSDATA).length : 0
      }`
    );

    // Check and fix structure if needed
    if (biliConfig.ttsEnabled === undefined) {
      log.warn(
        "(BiliLive Service) ttsEnabled is undefined, setting to default true"
      );
      biliConfig.ttsEnabled = true;
    }

    // 从统一的设置存储中加载TTS配置
    const settings = storage.readConfig("settings", {});

    // 检查Azure是否启用
    const azureProvider = settings.azure || {};
    ttsConfig.mode = azureProvider.enabled ? "azure" : "local";
    log.info(`(BiliLive Service) TTS config loaded, mode: ${ttsConfig.mode}`);

    // 加载Azure TTS配置（从settings统一配置中）
    if (azureProvider) {
      ttsConfig.azure = {
        azure_key: azureProvider.key || DEFAULT_AZURE_CONFIG.azure_key,
        azure_region: azureProvider.region || DEFAULT_AZURE_CONFIG.azure_region,
        azure_model:
          azureProvider.voiceName || DEFAULT_AZURE_CONFIG.azure_model,
        speed: azureProvider.speed || DEFAULT_AZURE_CONFIG.speed,
        pitch: azureProvider.pitch || DEFAULT_AZURE_CONFIG.pitch,
      };
      log.info("(BiliLive Service) Azure config loaded from settings");
    } else {
      // 加载旧配置（向后兼容）
      const azureData = storage.read("azure", DEFAULT_AZURE_CONFIG);
      ttsConfig.azure = { ...DEFAULT_AZURE_CONFIG, ...azureData };
      log.info("(BiliLive Service) Azure config loaded from old config");
    }

    // 加载阿里云 TTS配置
    const alibabaData = storage.read("alibaba", DEFAULT_ALIBABA_CONFIG);
    ttsConfig.alibaba = { ...DEFAULT_ALIBABA_CONFIG, ...alibabaData };
    log.info("(BiliLive Service) Alibaba config loaded");

    // 加载SoVITS配置
    const sovitsData = storage.read("sovits", DEFAULT_SOVITS_CONFIG);
    ttsConfig.sovits = { ...DEFAULT_SOVITS_CONFIG, ...sovitsData };
    log.info("(BiliLive Service) SoVITS config loaded");

    return success({ message: "All configs loaded" });
  } catch (err) {
    log.error("(BiliLive Service) Failed to load configs:", err);
    return error("Failed to load configs: " + err.message);
  }
}

/**
 * Save Bilibili configuration
 * @param {object} configData
 */
async function saveBiliConfig(configData) {
  try {
    console.log("saveBiliConfig - received data:", configData);
    console.log("saveBiliConfig - current biliConfig:", biliConfig);

    // 检查是否有房间ID数据
    if (configData.room_ids) {
      console.log(
        "saveBiliConfig - received room_ids:",
        JSON.stringify(configData.room_ids)
      );
    } else {
      console.log("saveBiliConfig - no room_ids in received data");
    }

    // 合并新配置，保留其他未修改的字段
    biliConfig = {
      ...biliConfig,
      ...configData,
    };

    console.log("saveBiliConfig - merged biliConfig:", biliConfig);
    console.log("saveBiliConfig - ttsEnabled value:", biliConfig.ttsEnabled);
    console.log(
      "saveBiliConfig - merged room_ids:",
      JSON.stringify(biliConfig.room_ids || [])
    );

    // 保存到文件
    storage.save(BILI_CONFIG_KEY, biliConfig);

    // 记录保存的配置信息（不记录SESSDATA的具体内容）
    const logConfig = { ...biliConfig };
    if (logConfig.SESSDATA) {
      logConfig.SESSDATA = `${String(logConfig.SESSDATA).substring(
        0,
        5
      )}...（长度: ${logConfig.SESSDATA.length}）`;
    }
    log.info("(BiliLive Service) Bili config saved:", logConfig);

    return success({ message: "Bili config saved", config: biliConfig });
  } catch (err) {
    log.error("(BiliLive Service) Failed to save Bili config:", err);
    return error("Failed to save Bili config: " + err.message);
  }
}

/**
 * Save TTS mode
 * @param {string} mode 'local' | 'azure' | 'alibaba' | 'sovits'
 */
async function saveTTSMode(mode) {
  try {
    // 保存到BiliLive专用存储
    storage.save("bili_ttsMode", mode);
    ttsConfig.mode = mode;

    // 同步到settings共享存储
    const settings = storage.readConfig("settings", {});
    if (mode === "azure" && settings.azure) {
      // 启用Azure TTS
      settings.azure.enabled = true;
      storage.saveConfig("settings", settings);
      log.info("(BiliLive Service) Azure service enabled in settings");
    } else if (mode === "local" && settings.azure) {
      // 禁用Azure TTS（但保留配置）
      settings.azure.enabled = false;
      storage.saveConfig("settings", settings);
      log.info("(BiliLive Service) Azure service disabled in settings");
    }

    log.info(`(BiliLive Service) TTS mode saved: ${mode}`);
    return success(mode);
  } catch (err) {
    log.error("(BiliLive Service) Failed to save TTS mode:", err);
    return error("Failed to save TTS mode: " + err.message);
  }
}

/**
 * Save Azure TTS configuration
 * @param {object} configData
 */
async function saveAzureConfig(configData) {
  try {
    // 保存到BiliLive专用存储
    storage.save(BILI_AZURE_CONFIG_KEY, configData);
    ttsConfig.azure = configData; // Update config in memory

    // 同步到settings共享存储
    const settings = storage.readConfig("settings", {});
    if (!settings.azure) {
      settings.azure = {};
    }

    // 将BiliLive格式的配置转换为settings格式
    settings.azure.key = configData.azure_key;
    settings.azure.region = configData.azure_region;
    settings.azure.voiceName = configData.azure_model;
    settings.azure.speed = configData.speed || 1.0;
    settings.azure.pitch = configData.pitch || 0;

    // 保留启用状态
    settings.azure.enabled = ttsConfig.mode === "azure";

    // 保存更新后的settings
    storage.saveConfig("settings", settings);

    log.info(
      "(BiliLive Service) Azure TTS config saved and synced to settings."
    );
    return success(configData);
  } catch (err) {
    log.error("(BiliLive Service) Failed to save Azure TTS config:", err);
    return error("Failed to save Azure TTS config: " + err.message);
  }
}

/**
 * Save Alibaba TTS configuration
 * @param {object} configData
 */
async function saveAlibabaConfig(configData) {
  try {
    storage.save(BILI_ALIBABA_CONFIG_KEY, configData);
    ttsConfig.alibaba = configData; // Update config in memory
    log.info("(BiliLive Service) Alibaba TTS config saved.");
    return success(configData);
  } catch (err) {
    log.error("(BiliLive Service) Failed to save Alibaba TTS config:", err);
    return error("Failed to save Alibaba TTS config: " + err.message);
  }
}

/**
 * Save SoVITS TTS configuration
 * @param {object} configData
 */
async function saveSovitsConfig(configData) {
  try {
    storage.save(BILI_SOVITS_CONFIG_KEY, configData);
    ttsConfig.sovits = configData; // Update config in memory
    log.info("(BiliLive Service) SoVITS TTS config saved.");
    return success(configData);
  } catch (err) {
    log.error("(BiliLive Service) Failed to save SoVITS TTS config:", err);
    return error("Failed to save SoVITS TTS config: " + err.message);
  }
}

// Function to read config from storage
async function getConfig() {
  try {
    // Load latest config from storage
    const biliData = storage.read("bili", DEFAULT_BILI_CONFIG);
    console.log("getConfig - biliData:", biliData);

    // Properly merge with default config to ensure all fields exist
    const mergedBiliConfig = {
      ...DEFAULT_BILI_CONFIG,
      ...(biliData || {}),
    };

    // Ensure ttsEnabled is set
    if (mergedBiliConfig.ttsEnabled === undefined) {
      mergedBiliConfig.ttsEnabled = true;
      log.warn(
        "(BiliLive Service) getConfig: ttsEnabled is undefined, setting to default true"
      );
    }

    // Update the global biliConfig
    biliConfig = mergedBiliConfig;

    // Get TTS-related configs
    const settingsConfig = storage.readConfig("settings", {});
    const azureProvider = settingsConfig.azure || {};

    // Update ttsConfig from settings
    ttsConfig.mode = azureProvider.enabled ? "azure" : "local";
    ttsConfig.azure = {
      azure_key: azureProvider.key || "",
      azure_region: azureProvider.region || "",
      azure_model: azureProvider.voiceName || "",
      speed: azureProvider.speed || 1.0,
      pitch: azureProvider.pitch || 0,
    };

    // Fallback to separate config files if settings doesn't have the info
    if (!azureProvider.key) {
      ttsConfig.azure = storage.read(
        BILI_AZURE_CONFIG_KEY,
        DEFAULT_AZURE_CONFIG
      );
    }

    ttsConfig.alibaba = storage.read(
      BILI_ALIBABA_CONFIG_KEY,
      DEFAULT_ALIBABA_CONFIG
    );
    ttsConfig.sovits = storage.read(
      BILI_SOVITS_CONFIG_KEY,
      DEFAULT_SOVITS_CONFIG
    );

    // Return merged config for API
    return {
      ...biliConfig,
      mode: ttsConfig.mode,
      azure: ttsConfig.azure,
      alibaba: ttsConfig.alibaba,
      sovits: ttsConfig.sovits,
    };
  } catch (err) {
    log.error("(BiliLive Service) Error in getConfig:", err);
    // Return at least default config if error
    return {
      ...DEFAULT_BILI_CONFIG,
      mode: "local",
      azure: DEFAULT_AZURE_CONFIG,
      alibaba: DEFAULT_ALIBABA_CONFIG,
      sovits: DEFAULT_SOVITS_CONFIG,
    };
  }
}

/**
 * Connect to Bilibili live room
 * @param {number} roomIdValue Room ID
 */
async function connect(roomIdValue) {
  if (isConnecting || client?.isConnected) {
    log.warn(
      `(BiliLive Service) Already connecting or connected to room ${currentRoomId}.`
    );
    return error(`Already connecting or connected to room ${currentRoomId}`);
  }

  isConnecting = true;
  log.info(`(BiliLive Service) Attempting to connect to room: ${roomIdValue}`);
  sendToRenderer(
    "bililive-status-text",
    `Connecting to room ${roomIdValue}...`
  );

  try {
    // Get window instance using a method not dependent on focus state
    const { BrowserWindow } = require("electron");
    win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
    if (!win) {
      isConnecting = false;
      log.error("(BiliLive Service) No active window found");
      return error("No active window found");
    }

    await loadAllConfig(); // Load latest config
    log.debug("(BiliLive Service) Configuration loaded");

    closeClient(); // Close previous connection (if any)
    log.debug("(BiliLive Service) Previous connection closed");

    currentRoomId = parseInt(roomIdValue);

    // Create BLiveClient instance
    client = new BLiveClient(
      {
        SESSDATA: biliConfig.SESSDATA,
        heartbeatInterval: 30000, // 30 seconds
      },
      handleLiveMessage
    );

    // Set up client event handlers
    client.onOpen = (roomId) => {
      isConnecting = false;
      sendConnectionStatus(true, roomId);
      sendToRenderer("bililive-message", {
        type: "info",
        content: `Connected to room ${roomId}`,
      });
      sendToRenderer("bililive-status-text", `Connected to room ${roomId}`);
    };

    client.onClose = (code, reason) => {
      sendConnectionStatus(false, currentRoomId);
      sendToRenderer("bililive-message", {
        type: "info",
        content: "WebSocket connection closed",
      });
      sendToRenderer("bililive-status-text", `Connection closed`);
    };

    client.onError = (err) => {
      sendConnectionStatus(false, currentRoomId);
      sendToRenderer("bililive-message", {
        type: "error",
        content: "WebSocket connection error: " + err.message,
      });
      sendToRenderer(
        "bililive-status-text",
        `Connection error: ${err.message}`
      );
    };

    client.onHeartbeat = (popularity) => {
      sendToRenderer("bililive-popularity", popularity);
    };

    // Connect to room
    const result = await client.connect(currentRoomId);
    if (!result) {
      isConnecting = false;
      sendConnectionStatus(false, currentRoomId);
      return error("Failed to connect to room");
    }

    log.info(
      `(BiliLive Service) WebSocket connection process started, waiting for connection`
    );
    return success({ message: "Connecting..." });
  } catch (err) {
    isConnecting = false;
    log.error("(BiliLive Service) Connection failed:", err);
    sendConnectionStatus(false, roomIdValue);
    sendToRenderer("bililive-message", {
      type: "error",
      content: "Connection failed: " + err.message,
    });
    sendToRenderer("bililive-status-text", `Connection failed: ${err.message}`);
    closeClient();
    return error("Connection failed: " + err.message);
  }
}

/**
 * Close WebSocket connection
 */
function closeClient() {
  if (isClosing || !client) {
    return;
  }

  isClosing = true;
  log.info("(BiliLive Service) Closing WebSocket connection...");

  if (client) {
    client.close();
    client = null;
    sendConnectionStatus(false, currentRoomId);
    sendToRenderer("bililive-message", {
      type: "info",
      content: "Connection manually closed",
    });
    sendToRenderer("bililive-status-text", `Connection closed`);
    currentRoomId = null;
  }

  giftMergeMap.clear(); // Clear gift merge map
  isClosing = false; // Reset flag after closing attempt
}

/**
 * Send message to renderer process
 * @param {string} channel Event channel
 * @param {any} data Data
 */
function sendToRenderer(channel, data) {
  if (win && win.webContents && !win.isDestroyed()) {
    try {
      win.webContents.send(channel, data);
    } catch (err) {
      log.error(
        `(BiliLive Service) Failed to send message to renderer on channel ${channel}:`,
        err
      );
    }
  } else {
    log.warn(
      `(BiliLive Service) Cannot send message to renderer, window not available or destroyed. Channel: ${channel}`
    );
  }
}

/**
 * 发送连接状态到渲染进程
 * @param {boolean} connected 是否连接
 * @param {number|null} roomId 房间号
 */
function sendConnectionStatus(connected, roomId) {
  sendToRenderer("bililive-connection-status", { connected, roomId });
}

/**
 * Handle live message from client
 * @param {Object} message Message from BLiveClient
 */
function handleLiveMessage(message) {
  // Handle custom events first
  if (message.cmd === "CONNECTED") {
    log.info("(BiliLive Service) Connection authenticated");
    sendToRenderer("bililive-message", {
      type: "info",
      content: "Live room connection authenticated",
    });
    return;
  }

  // SEND ALL MESSAGES TO FRONTEND FOR DEBUGGING
  try {
    // Send raw message to a debug channel
    sendToRenderer("bililive-debug-message", message);
  } catch (err) {
    log.error(`(BiliLive Service) Error sending debug message:`, err);
  }

  // Process normal messages
  processSingleMessage(message);
}

/**
 * Process a single decompressed/parsed message object
 * @param {object} msgObj
 */
function processSingleMessage(msgObj) {
  const cmd = msgObj.cmd;
  // log.debug(`(BiliLive Service) Process message: ${cmd}`);

  // 打印消息详情（限制大小以避免日志过大）
  try {
    const stringifiedMsg = JSON.stringify(msgObj);
    const logMsg =
      stringifiedMsg.length > 300
        ? stringifiedMsg.substring(0, 300) + "..."
        : stringifiedMsg;
    // log.debug(`(BiliLive Service) Message content: ${logMsg}`);

    // 记录完整消息到文件（方便调试）
    if (process.env.NODE_ENV === "development") {
      const fs = require("fs");
      const path = require("path");
      const logDir = path.join(__dirname, "../../logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(
        path.join(logDir, "bili_messages.json"),
        stringifiedMsg + "\n"
      );
    }
  } catch (err) {
    log.error(`(BiliLive Service) Error recording message content:`, err);
  }

  // ALWAYS send all raw messages to renderer for debugging
  sendToRenderer("bililive-raw-message", msgObj);

  // For danmaku messages specifically, send to both raw and danmaku channels to ensure they get through
  if (cmd === "DANMU_MSG") {
    try {
      // Try to extract danmaku data and send directly
      const danmakuData = extractDanmakuData(msgObj);
      if (danmakuData) {
        // log.info(
        //   `(BiliLive Service) Sending extracted danmaku data: ${JSON.stringify(
        //     danmakuData
        //   )}`
        // );
        sendToRenderer("bililive-danmaku", danmakuData);
      }
    } catch (err) {
      log.error(`(BiliLive Service) Error extracting danmaku data:`, err);
    }
  }

  switch (cmd) {
    case "DANMU_MSG": // 弹幕消息
      log.info(`(BiliLive Service) Received danmaku message, processing...`);
      handleDanmakuMessage(msgObj);
      break;
    case "SEND_GIFT": // 礼物消息
      log.info(`(BiliLive Service) Received gift message, processing...`);
      handleGiftMessage(msgObj);
      break;
    case "LIKE_INFO_V3_CLICK": // 点赞消息 (普通点赞)
      log.info(`(BiliLive Service) Received like message, processing...`);
      handleLikeMessage(msgObj.data);
      break;
    case "LIKE_INFO_V3_UPDATE": // 点赞计数更新
      log.debug(
        `(BiliLive Service) Received like count update: ${
          msgObj.data?.count || "Unknown"
        }`
      );
      // 可以在这里更新总点赞数显示，但通常点赞消息会更频繁
      // sendToRenderer('bililive-like-update', msgObj.data.count);
      break;
    case "INTERACT_WORD": // 进入直播间消息
      log.info(`(BiliLive Service) Received enter message, processing...`);
      handleEnterMessage(msgObj.data);
      break;
    case "ENTRY_EFFECT": // 进入直播间特效 (高等级用户)
      log.debug(
        `(BiliLive Service) Received entry effect message: ${
          msgObj.data?.uname || "Unknown user"
        }`
      );
      // 可以考虑添加单独处理
      break;
    case "WELCOME": // 欢迎高等级用户/舰长
      log.debug(
        `(BiliLive Service) Received welcome message from high-level user: ${
          msgObj.data?.uname || "Unknown user"
        }`
      );
      // msgObj.data.uname
      break;
    case "WELCOME_GUARD": // 欢迎舰长
      log.debug(
        `(BiliLive Service) Received welcome message from guard: ${
          msgObj.data?.username || "Unknown user"
        }`
      );
      // msgObj.data.username
      break;
    case "SUPER_CHAT_MESSAGE": // SC 消息
      log.info(`(BiliLive Service) Received SC message, processing...`);
      handleSuperChatMessage(msgObj.data);
      break;
    case "GUARD_BUY": // 上舰消息
      log.info(`(BiliLive Service) Received guard buy message, processing...`);
      handleGuardBuyMessage(msgObj.data);
      break;
    // --- 其他可能需要处理的消息 ---
    case "ROOM_REAL_TIME_MESSAGE_UPDATE": // 粉丝数等更新
      // log.debug(
      //   `(BiliLive Service) Received room real-time update: fans=${
      //     msgObj.data?.fans || "Unknown"
      //   }`
      // );
      // msgObj.data.fans
      // sendToRenderer('bililive-room-update', { fans: msgObj.data.fans });
      break;
    case "STOP_LIVE_ROOM_LIST": // 停止直播的房间列表？（可能不需要）
      // log.debug(`(BiliLive Service) Received stop live room list`);
      break;
    case "WIDGET_BANNER": // 小部件横幅（例如高能榜）
      // log.debug(`(BiliLive Service) Received widget banner message`);
      sendToRenderer("bililive-message", {
        type: "notice",
        content: msgObj.msg_self,
      });
      break;
    case "ONLINE_RANK_COUNT": // 在线排名计数
      log.debug(
        `(BiliLive Service) Received online rank count: ${
          msgObj.data?.count || "Unknown"
        }`
      );
      // msgObj.data.count
      sendToRenderer("bililive-online-count", msgObj.data.count);
      break;
    case "NOTICE_MSG": // 通知消息 (各种系统通知)
      sendToRenderer("bililive-message", {
        type: "notice",
        content: msgObj.msg_self,
      });
      break;
    // ... 根据需要添加更多 case ...
    default:
      // 针对未明确处理的消息类型记录日志
      log.debug(`(BiliLive Service) Received unhandled message type: ${cmd}`);
      sendToRenderer("bililive-other-message", msgObj); // 发送其他未处理消息
      break;
  }
}

/**
 * Helper function to extract danmaku data for direct sending
 * @param {object} msgObj DANMU_MSG object
 * @returns {object|null} Extracted danmaku data or null if extraction fails
 */
function extractDanmakuData(msgObj) {
  try {
    if (!msgObj.info || !Array.isArray(msgObj.info) || msgObj.info.length < 3) {
      return null;
    }

    return {
      uid: msgObj.info[2][0] || 0,
      uname: msgObj.info[2][1] || "unknown",
      msg: msgObj.info[1] || "",
      userLevel: msgObj.info[4]?.[0] || 0,
    };
  } catch (err) {
    log.error(`(BiliLive Service) Error extracting danmaku data:`, err);
    return null;
  }
}

/**
 * Handle danmaku message
 * @param {object} msgObj DANMU_MSG object
 */
function handleDanmakuMessage(msgObj) {
  try {
    // Check if msgObj.info is valid
    if (!msgObj.info || !Array.isArray(msgObj.info) || msgObj.info.length < 3) {
      log.error(
        `(BiliLive Service) Invalid danmaku message format: ${JSON.stringify(
          msgObj
        )}`
      );
      return;
    }

    // Extract data based on B站的弹幕消息格式
    // info[0]: 弹幕综合信息
    // info[1]: 弹幕内容
    // info[2]: 发送者信息 [用户ID, 用户名, 是否房管, 是否VIP, 是否SVIP, ...]
    // info[3]: 粉丝勋章信息 [勋章等级, 勋章名, 主播名, 主播房间号, ...]
    // info[4]: 用户等级信息 [用户等级, 排名, ...]

    const msg = msgObj.info[1];
    const uid = msgObj.info[2][0];
    const uname = msgObj.info[2][1];
    const isAdmin = msgObj.info[2][2] === 1;
    const userLevel = msgObj.info[4]?.[0] || 0;
    const guardLevel = msgObj.info[3]?.[6] || 0; // Guard level 3=Captain, 2=Commander, 1=Governor
    const medalInfo = msgObj.info[3]?.[1]
      ? `Medal[${msgObj.info[3][1]}]`
      : "No medal";

    log.info(
      `(BiliLive Service) Danmaku: [${uname}] ${msg} (Level:${userLevel}, ${medalInfo}, Guard:${guardLevel})`
    );

    // 构建弹幕数据
    const danmakuData = {
      uid,
      uname,
      msg,
      userLevel,
      isAdmin,
      guardLevel,
      medal: {
        level: msgObj.info[3]?.[0] || 0,
        name: msgObj.info[3]?.[1] || "",
        anchor: msgObj.info[3]?.[2] || "",
      },
      timestamp: Date.now(),
    };

    // 发送弹幕消息到前端
    sendToRenderer("bililive-danmaku", danmakuData);
    log.debug(
      `(BiliLive Service) Sent danmaku to renderer: ${JSON.stringify(
        danmakuData
      )}`
    );

    // Check blacklist users and keywords
    if (
      biliConfig.black_user?.includes(uname) ||
      biliConfig.black_text?.some((keyword) => msg.includes(keyword))
    ) {
      log.info(
        `(BiliLive Service) Blocked danmaku from blacklisted user ${uname}`
      );
      return;
    }

    // Check if TTS is enabled
    if (biliConfig.ttsEnabled && biliConfig.readDanmaku) {
      log.debug(
        `(BiliLive Service) Danmaku TTS enabled, preparing to speak: [${uname}] ${msg}`
      );
      const text = biliConfig.voice_text?.danmaku
        .replace("{uname}", uname)
        .replace("{msg}", msg);
      speechText(text);
    } else {
      log.debug(`(BiliLive Service) Danmaku TTS disabled, skipping speech`);
    }
  } catch (err) {
    log.error(`(BiliLive Service) Error processing danmaku message:`, err);
    log.error(
      `(BiliLive Service) Message object: ${JSON.stringify(msgObj, null, 2)}`
    );
  }
}

/**
 * Handle gift message (merge consecutive gifts from same user)
 * @param {object} msgObj SEND_GIFT object
 */
function handleGiftMessage(msgObj) {
  try {
    // Check message format
    if (!msgObj.data) {
      log.error(
        `(BiliLive Service) Invalid gift message format: ${JSON.stringify(
          msgObj
        )}`
      );
      return;
    }

    const data = msgObj.data;
    const uid = data.uid;
    const uname = data.uname;
    const giftName = data.giftName;
    const num = data.num;
    const price = data.price; // Single gift price (battery)
    const totalCoin = data.total_coin; // Total price (battery)
    const giftId = data.giftId;
    const batchComboId = data.batch_combo_id; // Used to distinguish different batches of combo gifts
    const coinType = data.coin_type || "unknown"; // silver or gold
    const medalInfo = data.medal_info
      ? `Medal[${data.medal_info.medal_name}:${data.medal_info.medal_level}]`
      : "No medal";

    log.info(
      `(BiliLive Service) Gift: [${uname}] sent ${num} ${giftName} (Value:${totalCoin} battery, Type:${coinType} coin, ${medalInfo})`
    );
    const giftData = { uid, uname, giftName, giftId, num, price, totalCoin };
    sendToRenderer("bililive-gift", giftData);

    // Record gift merge status
    const giftKey = `${uid}-${giftId}-${batchComboId}`; // Merge Key
    log.debug(
      `(BiliLive Service) Gift Key: ${giftKey}, Merge window: ${
        biliConfig.continuous_gift_interval || 1
      } seconds`
    );

    if (!biliConfig.ttsEnabled || !biliConfig.readGift) {
      log.debug(`(BiliLive Service) Gift TTS disabled, skipping speech`);
      return;
    }

    const interval = (biliConfig.continuous_gift_interval || 1) * 1000; // Merge window (ms)

    if (giftMergeMap.has(giftKey)) {
      // Update existing gift info
      const existingGift = giftMergeMap.get(giftKey);
      existingGift.num += num;
      existingGift.totalCoin += totalCoin;
      log.debug(
        `(BiliLive Service) Merged gift: [${uname}] ${existingGift.giftName}, Total count: ${existingGift.num}, Total value: ${existingGift.totalCoin} battery`
      );

      // Reset timer
      clearTimeout(existingGift.timer);
      existingGift.timer = setTimeout(() => {
        log.info(
          `(BiliLive Service) Speaking merged gift: [${uname}] ${existingGift.num} ${giftName}`
        );
        const text = biliConfig.voice_text?.gift
          .replace("{uname}", uname)
          .replace("{num}", existingGift.num)
          .replace("{gift_name}", giftName);
        speechText(text);
        giftMergeMap.delete(giftKey); // Delete after speaking
      }, interval);
    } else {
      // New gift, create info and set timer
      log.debug(
        `(BiliLive Service) New gift: [${uname}] ${giftName}, setting ${interval}ms timer for speech`
      );
      const newGift = {
        uname,
        giftName,
        num,
        totalCoin,
        timer: setTimeout(() => {
          log.info(
            `(BiliLive Service) Speaking gift: [${uname}] ${num} ${giftName}`
          );
          const text = biliConfig.voice_text?.gift
            .replace("{uname}", uname)
            .replace("{num}", newGift.num) // Use merged count
            .replace("{gift_name}", giftName);
          speechText(text);
          giftMergeMap.delete(giftKey); // Delete after speaking
        }, interval),
      };
      giftMergeMap.set(giftKey, newGift);
    }
  } catch (err) {
    log.error(`(BiliLive Service) Error processing gift message:`, err);
  }
}

/**
 * Handle like message
 * @param {object} data LIKE_INFO_V3_CLICK.data
 */
function handleLikeMessage(data) {
  try {
    // Check message format
    if (!data || !data.uname) {
      log.error(
        `(BiliLive Service) Invalid like message format: ${JSON.stringify(
          data
        )}`
      );
      return;
    }

    // data example: { uid: ..., uname: '...', like_text: 'liked the stream', ... }
    const uid = data.uid;
    const uname = data.uname;
    const likeText = data.like_text;
    const userInfo = data.fans_medal
      ? `Medal[${data.fans_medal.medal_name}:${data.fans_medal.medal_level}]`
      : "No medal";

    log.info(`(BiliLive Service) Like: [${uname}] ${likeText} (${userInfo})`);
    sendToRenderer("bililive-like", { uid, uname, text: likeText });

    if (biliConfig.ttsEnabled && biliConfig.readLike) {
      log.debug(
        `(BiliLive Service) Like TTS enabled, preparing to speak: [${uname}] ${likeText}`
      );
      const text = biliConfig.voice_text?.like
        .replace("{uname}", uname)
        .replace("{like_text}", likeText);
      speechText(text);
    } else {
      log.debug(`(BiliLive Service) Like TTS disabled, skipping speech`);
    }
  } catch (err) {
    log.error(`(BiliLive Service) Error processing like message:`, err);
  }
}

/**
 * Handle enter live room message
 * @param {object} data INTERACT_WORD.data
 */
function handleEnterMessage(data) {
  try {
    // Check message format
    if (!data || !data.uname) {
      log.error(
        `(BiliLive Service) Invalid enter message format: ${JSON.stringify(
          data
        )}`
      );
      return;
    }

    // data example: { contribution: { rank: 0 }, dmscore: 13, fans_medal: { ... }, identities: [ 3, 1 ], is_spread: 0,
    //            msg_type: 1, privilege_type: 3, roomid: ..., score: ..., spreaddesc: '', spreadinfo: '',
    //            tail_icon: ..., timestamp: ..., trigger_time: ..., uid: ..., uname: '...', uname_color: '' }
    const uid = data.uid;
    const uname = data.uname;
    const guardLevel = data.privilege_type || 0; // 3=Captain, 2=Commander, 1=Governor, 0=Not captain
    const medalLevel = data.fans_medal?.level || 0; // Fan medal level
    const medalName = data.fans_medal?.medal_name || ""; // Fan medal name
    const medalInfo =
      medalLevel > 0 ? `Medal[${medalName}:${medalLevel}]` : "No medal";
    const guardInfo =
      guardLevel > 0 ? `Guard level[${guardLevel}]` : "Not captain";

    log.info(
      `(BiliLive Service) Enter: [${uname}] (${medalInfo}, ${guardInfo})`
    );
    sendToRenderer("bililive-enter", {
      uid,
      uname,
      medalLevel,
      medalName,
      guardLevel,
    });

    // Check blacklist
    if (biliConfig.black_user?.includes(uname)) {
      log.info(
        `(BiliLive Service) Blocked enter message from blacklisted user ${uname}`
      );
      return;
    }

    // Welcome level filter
    const welcomeLevel = biliConfig.welcome_level || 0;
    if (
      medalLevel >= welcomeLevel &&
      biliConfig.ttsEnabled &&
      biliConfig.readEnter
    ) {
      log.debug(
        `(BiliLive Service) Enter TTS enabled, preparing to speak: [${uname}] Fan medal level[${medalLevel}] >= Set level[${welcomeLevel}]`
      );
      const text = biliConfig.voice_text?.enter.replace("{uname}", uname);
      speechText(text);
    } else {
      if (medalLevel < welcomeLevel) {
        log.debug(
          `(BiliLive Service) User fan medal level[${medalLevel}] < Set level[${welcomeLevel}], skipping speech`
        );
      } else {
        log.debug(`(BiliLive Service) Enter TTS disabled, skipping speech`);
      }
    }
  } catch (err) {
    log.error(`(BiliLive Service) Error processing enter message:`, err);
  }
}

/**
 * Handle SC message
 * @param {object} data SUPER_CHAT_MESSAGE.data
 */
function handleSuperChatMessage(data) {
  // data example: { background_color: '#EDF5FF', ..., end_time: ..., gift: { gift_id: 12000, gift_name: 'Super Chat', num: 1 },
  //            id: ..., message: 'SC content', ..., price: 30, ..., start_time: ..., time: 900, uid: ...,
  //            user_info: { face: '...', ..., uname: '...' } }
  const id = data.id;
  const uname = data.user_info.uname;
  const price = data.price; // Price in CNY
  const message = data.message;
  log.info(
    `(BiliLive Service) SuperChat: [${uname}] (${price} CNY) ${message}`
  );
  sendToRenderer("bililive-superchat", { id, uname, price, message });

  if (biliConfig.ttsEnabled) {
    // SC default speech
    const text = `Thank you ${uname} for ${price} CNY Super Chat: ${message}`;
    speechText(text);
  }
}

/**
 * Handle captain subscription message
 * @param {object} data GUARD_BUY.data
 */
function handleGuardBuyMessage(data) {
  // data example: { uid: ..., username: '...', guard_level: 3, num: 1, price: 198000, gift_id: 10003, gift_name: 'Captain', ... }
  // guard_level: 3=Captain, 2=Commander, 1=Governor
  const uid = data.uid;
  const uname = data.username;
  const level = data.guard_level;
  const giftName = data.gift_name; // Captain/Commander/Governor
  const num = data.num; // Count (usually 1)
  log.info(
    `(BiliLive Service) Guard Buy: [${uname}] bought ${num} x ${giftName}`
  );
  sendToRenderer("bililive-guard", { uid, uname, level, giftName, num });

  if (biliConfig.ttsEnabled) {
    // Captain subscription default speech
    const text = `Thank you ${uname} for subscribing as ${giftName}! You're so generous!`;
    speechText(text);
  }
}

// --- TTS Implementation ---

let speechQueue = [];
let isSpeaking = false;

/**
 * Add text to speech queue
 * @param {string} text
 */
function speechText(text) {
  // Check if biliConfig is loaded properly
  if (!biliConfig || typeof biliConfig !== "object") {
    log.error("(BiliLive Service) biliConfig is not properly initialized");
    // Load config if it's not initialized
    loadAllConfig().then(() => {
      log.info(
        "(BiliLive Service) Config reloaded, trying to process speech again"
      );
      speechText(text); // Try again
    });
    return;
  }

  // Ensure ttsEnabled is set, defaulting to true
  if (biliConfig.ttsEnabled === undefined) {
    log.warn(
      "(BiliLive Service) ttsEnabled is undefined, setting to default true"
    );
    biliConfig.ttsEnabled = true;
    // Save this change to storage
    storage.save("bili", biliConfig);
  }

  if (!text || !biliConfig.ttsEnabled) {
    log.debug(
      `(BiliLive Service) TTS skipped: ${!text ? "Empty text" : "TTS disabled"}`
    );
    return;
  }

  log.debug(`(BiliLive Service) Added to TTS queue: "${text}"`);
  speechQueue.push(text);
  processSpeechQueue();
}

/**
 * Process speech queue
 */
async function processSpeechQueue() {
  if (isSpeaking || speechQueue.length === 0) {
    if (isSpeaking) {
      log.debug(
        `(BiliLive Service) TTS is playing, queue length: ${speechQueue.length}`
      );
    }
    return;
  }
  isSpeaking = true;
  const text = speechQueue.shift();

  // 检查是否使用settings中的配置
  const settings = storage.readConfig("settings", {});
  const useAzure =
    settings.azure && settings.azure.enabled && settings.azure.key;

  // 优先使用settings中的设置决定TTS模式
  let ttsMode = ttsConfig.mode;
  if (useAzure) {
    ttsMode = "azure";
  }

  // log.info(
  //   `(BiliLive Service) Starting TTS playback (Engine: ${ttsMode}): "${text}"`
  // );
  sendToRenderer("bililive-tts-status", { speaking: true, text });

  try {
    const startTime = Date.now();
    switch (ttsMode) {
      case "azure":
        // log.debug(`(BiliLive Service) Using Azure TTS to speak: "${text}"`);
        await azureTTS(text);
        break;
      case "alibaba":
        // log.debug(`(BiliLive Service) Using Alibaba TTS to speak: "${text}"`);
        await alibabaTTS(text);
        break;
      case "sovits":
        // log.debug(`(BiliLive Service) Using SoVITS TTS to speak: "${text}"`);
        await sovitsTTS(text);
        break;
      case "local":
      default:
        // log.debug(
        //   `(BiliLive Service) Using local TTS to speak: "${text}" (localVoice: ${
        //     biliConfig.localVoice || "not set"
        //   })`
        // );
        await localTTS(text);
        break;
    }
    const elapsedTime = Date.now() - startTime;
    // log.info(
    //   `(BiliLive Service) TTS playback completed, time taken: ${elapsedTime}ms, remaining queue: ${speechQueue.length}`
    // );
  } catch (err) {
    log.error(`(BiliLive Service) TTS playback error (${ttsMode}):`, err);
    sendToRenderer("bililive-message", {
      type: "error",
      content: `TTS (${ttsMode}) playback failed: ${err.message}`,
    });
  } finally {
    // Wait interval
    const interval = biliConfig.max_next_interval || 100;
    // log.debug(`(BiliLive Service) TTS wait interval: ${interval}ms`);
    setTimeout(() => {
      isSpeaking = false;
      sendToRenderer("bililive-tts-status", { speaking: false, text: null });
      log.debug(
        `(BiliLive Service) TTS status reset complete, continuing queue processing (length: ${speechQueue.length})`
      );
      processSpeechQueue(); // Process next
    }, interval);
  }
}

/**
 * Local TTS (using say.js)
 * @param {string} text
 */
function localTTS(text) {
  return new Promise(async (resolve, reject) => {
    log.info(`(BiliLive Service) Starting local TTS playback: "${text}"`);

    try {
      // Get available voices
      const availableVoices = await getAvailableVoices();
      log.debug(
        `(BiliLive Service) Available voices: ${JSON.stringify(
          availableVoices
        )}`
      );

      // Check user preference first
      let selectedVoice = null;
      if (
        biliConfig.localVoice &&
        availableVoices.includes(biliConfig.localVoice)
      ) {
        selectedVoice = biliConfig.localVoice;
        log.info(
          `(BiliLive Service) Using user-preferred voice: ${selectedVoice}`
        );
      }
      // If no preference or preferred voice not available, try to find a Chinese voice
      else if (availableVoices.includes("Microsoft Huihui Desktop")) {
        selectedVoice = "Microsoft Huihui Desktop";
        log.info(`(BiliLive Service) Using Chinese voice: ${selectedVoice}`);
      }
      // Try other known Chinese voices
      else if (availableVoices.includes("Microsoft Yaoyao Desktop")) {
        selectedVoice = "Microsoft Yaoyao Desktop";
        log.info(`(BiliLive Service) Using Chinese voice: ${selectedVoice}`);
      } else if (availableVoices.includes("Microsoft Kangkang Desktop")) {
        selectedVoice = "Microsoft Kangkang Desktop";
        log.info(`(BiliLive Service) Using Chinese voice: ${selectedVoice}`);
      }
      // Fallback to any available voice
      else if (availableVoices.length > 0) {
        selectedVoice = availableVoices[0];
        log.info(`(BiliLive Service) Using fallback voice: ${selectedVoice}`);
      }

      // Windows can have encoding issues with Chinese characters, ensure proper encoding
      // 对于Windows系统，确保中文字符能被正确处理
      const isWindows = process.platform === "win32";
      if (isWindows) {
        log.debug(`(BiliLive Service) Using Windows-specific handling for TTS`);
      }

      // Use say.js to speak the text
      log.debug(
        `(BiliLive Service) Speaking with voice: ${selectedVoice || "default"}`
      );

      // 确保文本被正确传递给TTS引擎
      say.speak(text, selectedVoice, 1.0, (err) => {
        if (err) {
          log.error("(BiliLive Service) Local TTS playback error:", err);
          reject(err);
        } else {
          log.debug("(BiliLive Service) Local TTS playback completed");
          resolve();
        }
      });
    } catch (err) {
      log.error("(BiliLive Service) Error in localTTS:", err);
      reject(err);
    }
  });
}

/**
 * Azure TTS
 * @param {string} text
 */
async function azureTTS(text) {
  // 先初始化config对象以防未定义
  const config = ttsConfig.azure || {};

  // 检查Azure配置，如果本地没有则尝试从settings加载
  if (!config.azure_key || !config.azure_region) {
    // 尝试从settings加载
    const azure = storage.read("azure", {});
    // console.log("settings:", azure);
    if (azure && azure.key && azure.region) {
      // 使用settings中的Azure配置
      log.info("(BiliLive Service) 使用settings中的Azure配置");
      config.azure_key = azure.key;
      config.azure_region = azure.region;
      config.azure_model = azure.voiceName || "zh-CN-XiaoxiaoNeural";
      config.speed = azure.speed || 1.0;
      config.pitch = azure.pitch || 0;

      // 更新内存中的配置
      if (!ttsConfig.azure) ttsConfig.azure = {};
      Object.assign(ttsConfig.azure, config);
    } else {
      throw new Error(
        "Azure TTS configuration incomplete (Key and Region required)"
      );
    }
  }

  // log.info(
  //   `(BiliLive Service) Azure TTS: 使用Key=${config.azure_key.substring(
  //     0,
  //     4
  //   )}..., Region=${config.azure_region}, Model=${
  //     config.azure_model || "default"
  //   }`
  // );

  // 创建语音配置
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.azure_key,
    config.azure_region
  );

  // 设置语音合成语言和声音名称
  if (config.azure_model) {
    speechConfig.speechSynthesisVoiceName = config.azure_model;
  } else {
    speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoxiaoNeural"; // Default
  }

  // 设置输出格式为音频流
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3; // 或其他格式

  // 创建音频配置，使用默认扬声器输出
  const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

  // 创建语音合成器
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  // 设置语速
  if (config.speed && config.speed !== 1.0) {
    speechConfig.setProperty(
      "SpeechServiceConnection_SynthesisRate",
      config.speed.toString()
    );
    log.debug(
      `(BiliLive Service) Azure TTS set speech rate to: ${config.speed}`
    );
  }

  // 设置音调
  if (config.pitch && config.pitch !== 0) {
    speechConfig.setProperty(
      "SpeechServiceConnection_SynthesisPitch",
      config.pitch.toString()
    );
    log.debug(`(BiliLive Service) Azure TTS set pitch to: ${config.pitch}`);
  }

  log.debug(
    `(BiliLive Service) Azure TTS using model: ${speechConfig.speechSynthesisVoiceName}, text: "${text}"`
  );

  return new Promise((resolve, reject) => {
    // 使用普通文本合成而非SSML
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          log.debug("(BiliLive Service) Azure TTS playback finished.");
          resolve();
        } else {
          log.error(
            `(BiliLive Service) Azure TTS Error: ${result.errorDetails}`
          );
          reject(new Error(result.errorDetails));
        }
        synthesizer.close();
      },
      (err) => {
        log.error("(BiliLive Service) Azure TTS speakTextAsync Error:", err);
        reject(err);
        synthesizer.close();
      }
    );
  });
}

/**
 * Alibaba TTS (NUI) - Note: Requires Alibaba Cloud account and NUI SDK configuration
 * Implementation is complex, needs to import official Alibaba SDK (@alicloud/nui-sdk)
 * This is just a placeholder, actual implementation needs to refer to Alibaba docs
 * @param {string} text
 */
async function alibabaTTS(text) {
  const config = ttsConfig.alibaba;
  if (!config || !config.alibaba_appkey || !config.alibaba_token) {
    throw new Error(
      "Alibaba TTS configuration incomplete (AppKey and Token required)"
    );
  }
  log.warn("(BiliLive Service) Alibaba TTS not fully implemented yet.");
  // Need to use @alicloud/nui-sdk to implement
  // General flow: Create NlsClient -> Create SpeechSynthesizerRequest -> Set parameters -> start -> Listen to events -> Process audio stream -> stop
  // Example code needs to refer to official docs
  // const NlsClient = require('@alicloud/nls-node-sdk'); // Assuming SDK is installed

  // Simple playback placeholder
  await localTTS(`Alibaba says: ${text}`);

  return Promise.resolve();
}

/**
 * SoVITS TTS (requires local SoVITS API service)
 * @param {string} text
 */
async function sovitsTTS(text) {
  const config = ttsConfig.sovits;
  if (!config || !config.sovits_host) {
    throw new Error(
      "SoVITS TTS configuration incomplete (Host address required)"
    );
  }

  try {
    const params = {
      text: text,
      text_language: config.sovits_language || "auto",
      // Pass other parameters according to SoVITS API docs
      speaker: config.sovits_model, // 'speaker' or 'sovits_model' depends on API
      sdp_ratio: 0.2, // Example parameter
      noise: 0.2, // Example parameter
      noise_w: 0.9, // Example parameter
      length: 1.0, // Example parameter
      // ... other parameters from config ...
      speed: config.sovits_speed || 1.0,
      top_k: config.sovits_top_k,
      top_p: config.sovits_top_p,
      temperature: config.sovits_temperature,
    };

    // Clean up undefined or empty string parameters
    Object.keys(params).forEach(
      (key) =>
        (params[key] === undefined || params[key] === "") && delete params[key]
    );

    log.debug("(BiliLive Service) SoVITS Request Params:", params);

    const response = await axios.get(config.sovits_host, {
      params: params,
      responseType: "arraybuffer", // Get audio stream
      timeout: 15000, // Set timeout
    });

    if (response.status === 200 && response.data) {
      // Play ArrayBuffer audio (needs temp file or audio library)
      // Option 1: Save as temp file then play
      // 播放 ArrayBuffer 音频 (需要临时文件或音频库)
      // 方案1：保存为临时文件再播放
      const tempDir = storage.getStoragePath(); // 使用应用的存储目录
      const tempFilePath = path.join(tempDir, `sovits_temp_${Date.now()}.wav`); // 假设是wav
      await fs.writeFile(tempFilePath, response.data);
      log.debug(`(BiliLive Service) SoVITS audio saved to: ${tempFilePath}`);

      // 使用本地 say 播放临时文件 (如果 say 支持文件播放) - say.js似乎不支持直接播放文件
      // 替代方案：使用其他库播放，或者如果SoVITS支持直接输出到设备
      // 简单的本地播放占位
      await localTTS(`播放 SoVITS 合成语音`); // 仅作提示
      await fs.remove(tempFilePath); // 播放后删除临时文件
      log.debug(`(BiliLive Service) SoVITS playback finished (placeholder).`);
      return Promise.resolve();

      // 方案2：使用能直接播放 buffer 的库（例如 speaker，但需要额外依赖和配置）
      // const Speaker = require('speaker'); // 需要 npm install speaker
      // const speaker = new Speaker({ channels: 1, bitDepth: 16, sampleRate: 44100 }); // 参数需根据SoVITS输出调整
      // speaker.write(response.data);
      // speaker.end();
      // return new Promise(resolve => speaker.on('close', resolve));
    } else {
      throw new Error(
        `SoVITS API request failed with status ${response.status}`
      );
    }
  } catch (err) {
    log.error("(BiliLive Service) SoVITS TTS Error:", err);
    throw new Error(`SoVITS TTS call failed: ${err.message}`);
  }
}

/**
 * Get available TTS voices
 * @returns {Promise<string[]>} List of available voice names
 */
function getAvailableVoices() {
  return new Promise((resolve) => {
    log.debug("(BiliLive Service) Getting installed voices...");

    say.getInstalledVoices((err, voices) => {
      if (err) {
        log.error("(BiliLive Service) Error getting installed voices:", err);
        // Return empty array on error instead of rejecting
        resolve([]);
      } else {
        if (!voices || !Array.isArray(voices)) {
          log.warn("(BiliLive Service) No voices returned or invalid format");
          resolve([]);
        } else {
          log.debug(
            `(BiliLive Service) Available voices: ${voices.join(", ")}`
          );
          resolve(voices);
        }
      }
    });
  });
}

/**
 * Save local TTS configuration
 * @param {string} voice Voice name
 * @returns {Promise<object>}
 */
async function saveLocalConfig(voice) {
  try {
    // Update localVoice in biliConfig
    biliConfig.localVoice = voice;

    // Save to storage
    storage.save(BILI_CONFIG_KEY, biliConfig);

    log.info(
      `(BiliLive Service) Local TTS config saved with voice: ${
        voice || "default"
      }`
    );

    return success({
      message: "Local TTS config saved",
      voice,
    });
  } catch (err) {
    log.error("(BiliLive Service) Failed to save local TTS config:", err);
    return error("Failed to save local TTS config: " + err.message);
  }
}

module.exports = {
  connect,
  closeClient,
  // ... 导出其他需要被 Controller 调用的函数 ...
};

// 替换为：
module.exports = {
  // 连接功能
  connect,
  closeClient,

  // 配置相关
  loadAllConfig,
  getConfig,
  saveBiliConfig,
  saveTTSMode,
  saveAzureConfig,
  saveAlibabaConfig,
  saveSovitsConfig,
  getAvailableVoices,
  saveLocalConfig,

  // TTS相关
  speechText, // 手动播放文本（用于测试）

  // 常量
  DEFAULT_BILI_CONFIG,
  DEFAULT_AZURE_CONFIG,
  DEFAULT_ALIBABA_CONFIG,
  DEFAULT_SOVITS_CONFIG,
};
