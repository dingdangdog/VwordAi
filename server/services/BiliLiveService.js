/**
 * BiliLive Service
 * 封装与B站直播交互的核心逻辑
 */
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const log = require('electron-log');
const say = require('say');
const WebSocket = require('ws');
const { BrowserWindow } = require('electron');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const storage = require('../utils/storage');
const { success, error } = require('../utils/result');

let ws = null;
let heartbeatInterval = null;
let win = null;
let currentRoomId = null;
let biliConfig = {};
let ttsConfig = {
  mode: 'local',
  azure: {},
  alibaba: {},
  sovits: {},
};
let isConnecting = false;
let isClosing = false;
let giftMergeMap = new Map();

const BILI_CONFIG_KEY = 'bili_config';
const BILI_AZURE_CONFIG_KEY = 'bili_azureConfig';
const BILI_ALIBABA_CONFIG_KEY = 'bili_alibabaConfig';
const BILI_SOVITS_CONFIG_KEY = 'bili_sovitsConfig';

const DEFAULT_BILI_CONFIG = {
  platform: 'win',
  room_ids: [], // {id, name}
  bilibili_SESSION: '',
  bilibili_heart_print: 10,
  continuous_gift_interval: 1, // 秒
  welcome_level: 0,
  voice_text: {
    enter: '欢迎 {uname} 进入直播间，记得常来玩哦！',
    danmaku: '{uname}说：{msg}',
    gift: '感谢 {uname} 赠送的 {num}个{gift_name}，谢谢老板，老板大气！',
    like: '感谢 {uname} {like_text}',
    like_total: '本次直播点赞数量超过 {limit_num} 次，达到 {click_count} 次'
  },
  like_nums: [66, 188, 300, 500, 666, 888, 999, 1666],
  max_next_interval: 100, // 语音间隔 ms
  black_user: [],
  black_text: [],
  ttsEnabled: true, // 是否启用TTS
  readDanmaku: true,
  readGift: true,
  readEnter: true,
  readLike: true,
};

const DEFAULT_AZURE_CONFIG = {
  azure_key: '',
  azure_model: '',
  azure_region: '',
  azure_endpoint: '',
  speed: 1.0,
  pitch: 0,
};

const DEFAULT_ALIBABA_CONFIG = {
  alibaba_appkey: '',
  alibaba_token: '',
  alibaba_model: 'xiaoyun',
  alibaba_endpoint: 'nls-gateway-cn-shanghai.aliyuncs.com',
  speed: 100, // 0-200
};

const DEFAULT_SOVITS_CONFIG = {
  sovits_host: 'http://127.0.0.1:5000/tts',
  sovits_model: '',
  sovits_language: 'auto',
  sovits_emotion: '',
  sovits_top_k: '',
  sovits_top_p: '',
  sovits_temperature: '',
  sovits_batch_size: '',
  sovits_speed: '1.0',
  sovits_save_temp: 'false',
  sovits_stream: 'false',
  sovits_format: 'wav',
};

/**
 * 加载所有相关配置
 */
async function loadAllConfig() {
  biliConfig = storage.readConfig(BILI_CONFIG_KEY, DEFAULT_BILI_CONFIG);
  ttsConfig.mode = storage.readConfig('bili_ttsMode', 'local'); // TTS 模式
  ttsConfig.azure = storage.readConfig(BILI_AZURE_CONFIG_KEY, DEFAULT_AZURE_CONFIG);
  ttsConfig.alibaba = storage.readConfig(BILI_ALIBABA_CONFIG_KEY, DEFAULT_ALIBABA_CONFIG);
  ttsConfig.sovits = storage.readConfig(BILI_SOVITS_CONFIG_KEY, DEFAULT_SOVITS_CONFIG);
  log.info('(BiliLive Service) Config loaded:', { biliConfig, ttsConfig });
}

/**
 * 保存B站配置
 * @param {object} configData
 */
async function saveBiliConfig(configData) {
  try {
    storage.saveConfig(BILI_CONFIG_KEY, configData);
    biliConfig = configData; // 更新内存中的配置
    log.info('(BiliLive Service) Bili config saved.');
    return success(configData);
  } catch (err) {
    log.error('(BiliLive Service) Failed to save Bili config:', err);
    return error('保存B站配置失败: ' + err.message);
  }
}

/**
 * 保存TTS模式
 * @param {string} mode 'local' | 'azure' | 'alibaba' | 'sovits'
 */
async function saveTTSMode(mode) {
  try {
    storage.saveConfig('bili_ttsMode', mode);
    ttsConfig.mode = mode;
    log.info(`(BiliLive Service) TTS mode saved: ${mode}`);
    return success(mode);
  } catch (err) {
    log.error('(BiliLive Service) Failed to save TTS mode:', err);
    return error('保存TTS模式失败: ' + err.message);
  }
}

/**
 * 保存Azure TTS配置
 * @param {object} configData
 */
async function saveAzureConfig(configData) {
  try {
    storage.saveConfig(BILI_AZURE_CONFIG_KEY, configData);
    ttsConfig.azure = configData; // 更新内存中的配置
    log.info('(BiliLive Service) Azure TTS config saved.');
    return success(configData);
  } catch (err) {
    log.error('(BiliLive Service) Failed to save Azure TTS config:', err);
    return error('保存Azure TTS配置失败: ' + err.message);
  }
}

