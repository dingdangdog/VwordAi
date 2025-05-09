/**
 * BiliLive Service
 * Core logic for interacting with Bilibili Live
 *
 * 重要说明：
 * 1. 本服务使用单一配置文件存储所有B站相关配置
 * 2. 所有B站相关配置统一使用以下键存储:
 *    - BILIVE_CONFIG_KEY (bilive): 包含所有B站相关配置
 * 3. 配置文件保存在config目录下，数据文件保存在storage目录下
 */
const fs = require("fs-extra");
const path = require("path");
const log = require("electron-log");
const storage = require("../utils/storage");
const { success, error } = require("../utils/result");
const { BLiveClient } = require("../blive/client");
const os = require("os");

let client = null;
let win = null;
let currentRoomId = null;
let biliveConfig = {};
let isConnecting = false;
let isClosing = false;
let giftMergeMap = new Map();

// 单一配置键
const BILIVE_CONFIG_KEY = "bilive";

// 数据存储相关
let recordEnabled = false;
let recordPath = null;
let danmakuStream = null;
let giftStream = null;
let visitorStream = null;

const DEFAULT_BILIVE_CONFIG = {
  // 基础配置
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

  // 数据记录配置
  recordDanmaku: true, // 是否记录弹幕
  recordGift: true, // 是否记录礼物
  recordVisitor: true, // 是否记录访客

  // TTS模式
  tts: {
    mode: "local", // 'local', 'azure', 'aliyun', 'sovits'

    // Azure TTS配置
    azure: {
      azure_key: "",
      azure_model: "",
      azure_region: "",
      azure_endpoint: "",
      speed: 1.0,
      pitch: 0,
    },

    // 阿里云 TTS配置
    alibaba: {
      alibaba_appkey: "",
      alibaba_token: "",
      alibaba_model: "xiaoyun",
      alibaba_endpoint: "https://nls-gateway-cn-shanghai.aliyuncs.com",
      speed: 100, // 0-200
    },

    // SoVITS 配置
    sovits: {
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
    },
  },
};

/**
 * Load bilive configuration
 */
async function loadAllConfig() {
  try {
    // 从配置目录加载B站配置
    const savedConfig = storage.readConfig(BILIVE_CONFIG_KEY, {});
    // console.log("Saved bilive config:", savedConfig);

    // 确保正确合并默认配置和存储的配置
    biliveConfig = {
      ...DEFAULT_BILIVE_CONFIG,
      ...(savedConfig || {}),
    };

    // 确保配置结构完整
    if (!biliveConfig.tts) {
      biliveConfig.tts = DEFAULT_BILIVE_CONFIG.tts;
    } else {
      // 确保TTS子配置结构完整
      biliveConfig.tts = {
        ...DEFAULT_BILIVE_CONFIG.tts,
        ...biliveConfig.tts,
        azure: {
          ...DEFAULT_BILIVE_CONFIG.tts.azure,
          ...(biliveConfig.tts.azure || {}),
        },
        alibaba: {
          ...DEFAULT_BILIVE_CONFIG.tts.alibaba,
          ...(biliveConfig.tts.alibaba || {}),
        },
        sovits: {
          ...DEFAULT_BILIVE_CONFIG.tts.sovits,
          ...(biliveConfig.tts.sovits || {}),
        },
      };
    }

    // console.log("Merged biliveConfig:", biliveConfig);
    log.info(
      `(BiliLive Service) Bilive Config loaded, SESSDATA length: ${
        biliveConfig.SESSDATA ? String(biliveConfig.SESSDATA).length : 0
      }`
    );

    // Check and fix optional fields
    if (biliveConfig.ttsEnabled === undefined) {
      log.warn(
        "(BiliLive Service) ttsEnabled is undefined, setting to default true"
      );
      biliveConfig.ttsEnabled = true;
    }

    return success({ message: "Bilive config loaded" });
  } catch (err) {
    log.error("(BiliLive Service) Failed to load configs:", err);
    return error("Failed to load configs: " + err.message);
  }
}

/**
 * Save Bilibili configuration
 * @param {object} configData
 */