/**
 * 保存阿里云TTS配置
 * @param {object} configData
 */
async function saveAlibabaConfig(configData) {
  try {
    storage.saveConfig(BILI_ALIBABA_CONFIG_KEY, configData);
    ttsConfig.alibaba = configData; // 更新内存中的配置
    log.info('(BiliLive Service) Alibaba TTS config saved.');
    return success(configData);
  } catch (err) {
    log.error('(BiliLive Service) Failed to save Alibaba TTS config:', err);
    return error('保存阿里云TTS配置失败: ' + err.message);
  }
}

/**
 * 保存SoVITS TTS配置
 * @param {object} configData
 */
async function saveSovitsConfig(configData) {
  try {
    storage.saveConfig(BILI_SOVITS_CONFIG_KEY, configData);
    ttsConfig.sovits = configData; // 更新内存中的配置
    log.info('(BiliLive Service) SoVITS TTS config saved.');
    return success(configData);
  } catch (err) {
    log.error('(BiliLive Service) Failed to save SoVITS TTS config:', err);
    return error('保存SoVITS TTS配置失败: ' + err.message);
  }
}

// 从 storage 读取配置的函数
async function getConfig() {
  // 注意：需要适配 vwordai 的存储结构
  // 可能需要读取多个键，例如 bili_*, azure, alibaba, sovits
  biliConfig = storage.readConfig(BILI_CONFIG_KEY, {});
  ttsConfig.azure = storage.readConfig(BILI_AZURE_CONFIG_KEY, {});
  ttsConfig.alibaba = storage.readConfig(BILI_ALIBABA_CONFIG_KEY, {});
  ttsConfig.sovits = storage.readConfig(BILI_SOVITS_CONFIG_KEY, {});
  return { ...biliConfig, ...ttsConfig };
}

// --- 将 blivevoice/handler.js 中的核心逻辑函数迁移到这里 --- 
// 例如： connect, closeBLiveClient, getRealRoomId, getWebSocketInfo, 
//       makeAuthPacket, makeHeartbeatPacket, makePacket, handleMessage, 
//       processMessage, handleDanmakuMessage, handleGiftMessage, 
//       handleLikeMessage, handleEnterMessage, speechText, 
//       localTTS, azureTTS, alibabaTTS, sovitsTTS 等

// 注意：需要修改这些函数，使其：
// 1. 使用 getConfig 和 saveConfig 读写配置
// 2. 通过参数或全局变量获取 BrowserWindow 实例 (win)
// 3. 使用 vwordai 的日志系统 (如果不同)
// 4. 将 win.webContents.send 调用的事件名进行统一或传递给 Controller 处理
// 5. 错误处理和返回格式与 vwordai 保持一致

// --- B站直播连接与消息处理 ---

/**
 * 连接B站直播间
 * @param {number} roomIdValue 直播间ID
 */
async function connect(roomIdValue) {
  if (isConnecting || ws) {
    log.warn(`(BiliLive Service) Already connecting or connected to room ${currentRoomId}.`);
    return error(`正在连接或已连接到房间 ${currentRoomId}`);
  }
  isConnecting = true;
  log.info(`(BiliLive Service) Attempting to connect to room: ${roomIdValue}`);
  sendToRenderer('bililive-status-text', `正在连接到房间 ${roomIdValue}...`);

  try {
    win = BrowserWindow.getFocusedWindow(); // 获取当前窗口实例
    if (!win) {
        isConnecting = false;
        log.error('(BiliLive Service) Main window not found.');
        return error('主窗口未找到');
    }

    await loadAllConfig(); // 加载最新配置

    closeClient(); // 关闭之前的连接（如果有）

    currentRoomId = parseInt(roomIdValue);

    // 获取房间真实ID和WebSocket地址
    const realRoomId = await getRealRoomId(currentRoomId);
    if (!realRoomId) {
      sendToRenderer('bililive-status-text', `连接失败：获取房间真实ID失败`);
      isConnecting = false;
      return error('获取房间真实ID失败');
    }
    log.info(`(BiliLive Service) Real room ID: ${realRoomId}`);

    // 获取WebSocket连接信息
    const wsInfo = await getWebSocketInfo(realRoomId);
    if (!wsInfo || !wsInfo.host) {
      sendToRenderer('bililive-status-text', `连接失败：获取WebSocket信息失败`);
      isConnecting = false;
      return error('获取WebSocket连接信息失败');
    }
    log.info(`(BiliLive Service) WebSocket info obtained: wss://${wsInfo.host}/sub`);

    // 连接WebSocket
    const wsUrl = `wss://${wsInfo.host}/sub`;
    ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      isConnecting = false;
      log.info(`(BiliLive Service) Connected to room ${currentRoomId}`);
      sendConnectionStatus(true, currentRoomId);
      sendToRenderer('bililive-message', { type: 'info', content: `已连接到直播间 ${currentRoomId}` });
      sendToRenderer('bililive-status-text', `已连接到房间 ${currentRoomId}`);

      // 发送认证包
      const authPacket = makeAuthPacket(realRoomId, wsInfo.token);
      ws.send(authPacket);
      log.debug('(BiliLive Service) Auth packet sent.');

      // 启动心跳
      startHeartbeat();
    });

    ws.on('message', (data) => {
      handleMessage(data);
    });

    ws.on('error', (err) => {
      isConnecting = false;
      log.error('(BiliLive Service) WebSocket error:', err);
      sendConnectionStatus(false, currentRoomId);
      sendToRenderer('bililive-message', { type: 'error', content: 'WebSocket连接出错: ' + err.message });
      sendToRenderer('bililive-status-text', `连接错误: ${err.message}`);
      closeClient(); // 出错时关闭连接
    });

    ws.on('close', (code, reason) => {
      isConnecting = false;
      if (!isClosing) { // 避免手动关闭时重复记录
        log.warn(`(BiliLive Service) WebSocket closed. Code: ${code}, Reason: ${reason}`);
        sendConnectionStatus(false, currentRoomId);
        sendToRenderer('bililive-message', { type: 'info', content: 'WebSocket连接已断开' });
        sendToRenderer('bililive-status-text', `连接已断开`);
      }
      stopHeartbeat();
      ws = null;
      currentRoomId = null;
    });

    return success({ message: '连接中...' }); // 返回成功，表示连接过程已启动

  } catch (err) {
    isConnecting = false;
    log.error('(BiliLive Service) Connection failed:', err);
    sendConnectionStatus(false, roomIdValue);
    sendToRenderer('bililive-message', { type: 'error', content: '连接失败: ' + err.message });
    sendToRenderer('bililive-status-text', `连接失败: ${err.message}`);
    closeClient();
    return error('连接失败: ' + err.message);
  }
}

/**
 * 关闭WebSocket连接
 */
function closeClient() {
    if (isClosing || !ws) {
        return;
    }
    isClosing = true;
    log.info('(BiliLive Service) Closing WebSocket connection...');
    stopHeartbeat();
    if (ws) {
        ws.close();
        ws = null; // Ensure ws is nullified
        sendConnectionStatus(false, currentRoomId);
        sendToRenderer('bililive-message', { type: 'info', content: '连接已手动断开' });
        sendToRenderer('bililive-status-text', `连接已断开`);
        currentRoomId = null;
    }
    giftMergeMap.clear(); // 清空礼物合并映射
    isClosing = false; // Reset flag after closing attempt
}


/**
 * 启动心跳包
 */
function startHeartbeat() {
    stopHeartbeat(); // 先停止旧的
    log.debug('(BiliLive Service) Starting heartbeat.');
    heartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(makeHeartbeatPacket());
                log.debug('(BiliLive Service) Heartbeat sent.');
            } catch (err) {
                log.error('(BiliLive Service) Failed to send heartbeat:', err);
                closeClient(); // 发送心跳失败，可能连接已失效
            }
        } else {
            log.warn('(BiliLive Service) WebSocket not open, stopping heartbeat.');
            stopHeartbeat(); // 连接断开，停止心跳
        }
    }, 30000); // B站要求30秒
}

/**
 * 停止心跳包
 */