async function saveBiliveConfig(configData) {
  try {
    // 合并新配置，保留其他未修改的字段
    biliveConfig = {
      ...biliveConfig,
      ...configData,
    };

    // 保存到配置文件
    storage.saveConfig(BILIVE_CONFIG_KEY, biliveConfig);

    // 记录保存的配置信息（不记录SESSDATA的具体内容）
    const logConfig = { ...biliveConfig };
    if (logConfig.SESSDATA) {
      logConfig.SESSDATA = `${String(logConfig.SESSDATA).substring(
        0,
        5
      )}...（长度: ${logConfig.SESSDATA.length}）`;
    }

    return success({ message: "Bilive config saved", config: biliveConfig });
  } catch (err) {
    log.error("(BiliLive Service) Failed to save Bilive config:", err);
    return error("Failed to save Bilive config: " + err.message);
  }
}

/**
 * Save TTS mode
 * @param {string} mode 'local' | 'azure' | 'aliyun' | 'sovits'
 */
async function saveTTSMode(mode) {
  try {
    // 更新配置中的TTS模式
    biliveConfig.tts.mode = mode;

    // 保存完整配置
    storage.saveConfig(BILIVE_CONFIG_KEY, biliveConfig);

    log.info(`(BiliLive Service) Bili TTS mode saved: ${mode}`);
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
    // 更新配置中的Azure设置
    biliveConfig.tts.azure = {
      ...biliveConfig.tts.azure,
      ...configData,
    };

    // 保存完整配置
    storage.saveConfig(BILIVE_CONFIG_KEY, biliveConfig);

    log.info("(BiliLive Service) Azure TTS config saved");
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
    // 更新配置中的阿里云设置
    biliveConfig.tts.alibaba = {
      ...biliveConfig.tts.alibaba,
      ...configData,
    };

    // 保存完整配置
    storage.saveConfig(BILIVE_CONFIG_KEY, biliveConfig);

    log.info("(BiliLive Service) Alibaba TTS配置已保存");
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
    // 更新配置中的SoVITS设置
    biliveConfig.tts.sovits = {
      ...biliveConfig.tts.sovits,
      ...configData,
    };

    // 保存完整配置
    storage.saveConfig(BILIVE_CONFIG_KEY, biliveConfig);

    log.info("(BiliLive Service) SoVITS TTS配置已保存");
    return success(configData);
  } catch (err) {
    log.error("(BiliLive Service) Failed to save SoVITS TTS config:", err);
    return error("Failed to save SoVITS TTS config: " + err.message);
  }
}