function stopHeartbeat() {
    if (heartbeatInterval) {
        log.debug('(BiliLive Service) Stopping heartbeat.');
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}


/**
 * 获取房间真实ID
 * @param {number} shortRoomId 短号或原始ID
 * @returns {Promise<number|null>} 真实房间ID或null
 */
async function getRealRoomId(shortRoomId) {
  try {
    const url = `https://api.live.bilibili.com/room/v1/Room/room_init?id=${shortRoomId}`;
    const response = await axios.get(url, { timeout: 5000 });
    if (response.data.code === 0) {
      return response.data.data.room_id;
    } else {
      log.error(`(BiliLive Service) Failed to get real room ID for ${shortRoomId}:`, response.data.message);
      return null;
    }
  } catch (err) {
    log.error(`(BiliLive Service) Error getting real room ID for ${shortRoomId}:`, err);
    return null;
  }
}

/**
 * 获取WebSocket连接信息 (host, port, token)
 * @param {number} realRoomId 真实房间ID
 * @returns {Promise<object|null>} 连接信息或null
 */
async function getWebSocketInfo(realRoomId) {
  try {
    // 注意：需要使用已登录的 Cookie 获取带有 token 的地址，否则可能无法接收所有消息
    const headers = biliConfig.bilibili_SESSION ? { Cookie: `SESSDATA=${biliConfig.bilibili_SESSION}` } : {};
    const url = `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${realRoomId}`;
    const response = await axios.get(url, { headers, timeout: 5000 });
    if (response.data.code === 0) {
      // 优先选择 host_list 中的 wss 地址
      const hostInfo = response.data.data.host_list.find(h => h.host && h.wss_port === 443);
      if (hostInfo) {
        return { host: hostInfo.host, port: hostInfo.wss_port, token: response.data.data.token };
      } else {
         log.warn(`(BiliLive Service) No suitable WSS host found for room ${realRoomId}. Falling back.`);
         // Fallback or handle error appropriately if no suitable host is found
         if (response.data.data.host_list.length > 0) {
            const firstHost = response.data.data.host_list[0];
             return { host: firstHost.host, port: firstHost.wss_port || firstHost.ws_port, token: response.data.data.token };
         }
      }
    } else {
      log.error(`(BiliLive Service) Failed to get WebSocket info for room ${realRoomId}:`, response.data.message);
    }
    return null;
  } catch (err) {
    log.error(`(BiliLive Service) Error getting WebSocket info for room ${realRoomId}:`, err);
    return null;
  }
}

/**
 * 构造认证包
 * @param {number} roomId 真实房间ID
 * @param {string} token 连接令牌
 * @returns {Buffer}
 */
function makeAuthPacket(roomId, token) {
  const authBody = JSON.stringify({
    uid: 0, // B站改版，uid可以为0
    roomid: roomId,
    protover: 3, // 使用 protover 3 支持 brotli 压缩
    platform: 'web',
    type: 2,
    key: token,
  });
  return makePacket(7, Buffer.from(authBody)); // Operation 7 for Auth
}

/**
 * 构造心跳包
 * @returns {Buffer}
 */
function makeHeartbeatPacket() {
  return makePacket(2, Buffer.from('')); // Operation 2 for Heartbeat
}

/**
 * 构造 WebSocket 数据包 (协议版本2)
 * Header (16 bytes) + Body
 * Header:
 *   Packet Length (4 bytes, Big Endian) - Total length including header
 *   Header Length (2 bytes, Big Endian) - Usually 16
 *   Protocol Version (2 bytes, Big Endian) - 0 (Raw JSON), 1 (Heartbeat/View Count), 2 (Zlib), 3 (Brotli)
 *   Operation (4 bytes, Big Endian) - 2 (Heartbeat), 3 (View Count), 5 (Command), 7 (Auth), 8 (Auth Reply)
 *   Sequence ID (4 bytes, Big Endian) - Usually 1
 * @param {number} operation 操作码
 * @param {Buffer} body 数据体
 * @returns {Buffer} 完整的数据包Buffer
 */
function makePacket(operation, body) {
  const headerLength = 16;
  const packetLength = headerLength + body.length;
  const header = Buffer.alloc(headerLength);

  header.writeUInt32BE(packetLength, 0);       // Packet Length
  header.writeUInt16BE(headerLength, 4);       // Header Length
  // Protocol Version: 0 for Auth/Heartbeat JSON, 1 for ViewCount, use 0 for simplicity here?
  // B站现在心跳包用 version 1，认证包和消息用 version 3 (brotli) 或 2 (zlib) 或 0 (json)
  // 认证包用 protover 3，所以这里应该也用 3？但心跳包用的是 1。
  // 根据实践，心跳包用 Op=2, Ver=1；认证包用 Op=7, Ver=0/2/3 (看body内容)；消息通知用 Op=5, Ver=3。
  // 为简单起见，心跳 Op=2, Ver=1; 认证 Op=7, Ver=0; 消息在接收时处理 Ver=3。
  const protocolVersion = (operation === 2) ? 1 : 0;
  header.writeUInt16BE(protocolVersion, 6);   // Protocol Version
  header.writeUInt32BE(operation, 8);         // Operation
  header.writeUInt32BE(1, 12);                // Sequence ID

  return Buffer.concat([header, body]);
}


/**
 * 处理收到的原始消息数据 (可能包含多个包)
 * @param {Buffer} data
 */
async function handleMessage(data) {
    const reader = new BufferReader(data);
    while (reader.hasMore()) {
        try {
            const packetLen = reader.readUInt32BE();
            const headerLen = reader.readUInt16BE();
            const protoVer = reader.readUInt16BE();
            const op = reader.readUInt32BE();
            const seq = reader.readUInt32BE(); // Sequence (ignored)

            const bodyLen = packetLen - headerLen;
            if (bodyLen < 0) {
                log.error(`(BiliLive Service) Invalid packet length received: packetLen=${packetLen}, headerLen=${headerLen}`);
                break; // Stop processing this buffer
            }

             const body = reader.readBuffer(bodyLen); // Read the actual body based on calculated length

            switch (op) {
                case 3: // Heartbeat Reply (Popularity)
                    const popularity = body.readUInt32BE();
                    log.debug(`(BiliLive Service) Popularity: ${popularity}`);
                    sendToRenderer('bililive-popularity', popularity);
                    break;
                case 5: // Command (Notification)
                    await processCommand(protoVer, body);
                    break;
                case 8: // Auth Reply
                    log.info('(BiliLive Service) Auth successful.');
                     sendToRenderer('bililive-message', { type: 'info', content: '直播间连接认证成功' });
                    break;
                default:
                    log.warn(`(BiliLive Service) Unhandled operation: ${op}`);
            }
        } catch (err) {
            log.error('(BiliLive Service) Error parsing message packet:', err, 'Original data segment might be corrupted.');
             log.error('Buffer causing error:', reader.buffer.toString('hex'));
            break; // Stop processing this buffer if parsing fails
        }
    }
}


/**
 * 处理命令消息 (Op=5)
 * @param {number} protoVer 协议版本 (0: JSON, 2: Zlib, 3: Brotli)
 * @param {Buffer} body 数据体
 */
async function processCommand(protoVer, body) {
    let messages;
    try {
        switch (protoVer) {
            case 0: // Raw JSON
                messages = [JSON.parse(body.toString('utf8'))];
                break;
            case 2: // Zlib compressed JSON
                const zlib = require('zlib');
                const decompressedZlib = zlib.inflateSync(body);
                 await handleMessage(decompressedZlib); // Decompressed data might contain multiple packets
                return; // handleMessage will process the decompressed packets
            case 3: // Brotli compressed JSON
                const brotli = require('brotli'); // 注意：需要安装此依赖
                const decompressedBrotli = Buffer.from(brotli.decompress(body));
                 await handleMessage(decompressedBrotli); // Decompressed data might contain multiple packets
                return; // handleMessage will process the decompressed packets
            default:
                log.warn(`(BiliLive Service) Unsupported protocol version for command: ${protoVer}`);
                return;
        }

         messages.forEach(msgObj => processSingleMessage(msgObj));

    } catch (err) {
        log.error('(BiliLive Service) Error processing command body:', err, `ProtoVer: ${protoVer}`, 'Body:', body.toString('utf8')); // Log raw body on error
    }
}

/**
 * Buffer 读取辅助类 (简化版)
 */
class BufferReader {
    constructor(buffer) {
        this.buffer = buffer;
        this.offset = 0;
    }
    hasMore() {
        return this.offset < this.buffer.length;
    }
    readUInt32BE() {
        const value = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return value;
    }
    readUInt16BE() {
        const value = this.buffer.readUInt16BE(this.offset);
        this.offset += 2;
        return value;
    }
    readBuffer(length) {
         if (this.offset + length > this.buffer.length) {
            throw new Error(`BufferReader: Attempt to read beyond buffer bounds. Offset=${this.offset}, Length=${length}, BufferSize=${this.buffer.length}`);
        }
        const value = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return value;
    }
}


/**
 * 向渲染进程发送消息
 * @param {string} channel 事件通道
 * @param {any} data 数据
 */
function sendToRenderer(channel, data) {
  if (win && win.webContents) {
    try {
        win.webContents.send(channel, data);
    } catch (err) {
        log.error(`(BiliLive Service) Failed to send message to renderer on channel ${channel}:`, err);
    }
  } else {
      log.warn(`(BiliLive Service) Cannot send message to renderer, window not available. Channel: ${channel}`);
  }
}

/**
 * 发送连接状态到渲染进程
 * @param {boolean} connected 是否连接
 * @param {number|null} roomId 房间号
 */
function sendConnectionStatus(connected, roomId) {
    sendToRenderer('bililive-connection-status', { connected, roomId });
}

/**
 * 处理单个解压/解析后的消息对象
 * @param {object} msgObj
 */
function processSingleMessage(msgObj) {
     log.debug('(BiliLive Service) Received Command:', JSON.stringify(msgObj));
     sendToRenderer('bililive-raw-message', msgObj); // 发送原始消息给渲染层（用于调试或高级处理）

    const cmd = msgObj.cmd;
    switch (cmd) {
        case 'DANMU_MSG': // 弹幕消息
            handleDanmakuMessage(msgObj);
            break;
        case 'SEND_GIFT': // 礼物消息
            handleGiftMessage(msgObj);
            break;
        case 'LIKE_INFO_V3_CLICK': // 点赞消息 (普通点赞)
             handleLikeMessage(msgObj.data);
            break;
        case 'LIKE_INFO_V3_UPDATE': // 点赞计数更新
            // 可以在这里更新总点赞数显示，但通常点赞消息会更频繁
            // sendToRenderer('bililive-like-update', msgObj.data.count);
            break;
        case 'INTERACT_WORD': // 进入直播间消息
            handleEnterMessage(msgObj.data);
            break;
         case 'ENTRY_EFFECT': // 进入直播间特效 (高等级用户)
            // 可以考虑添加单独处理
            break;
         case 'WELCOME': // 欢迎高等级用户/舰长
             // msgObj.data.uname
             break;
         case 'WELCOME_GUARD': // 欢迎舰长
             // msgObj.data.username
             break;
        case 'SUPER_CHAT_MESSAGE': // SC 消息
            handleSuperChatMessage(msgObj.data);
            break;
        case 'GUARD_BUY': // 上舰消息
            handleGuardBuyMessage(msgObj.data);
            break;
        // --- 其他可能需要处理的消息 ---
        case 'ROOM_REAL_TIME_MESSAGE_UPDATE': // 粉丝数等更新
            // msgObj.data.fans
            // sendToRenderer('bililive-room-update', { fans: msgObj.data.fans });
            break;
        case 'STOP_LIVE_ROOM_LIST': // 停止直播的房间列表？（可能不需要）
            break;
        case 'WIDGET_BANNER': // 小部件横幅（例如高能榜）
            break;
        case 'ONLINE_RANK_COUNT': // 在线排名计数
            // msgObj.data.count
            // sendToRenderer('bililive-online-count', msgObj.data.count);
            break;
         case 'NOTICE_MSG': // 通知消息 (各种系统通知)
            log.info(`(BiliLive Service) Notice Msg: ${msgObj.msg_self}`);
             sendToRenderer('bililive-message', { type: 'notice', content: msgObj.msg_self });
            break;
        // ... 根据需要添加更多 case ...
        default:
            // Log unhandled commands if necessary, but can be noisy
            // log.debug(`(BiliLive Service) Unhandled command type: ${cmd}`);
            sendToRenderer('bililive-other-message', msgObj); // 发送其他未处理消息
            break;
    }
}


/**
 * 处理弹幕消息
 * @param {object} msgObj DANMU_MSG 对象
 */
function handleDanmakuMessage(msgObj) {
    // msgObj.info 样例:
    // [
    //   [ 0, 1, 25, 16777215, 1674834631, -1101134182, 0, '...', 0, 0, 0, '', 0, '{}' ],
    //   '弹幕内容', // msg
    //   [ 10000, 'User Name', 0, 0, 0, 10000, 1, '' ], // [uid, uname, is_admin, vip, svip, medal_level, medal_name, title]
    //   [ 12, '勋章名', '主播名', 27305483, 16777215, '', 0 ], // [level, medal_name, anchor_uname, room_id, medal_color, special_medal, guard_level]
    //   [ 20, 0, 10000, 60 ], // [user_level, rank, ...]
    //   [ '', '' ],
    //   0, 0, null,
    //   { ts: 1674834631, route: '...' },
    //   0, 101, null, null, 0, 100
    // ]
    const msg = msgObj.info[1];
    const uid = msgObj.info[2][0];
    const uname = msgObj.info[2][1];
    const userLevel = msgObj.info[4][0];
    // const guardLevel = msgObj.info[3][6]; // 舰队等级 3=舰长, 2=提督, 1=总督

    log.info(`(BiliLive Service) Danmaku: [${uname}] ${msg}`);
    const danmakuData = { uid, uname, msg, userLevel };
    sendToRenderer('bililive-danmaku', danmakuData);

    // 检查黑名单用户和关键词
    if (biliConfig.black_user?.includes(uname) || biliConfig.black_text?.some(keyword => msg.includes(keyword))) {
        log.info(`(BiliLive Service) Danmaku from ${uname} blocked by blacklist.`);
        return;
    }

    if (biliConfig.ttsEnabled && biliConfig.readDanmaku) {
        const text = biliConfig.voice_text?.danmaku
            .replace('{uname}', uname)
            .replace('{msg}', msg);
        speechText(text);
    }
}

/**
 * 处理礼物消息 (合并相同用户的连续礼物)
 * @param {object} msgObj SEND_GIFT 对象
 */
function handleGiftMessage(msgObj) {
    const data = msgObj.data;
    const uid = data.uid;
    const uname = data.uname;
    const giftName = data.giftName;
    const num = data.num;
    const price = data.price; // 单个礼物价格 (电池)
    const totalCoin = data.total_coin; // 总价 (电池)
    const giftId = data.giftId;
    const batchComboId = data.batch_combo_id; // 用于区分不同批次的连击礼物

    log.info(`(BiliLive Service) Gift: [${uname}] sent ${num} x ${giftName}`);
    const giftData = { uid, uname, giftName, giftId, num, price, totalCoin };
    sendToRenderer('bililive-gift', giftData);

    if (!biliConfig.ttsEnabled || !biliConfig.readGift) {
        return;
    }

    const giftKey = `${uid}-${giftId}-${batchComboId}`; // 合并 Key
    const interval = (biliConfig.continuous_gift_interval || 1) * 1000; // 合并时间窗口 (ms)

    if (giftMergeMap.has(giftKey)) {
        // 更新现有礼物信息
        const existingGift = giftMergeMap.get(giftKey);
        existingGift.num += num;
        existingGift.totalCoin += totalCoin;
        // 重置定时器
        clearTimeout(existingGift.timer);
        existingGift.timer = setTimeout(() => {
            const text = biliConfig.voice_text?.gift
                .replace('{uname}', uname)
                .replace('{num}', existingGift.num)
                .replace('{gift_name}', giftName);
            speechText(text);
            giftMergeMap.delete(giftKey); // 播报后删除
        }, interval);
    } else {
        // 新礼物，创建信息并设置定时器
        const newGift = {
            uname,
            giftName,
            num,
            totalCoin,
            timer: setTimeout(() => {
                const text = biliConfig.voice_text?.gift
                    .replace('{uname}', uname)
                    .replace('{num}', newGift.num) // 使用合并后的数量
                    .replace('{gift_name}', giftName);
                speechText(text);
                giftMergeMap.delete(giftKey); // 播报后删除
            }, interval),
        };
        giftMergeMap.set(giftKey, newGift);
    }
}

/**
 * 处理点赞消息
 * @param {object} data LIKE_INFO_V3_CLICK.data
 */
function handleLikeMessage(data) {
    // data 样例: { uid: ..., uname: '...', like_text: '为主播点赞了', ... }
    const uname = data.uname;
    const likeText = data.like_text;
    log.info(`(BiliLive Service) Like: [${uname}] ${likeText}`);
    sendToRenderer('bililive-like', { uname, text: likeText });

    if (biliConfig.ttsEnabled && biliConfig.readLike) {
        const text = biliConfig.voice_text?.like
            .replace('{uname}', uname)
            .replace('{like_text}', likeText);
        speechText(text);
    }
}

/**
 * 处理进入直播间消息
 * @param {object} data INTERACT_WORD.data
 */
function handleEnterMessage(data) {
    // data 样例: { contribution: { rank: 0 }, dmscore: 13, fans_medal: { ... }, identities: [ 3, 1 ], is_spread: 0,
    //            msg_type: 1, privilege_type: 3, roomid: ..., score: ..., spreaddesc: '', spreadinfo: '',
    //            tail_icon: ..., timestamp: ..., trigger_time: ..., uid: ..., uname: '...', uname_color: '' }
    const uid = data.uid;
    const uname = data.uname;
    // const guardLevel = data.privilege_type; // 3=舰长, 2=提督, 1=总督, 0=非舰长
    const medalLevel = data.fans_medal?.level || 0; // 粉丝牌等级

    log.info(`(BiliLive Service) Enter: [${uname}] (Medal: ${medalLevel})`);
    sendToRenderer('bililive-enter', { uid, uname, medalLevel });

    // 检查黑名单
     if (biliConfig.black_user?.includes(uname)) {
        log.info(`(BiliLive Service) Enter from ${uname} blocked by blacklist.`);
        return;
    }

    // 欢迎等级过滤
    const welcomeLevel = biliConfig.welcome_level || 0;
    if (medalLevel >= welcomeLevel && biliConfig.ttsEnabled && biliConfig.readEnter) {
        const text = biliConfig.voice_text?.enter.replace('{uname}', uname);
        speechText(text);
    }
}

/**
 * 处理 SC 消息
 * @param {object} data SUPER_CHAT_MESSAGE.data
 */
function handleSuperChatMessage(data) {
    // data 样例: { background_color: '#EDF5FF', ..., end_time: ..., gift: { gift_id: 12000, gift_name: '醒目留言', num: 1 },
    //            id: ..., message: 'SC内容', ..., price: 30, ..., start_time: ..., time: 900, uid: ...,
    //            user_info: { face: '...', ..., uname: '...' } }
    const id = data.id;
    const uname = data.user_info.uname;
    const price = data.price; // 人民币价格
    const message = data.message;
    log.info(`(BiliLive Service) SuperChat: [${uname}] (${price}元) ${message}`);
    sendToRenderer('bililive-superchat', { id, uname, price, message });

    if (biliConfig.ttsEnabled) { // SC 默认播报
        const text = `感谢 ${uname} 的 ${price}元 醒目留言： ${message}`;
        speechText(text);
    }
}

/**
 * 处理上舰消息
 * @param {object} data GUARD_BUY.data
 */
function handleGuardBuyMessage(data) {
    // data 样例: { uid: ..., username: '...', guard_level: 3, num: 1, price: 198000, gift_id: 10003, gift_name: '舰长', ... }
    // guard_level: 3=舰长, 2=提督, 1=总督
    const uid = data.uid;
    const uname = data.username;
    const level = data.guard_level;
    const giftName = data.gift_name; // 舰长/提督/总督
    const num = data.num; // 数量 (通常为1)
    log.info(`(BiliLive Service) Guard Buy: [${uname}] bought ${num} x ${giftName}`);
    sendToRenderer('bililive-guard', { uid, uname, level, giftName, num });

    if (biliConfig.ttsEnabled) { // 上舰默认播报
        const text = `感谢 ${uname} 开通了 ${giftName}！老板大气！`;
        speechText(text);
    }
}


// --- TTS 实现 ---

let speechQueue = [];
let isSpeaking = false;

/**
 * 将文本加入语音队列
 * @param {string} text
 */
function speechText(text) {
    if (!text || !biliConfig.ttsEnabled) {
        return;
    }
    speechQueue.push(text);
    processSpeechQueue();
}

/**
 * 处理语音队列
 */
async function processSpeechQueue() {
    if (isSpeaking || speechQueue.length === 0) {
        return;
    }
    isSpeaking = true;
    const text = speechQueue.shift();
    log.info(`(BiliLive Service) Speaking: "${text}" using ${ttsConfig.mode}`);
    sendToRenderer('bililive-tts-status', { speaking: true, text });

    try {
        switch (ttsConfig.mode) {
            case 'azure':
                await azureTTS(text);
                break;
            case 'alibaba':
                await alibabaTTS(text);
                break;
            case 'sovits':
                await sovitsTTS(text);
                break;
            case 'local':
            default:
                await localTTS(text);
                break;
        }
    } catch (err) {
        log.error(`(BiliLive Service) TTS Error (${ttsConfig.mode}):`, err);
        sendToRenderer('bililive-message', { type: 'error', content: `TTS (${ttsConfig.mode}) 播放失败: ${err.message}` });
    } finally {
        // 等待间隔
        const interval = biliConfig.max_next_interval || 100;
        setTimeout(() => {
            isSpeaking = false;
            sendToRenderer('bililive-tts-status', { speaking: false, text: null });
            processSpeechQueue(); // 处理下一条
        }, interval);
    }
}


/**
 * 本地TTS (使用 say.js)
 * @param {string} text
 */
function localTTS(text) {
  return new Promise((resolve, reject) => {
    // say.speak(text, voice, speed, callback)
    // voice 和 speed 参数在不同平台可能不同
    say.speak(text, null, 1.0, (err) => {
      if (err) {
        log.error('(BiliLive Service) Local TTS Error:', err);
        reject(err);
      } else {
        log.debug('(BiliLive Service) Local TTS playback finished.');
        resolve();
      }
    });
  });
}

/**
 * Azure TTS
 * @param {string} text
 */
async function azureTTS(text) {
  const config = ttsConfig.azure;
  if (!config || !config.azure_key || !config.azure_region) {
    throw new Error('Azure TTS 配置不完整 (需要 Key 和 Region)');
  }

  // endpoint 优先级高于 region
  const endpoint = config.azure_endpoint || `https://${config.azure_region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const speechConfig = sdk.SpeechConfig.fromSubscription(config.azure_key, config.azure_region);
  // speechConfig.speechEndpointId = endpoint; // 设置endpoint的方式可能需要查阅最新SDK文档
   speechConfig.endpointId = config.azure_endpoint; // 尝试直接设置 endpointId

  // 设置语音合成语言和声音名称
  if (config.azure_model) {
    speechConfig.speechSynthesisVoiceName = config.azure_model;
  } else {
      speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoxiaoNeural"; // 默认
  }

   // 设置输出格式为音频流
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3; // 或其他格式

  // 创建音频配置，使用默认扬声器输出
  const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

  // 创建语音合成器
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  // SSML 支持更丰富的控制 (语速、音调等)
  const speed = config.speed || 1.0;
  const pitch = config.pitch || 0; // SSML pitch 使用 "x-low", "low", "medium", "high", "x-high", "default" 或 "+n%", "-n%"
  let pitchValue = "default";
  if (pitch > 0) pitchValue = `+${pitch}%`;
  if (pitch < 0) pitchValue = `${pitch}%`; // SSML 负值不需要+

  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
      <voice name="${speechConfig.speechSynthesisVoiceName}">
        <prosody rate="${speed}" pitch="${pitchValue}">
          ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}
        </prosody>
      </voice>
    </speak>
  `;

  log.debug("(BiliLive Service) Azure SSML:", ssml);

  return new Promise((resolve, reject) => {
    synthesizer.speakSsmlAsync(
      ssml,
      result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          log.debug("(BiliLive Service) Azure TTS playback finished.");
          resolve();
        } else {
          log.error(`(BiliLive Service) Azure TTS Error: ${result.errorDetails}`);
          reject(new Error(result.errorDetails));
        }
        synthesizer.close();
      },
      err => {
        log.error("(BiliLive Service) Azure TTS speakSsmlAsync Error:", err);
        reject(err);
        synthesizer.close();
      });
  });
}


/**
 * 阿里云 TTS (NUI) - 注意：需要阿里云账号和NUI SDK配置
 * 实现较为复杂，需要引入阿里云官方SDK (@alicloud/nui-sdk)
 * 这里仅作占位，实际需要参考阿里云文档实现
 * @param {string} text
 */
async function alibabaTTS(text) {
   const config = ttsConfig.alibaba;
   if (!config || !config.alibaba_appkey || !config.alibaba_token) {
     throw new Error('阿里云 TTS 配置不完整 (需要 AppKey 和 Token)');
   }
    log.warn("(BiliLive Service) Alibaba TTS not fully implemented yet.");
   // 需要使用 @alicloud/nui-sdk 实现
   // 大致流程：创建 NlsClient -> 创建 SpeechSynthesizerRequest -> 设置参数 -> start -> 监听事件 -> 处理音频流 -> stop
   // 示例代码需要参考官方文档
   // const NlsClient = require('@alicloud/nls-node-sdk'); // 假设安装了SDK

    // 简单的播放占位
    await localTTS(`阿里云说：${text}`);

   return Promise.resolve();
}

/**
 * SoVITS TTS (需要本地运行 SoVITS API 服务)
 * @param {string} text
 */
async function sovitsTTS(text) {
    const config = ttsConfig.sovits;
    if (!config || !config.sovits_host) {
        throw new Error('SoVITS TTS 配置不完整 (需要 Host 地址)');
    }

    try {
        const params = {
            text: text,
            text_language: config.sovits_language || 'auto',
            // 根据 SoVITS API 文档传递其他参数
            speaker: config.sovits_model, // 'speaker' 或 'sovits_model' 取决于API
            sdp_ratio: 0.2, // 示例参数
            noise: 0.2, // 示例参数
            noise_w: 0.9, // 示例参数
            length: 1.0, // 示例参数
            // ... config 中的其他参数 ...
             speed: config.sovits_speed || 1.0,
             top_k: config.sovits_top_k,
             top_p: config.sovits_top_p,
             temperature: config.sovits_temperature,
        };

        // 清理 undefined 或空字符串参数
        Object.keys(params).forEach(key => (params[key] === undefined || params[key] === '') && delete params[key]);

        log.debug("(BiliLive Service) SoVITS Request Params:", params);

        const response = await axios.get(config.sovits_host, {
            params: params,
            responseType: 'arraybuffer', // 获取音频流
            timeout: 15000 // 设置超时时间
        });

        if (response.status === 200 && response.data) {
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
            throw new Error(`SoVITS API request failed with status ${response.status}`);
        }
    } catch (err) {
        log.error("(BiliLive Service) SoVITS TTS Error:", err);
        throw new Error(`SoVITS TTS 调用失败: ${err.message}`);
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
  
  // TTS相关
  speechText, // 手动播放文本（用于测试）
  
  // 常量
  DEFAULT_BILI_CONFIG,
  DEFAULT_AZURE_CONFIG,
  DEFAULT_ALIBABA_CONFIG,
  DEFAULT_SOVITS_CONFIG
}; 