// Function to read config from storage
async function getConfig() {
  try {
    // Load latest config from storage (this already merges with default config)
    await loadAllConfig();

    // Return the complete config object (which now contains merged defaults)
    return biliveConfig;
  } catch (err) {
    log.error("(BiliLive Service) Error in getConfig:", err);
    // Return default config if error
    return DEFAULT_BILIVE_CONFIG;
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

    // 初始化数据记录
    if (
      biliveConfig.recordDanmaku ||
      biliveConfig.recordGift ||
      biliveConfig.recordVisitor
    ) {
      initDataRecording(currentRoomId);
    }

    // Create BLiveClient instance
    client = new BLiveClient(
      {
        SESSDATA: biliveConfig.SESSDATA,
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
      // 关闭记录文件
      closeDataRecording();
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
      closeDataRecording();
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
    closeDataRecording();
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

  // 关闭数据记录
  closeDataRecording();
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

    // 记录弹幕数据到文件
    if (biliveConfig.recordDanmaku && danmakuStream) {
      recordDanmaku(danmakuData);
    }

    // Check blacklist users and keywords
    if (
      biliveConfig.black_user?.includes(uname) ||
      biliveConfig.black_text?.some((keyword) => msg.includes(keyword))
    ) {
      log.info(
        `(BiliLive Service) Blocked danmaku from blacklisted user ${uname}`
      );
      return;
    }

    // Check if TTS is enabled
    if (biliveConfig.ttsEnabled && biliveConfig.readDanmaku) {
      log.debug(
        `(BiliLive Service) Danmaku TTS enabled, preparing to speak: [${uname}] ${msg}`
      );
      const text = biliveConfig.voice_text?.danmaku
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
    const giftData = {
      uid,
      uname,
      giftName,
      giftId,
      num,
      price,
      totalCoin,
      timestamp: Date.now(),
      coinType,
    };
    sendToRenderer("bililive-gift", giftData);

    // 记录礼物数据到文件
    if (biliveConfig.recordGift && giftStream) {
      recordGift(giftData);
    }

    // Record gift merge status
    const giftKey = `${uid}-${giftId}-${batchComboId}`; // Merge Key
    log.debug(
      `(BiliLive Service) Gift Key: ${giftKey}, Merge window: ${
        biliveConfig.continuous_gift_interval || 1
      } seconds`
    );

    if (!biliveConfig.ttsEnabled || !biliveConfig.readGift) {
      log.debug(`(BiliLive Service) Gift TTS disabled, skipping speech`);
      return;
    }

    const interval = (biliveConfig.continuous_gift_interval || 1) * 1000; // Merge window (ms)

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
        const text = biliveConfig.voice_text?.gift
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
          const text = biliveConfig.voice_text?.gift
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

    if (biliveConfig.ttsEnabled && biliveConfig.readLike) {
      log.debug(
        `(BiliLive Service) Like TTS enabled, preparing to speak: [${uname}] ${likeText}`
      );
      const text = biliveConfig.voice_text?.like
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

    const visitorData = {
      uid,
      uname,
      medalLevel,
      medalName,
      guardLevel,
      timestamp: Date.now(),
    };

    sendToRenderer("bililive-enter", visitorData);

    // 记录访客数据到文件
    if (biliveConfig.recordVisitor && visitorStream) {
      recordVisitor(visitorData);
    }

    // Check blacklist
    if (biliveConfig.black_user?.includes(uname)) {
      log.info(
        `(BiliLive Service) Blocked enter message from blacklisted user ${uname}`
      );
      return;
    }

    // Welcome level filter
    const welcomeLevel = biliveConfig.welcome_level || 0;
    if (
      medalLevel >= welcomeLevel &&
      biliveConfig.ttsEnabled &&
      biliveConfig.readEnter
    ) {
      log.debug(
        `(BiliLive Service) Enter TTS enabled, preparing to speak: [${uname}] Fan medal level[${medalLevel}] >= Set level[${welcomeLevel}]`
      );
      const text = biliveConfig.voice_text?.enter.replace("{uname}", uname);
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

  if (biliveConfig.ttsEnabled) {
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

  if (biliveConfig.ttsEnabled) {
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
  // Check if biliveConfig is loaded properly
  if (!biliveConfig || typeof biliveConfig !== "object") {
    log.error("(BiliLive Service) biliveConfig is not properly initialized");
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
  if (biliveConfig.ttsEnabled === undefined) {
    log.warn(
      "(BiliLive Service) ttsEnabled is undefined, setting to default true"
    );
    biliveConfig.ttsEnabled = true;
    // Save this change to storage
    storage.saveConfig(BILIVE_CONFIG_KEY, biliveConfig);
  }

  if (!text || !biliveConfig.ttsEnabled) {
    log.debug(
      `(BiliLive Service) TTS skipped: ${!text ? "Empty text" : "TTS disabled"}`
    );
    return;
  }

  // log.debug(`(BiliLive Service) Added to TTS queue: "${text}"`);
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

  // 获取TTS模式
  let ttsMode = biliveConfig.tts?.mode || "local";

  // 检查是否使用settings中的配置
  const settings = storage.readConfig("settings", {});
  const useAzure =
    settings.azure && settings.azure.enabled && settings.azure.key;

  // 优先使用settings中的设置决定TTS模式
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
        await azureTTS(text);
        break;
      case "aliyun":
        await alibabaTTS(text);
        break;
      case "sovits":
        await sovitsTTS(text);
        break;
      case "local":
      default:
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
    const interval = biliveConfig.max_next_interval || 100;
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
      // 准备语音设置
      const settings = {
        speed: 1.0,
      };

      // 确保文本编码正确
      const encodedText = Buffer.from(text, "utf8").toString("utf8");

      // 直接调用local.js中的play方法
      const localProvider = require("../provider/local");
      const result = await localProvider.play(encodedText, settings);

      if (!result.success) {
        log.error("(BiliLive Service) Local TTS playback error:", result.error);
        reject(new Error(result.error || "Local TTS playback failed"));
      } else {
        log.debug("(BiliLive Service) Local TTS playback completed");
        resolve();
      }
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
  // 获取Azure配置
  const config = biliveConfig.tts?.azure || {};

  // 检查配置是否完整
  if (!config.azure_key || !config.azure_region) {
    // 尝试使用系统全局配置
    const systemSetting = storage.readConfig("settings", {});

    if (systemSetting.azure.key && systemSetting.azure.region) {
      log.info("(BiliLive Service) Using system global Azure configuration");

      // 使用系统全局配置
      config.azure_key = systemSetting.azure.key;
      config.azure_region = systemSetting.azure.region;
    } else {
      throw new Error(
        "Azure TTS configuration incomplete: Missing Key and Region in both Bilive-specific and system configurations"
      );
    }
  }

  // 确保voice model存在，如果不存在使用默认值
  if (!config.azure_model) {
    log.warn("(BiliLive Service) Azure voice model not set, using default");
    config.azure_model = "zh-CN-XiaoxiaoMultilingualNeural";
  }

  // 确保speed和pitch有值
  if (!config.speed) config.speed = 1.0;
  if (!config.pitch) config.pitch = 0;

  // 准备Azure配置
  const azureConfig = {
    key: config.azure_key,
    region: config.azure_region,
  };

  // 准备语音设置
  const settings = {
    voice: config.azure_model,
    speed: config.speed,
    pitch: config.pitch,
  };

  log.debug(
    `(BiliLive Service) Azure TTS using model: ${settings.voice}, text: "${text}"`
  );

  try {
    // 直接调用azure.js中的play方法
    const azureProvider = require("../provider/azure");
    const result = await azureProvider.play(text, settings, azureConfig);

    if (!result.success) {
      throw new Error(result.message || "Azure TTS playback failed");
    }

    // 重要修复：添加以下代码，手动播放返回的音频数据
    if (result.data && result.data.audioData) {
      log.debug("(BiliLive Service) Playing Azure TTS audio data...");

      // 创建临时文件
      const tempFile = path.join(os.tmpdir(), `azure_tts_${Date.now()}.wav`);
      fs.writeFileSync(tempFile, result.data.audioData);

      // 使用electron-sound包播放音频文件
      const sound = require("sound-play");
      await sound.play(tempFile);

      // 播放完成后删除临时文件
      try {
        fs.unlinkSync(tempFile);
      } catch (err) {
        log.error("(BiliLive Service) Failed to delete temp file:", err);
      }
    } else {
      log.error("(BiliLive Service) No audio data returned from Azure TTS");
    }

    log.debug("(BiliLive Service) Azure TTS playback finished.");
    return Promise.resolve();
  } catch (err) {
    log.error("(BiliLive Service) Azure TTS Error:", err);
    throw err;
  }
}

/**
 * Alibaba TTS (NUI)
 * @param {string} text
 */
async function alibabaTTS(text) {
  const config = biliveConfig.tts?.alibaba || {};
  if (!config || !config.alibaba_appkey || !config.alibaba_token) {
    throw new Error(
      "Alibaba TTS configuration incomplete (AppKey and Token required)"
    );
  }

  try {
    log.debug(`(BiliLive Service) Using Alibaba TTS to speak: "${text}"`);

    // 准备阿里云配置
    const aliyunConfig = {
      appkey: config.alibaba_appkey,
      token: config.alibaba_token,
      endpoint:
        config.alibaba_endpoint ||
        "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1",
    };

    // 准备语音设置
    const settings = {
      voice: config.alibaba_model || "xiaoyun",
      speed: parseInt(config.speed || 0), // 语速，-500 到 500
      volume: 100, // 默认音量
      pitch: 0, // 默认音调
    };

    // 创建临时文件路径
    const tempFile = path.join(os.tmpdir(), `alibaba_tts_${Date.now()}.wav`);

    // 使用 aliyun.js 的 synthesize 方法
    try {
      const aliyunProvider = require("../provider/aliyun");
      const result = await aliyunProvider.synthesize(
        text,
        tempFile,
        settings,
        aliyunConfig
      );

      if (result.success && fs.existsSync(tempFile)) {
        log.debug(
          `(BiliLive Service) Alibaba TTS synthesis successful, playing audio from ${tempFile}`
        );

        // 使用sound-play播放音频文件
        const sound = require("sound-play");
        await sound.play(tempFile);

        // 播放完成后删除临时文件
        try {
          fs.unlinkSync(tempFile);
        } catch (err) {
          log.error("(BiliLive Service) Failed to delete temp file:", err);
        }

        return Promise.resolve();
      } else {
        throw new Error(
          "Failed to synthesize speech with Alibaba TTS: " +
            (result.message || "Unknown error")
        );
      }
    } catch (err) {
      log.error("(BiliLive Service) Error using Alibaba TTS provider:", err);
      throw err;
    }
  } catch (err) {
    log.error("(BiliLive Service) Alibaba TTS Error:", err);
    // 如果失败，使用本地TTS作为备选方案
    log.warn("(BiliLive Service) Falling back to local TTS");
    await localTTS(`阿里云语音合成失败，使用本地TTS播放: ${text}`);
    return Promise.resolve();
  }
}

/**
 * SoVITS TTS (requires local SoVITS API service)
 * @param {string} text
 */
async function sovitsTTS(text) {
  const config = biliveConfig.tts?.sovits || {};
  if (!config || !config.sovits_host) {
    throw new Error(
      "SoVITS TTS configuration incomplete (Host address required)"
    );
  }

  try {
    log.debug(`(BiliLive Service) Using SoVITS TTS to speak: "${text}"`);

    // 准备SoVITS配置
    const sovitsConfig = {
      sovits_host: config.sovits_host,
      format: config.sovits_format || "wav",
    };

    // 准备语音设置
    const settings = {
      model: config.sovits_model,
      language: config.sovits_language || "auto",
      speed: config.sovits_speed || 1.0,
      emotion: config.sovits_emotion,
      topK: config.sovits_top_k,
      topP: config.sovits_top_p,
      temperature: config.sovits_temperature,
    };

    // 直接调用sovits.js中的play方法
    const sovitsProvider = require("../provider/sovits");
    const result = await sovitsProvider.play(text, settings, sovitsConfig);

    if (!result.success) {
      throw new Error(result.message || "SoVITS TTS playback failed");
    }

    log.debug("(BiliLive Service) SoVITS TTS playback finished.");
    return Promise.resolve();
  } catch (err) {
    log.error("(BiliLive Service) SoVITS TTS Error:", err);
    // 如果SoVITS调用失败，使用本地TTS作为备选方案
    log.warn("(BiliLive Service) Falling back to local TTS");
    await localTTS(`播放 SoVITS 合成语音`); // 仅作提示
    return Promise.resolve();
  }
}

/**
 * Get available TTS voices
 * @returns {Promise<string[]>} List of available voice names
 */
function getAvailableVoices() {
  return new Promise((resolve) => {
    log.debug("(BiliLive Service) Getting installed voices...");

    try {
      // 直接调用local.js中的方法
      const localProvider = require("../provider/local");
      localProvider
        .getAvailableVoices()
        .then((voices) => {
          if (!voices || !Array.isArray(voices)) {
            log.warn("(BiliLive Service) No voices returned or invalid format");
            resolve([]);
          } else {
            log.debug(
              `(BiliLive Service) Available voices: ${voices.join(", ")}`
            );
            resolve(voices);
          }
        })
        .catch((err) => {
          log.error("(BiliLive Service) Error getting installed voices:", err);
          resolve([]);
        });
    } catch (err) {
      log.error("(BiliLive Service) Error accessing local provider:", err);
      resolve([]);
    }
  });
}

/**
 * Save local TTS configuration
 * @returns {Promise<object>}
 */
async function saveLocalConfig() {
  try {
    log.info(`(BiliLive Service) Local TTS config saved`);
    return success({ message: "Local TTS config saved" });
  } catch (err) {
    log.error("(BiliLive Service) Failed to save local TTS config:", err);
    return error("Failed to save local TTS config: " + err.message);
  }
}

/**
 * 初始化数据记录
 * @param {number} roomId 房间ID
 */
function initDataRecording(roomId) {
  try {
    // 关闭之前的文件流（如果有）
    closeDataRecording();

    // 获取存储路径
    const storagePath = storage.getStoragePath();

    // 创建房间目录
    const roomDir = path.join(storagePath, String(roomId));
    fs.ensureDirSync(roomDir);

    // 创建本次直播数据目录 (blive-{年月日时分秒})
    const now = new Date();
    const dateStr = now
      .toISOString()
      .replace(/[T:.-]/g, "")
      .slice(0, 14); // 格式化为年月日时分秒
    const sessionDir = path.join(roomDir, `blive-${dateStr}`);
    fs.ensureDirSync(sessionDir);

    log.info(`(BiliLive Service) Data recording path: ${sessionDir}`);
    recordPath = sessionDir;
    recordEnabled = true;

    // 初始化文件流
    if (biliveConfig.recordDanmaku) {
      const danmakuFile = path.join(sessionDir, "danmaku.jsonl");
      danmakuStream = fs.createWriteStream(danmakuFile, { flags: "a" });
      log.info(`(BiliLive Service) Danmaku recording enabled: ${danmakuFile}`);
    }

    if (biliveConfig.recordGift) {
      const giftFile = path.join(sessionDir, "gift.jsonl");
      giftStream = fs.createWriteStream(giftFile, { flags: "a" });
      log.info(`(BiliLive Service) Gift recording enabled: ${giftFile}`);
    }

    if (biliveConfig.recordVisitor) {
      const visitorFile = path.join(sessionDir, "visitor.jsonl");
      visitorStream = fs.createWriteStream(visitorFile, { flags: "a" });
      log.info(`(BiliLive Service) Visitor recording enabled: ${visitorFile}`);
    }

    // 创建session.json记录会话信息
    const sessionInfo = {
      roomId,
      startTime: now.toISOString(),
      config: {
        recordDanmaku: biliveConfig.recordDanmaku,
        recordGift: biliveConfig.recordGift,
        recordVisitor: biliveConfig.recordVisitor,
      },
    };

    fs.writeFileSync(
      path.join(sessionDir, "session.json"),
      JSON.stringify(sessionInfo, null, 2)
    );
  } catch (err) {
    log.error(`(BiliLive Service) Failed to initialize data recording:`, err);
    recordEnabled = false;
  }
}

/**
 * 关闭数据记录文件
 */
function closeDataRecording() {
  try {
    if (danmakuStream) {
      danmakuStream.end();
      danmakuStream = null;
    }

    if (giftStream) {
      giftStream.end();
      giftStream = null;
    }

    if (visitorStream) {
      visitorStream.end();
      visitorStream = null;
    }

    // 更新session.json的结束时间（如果存在）
    if (recordPath && fs.existsSync(recordPath)) {
      const sessionFile = path.join(recordPath, "session.json");
      if (fs.existsSync(sessionFile)) {
        try {
          const sessionInfo = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
          sessionInfo.endTime = new Date().toISOString();
          fs.writeFileSync(sessionFile, JSON.stringify(sessionInfo, null, 2));
        } catch (e) {
          log.error(`(BiliLive Service) Failed to update session info:`, e);
        }
      }
    }

    recordEnabled = false;
    recordPath = null;
    log.info(`(BiliLive Service) Data recording stopped`);
  } catch (err) {
    log.error(`(BiliLive Service) Error closing data recording:`, err);
  }
}

/**
 * 记录弹幕数据
 * @param {object} data 弹幕数据
 */
function recordDanmaku(data) {
  if (!danmakuStream || !recordEnabled) return;

  try {
    danmakuStream.write(JSON.stringify(data) + "\n");
  } catch (err) {
    log.error(`(BiliLive Service) Failed to record danmaku:`, err);
  }
}

/**
 * 记录礼物数据
 * @param {object} data 礼物数据
 */
function recordGift(data) {
  if (!giftStream || !recordEnabled) return;

  try {
    giftStream.write(JSON.stringify(data) + "\n");
  } catch (err) {
    log.error(`(BiliLive Service) Failed to record gift:`, err);
  }
}

/**
 * 记录访客数据
 * @param {object} data 访客数据
 */
function recordVisitor(data) {
  if (!visitorStream || !recordEnabled) return;

  try {
    visitorStream.write(JSON.stringify(data) + "\n");
  } catch (err) {
    log.error(`(BiliLive Service) Failed to record visitor:`, err);
  }
}

module.exports = {
  // 连接功能
  connect,
  closeClient,

  // 配置相关
  loadAllConfig,
  getConfig,
  saveBiliveConfig,
  saveTTSMode,
  saveAzureConfig,
  saveAlibabaConfig,
  saveSovitsConfig,
  saveLocalConfig,

  // TTS相关
  speechText, // 手动播放文本（用于测试）

  // 常量
  DEFAULT_BILIVE_CONFIG,
};
