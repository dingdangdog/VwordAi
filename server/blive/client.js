/**
 * Bilibili Live WebSocket Client
 *
 * Core functionality for connecting to Bilibili Live WebSocket API
 * Based on the Python implementation in demo/clients/open_live.py
 */
const WebSocket = require("ws");
const axios = require("axios");
const log = require("electron-log");
const zlib = require("zlib");
let brotli;

try {
  brotli = require("brotli");
} catch (err) {
  log.warn(
    "(BLiveClient) Brotli module not loaded, will attempt to load when needed"
  );
}

/**
 * Operation codes for packets
 */
const Operation = {
  HANDSHAKE: 0,
  HANDSHAKE_REPLY: 1,
  HEARTBEAT: 2,
  HEARTBEAT_REPLY: 3,
  SEND_MSG: 4,
  SEND_MSG_REPLY: 5,
  DISCONNECT_REPLY: 6,
  AUTH: 7,
  AUTH_REPLY: 8,
  RAW: 9,
  PROTO_READY: 10,
  PROTO_FINISH: 11,
  CHANGE_ROOM: 12,
  CHANGE_ROOM_REPLY: 13,
  REGISTER: 14,
  REGISTER_REPLY: 15,
  UNREGISTER: 16,
  UNREGISTER_REPLY: 17,
};

/**
 * Protocol versions
 */
const ProtoVer = {
  NORMAL: 0, // JSON
  HEARTBEAT: 1, // Popularity value
  ZLIB: 2, // ZLIB compressed JSON
  BROTLI: 3, // BROTLI compressed JSON
};

/**
 * Buffer helper for reading data
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
      throw new Error(
        `BufferReader: Attempt to read beyond buffer bounds. Offset=${this.offset}, Length=${length}, BufferSize=${this.buffer.length}`
      );
    }
    const value = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }
}

/**
 * WebSocket Client Base Class
 * Based on the Python implementation
 */
class BLiveClient {
  /**
   * Constructor
   * @param {Object} options Configuration options
   * @param {Function} messageHandler Function to handle received messages
   */
  constructor(options, messageHandler) {
    // Config
    this.options = {
      heartbeatInterval: 30000, // 30 seconds
      ...options,
    };

    // Connection state
    this.roomId = null;
    this.ws = null;
    this.heartbeatTimer = null;
    this.retryCount = 0;
    this.isConnecting = false;
    this.isClosing = false;
    this.needInitRoom = true;
    this.messageHandler =
      messageHandler || this.defaultMessageHandler.bind(this);

    // Added fields to match Python implementation
    this._uid = null; // Will be initialized during connect
    this._cookies = {}; // Store cookies for auth

    // Event callbacks
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;
    this.onHeartbeat = null;
    this.onMessageReceived = null;
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  get isConnected() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to room
   * @param {number} roomId Room ID
   * @returns {Promise<boolean>} Success status
   */
  async connect(roomId) {
    if (this.isConnecting || this.isConnected) {
      log.warn(
        `(BLiveClient) Already connecting or connected to room ${this.roomId}`
      );
      return false;
    }

    try {
      this.isConnecting = true;
      this.roomId = roomId;

      log.info(`(BLiveClient) Connecting to room: ${roomId}`);

      // Initialize UID from SESSDATA (like Python's _init_uid)
      if (this._uid === null) {
        if (!(await this.initUid())) {
          log.warn(`(BLiveClient) Failed to initialize UID, using default 0`);
          this._uid = 0;
        }
      }

      // Initialize BUVID cookie if needed (like Python's _init_buvid)
      if (!this._getBuvid()) {
        if (!(await this.initBuvid())) {
          log.warn(`(BLiveClient) Failed to initialize BUVID cookie`);
        }
      }

      // Get real room ID
      const realRoomId = await this.getRealRoomId(roomId);
      if (!realRoomId) {
        log.error(`(BLiveClient) Failed to get real room ID for ${roomId}`);
        this.isConnecting = false;
        return false;
      }

      // Get WebSocket info
      const wsInfo = await this.getWebSocketInfo(realRoomId);
      if (!wsInfo || !wsInfo.host) {
        log.error(
          `(BLiveClient) Failed to get WebSocket info for room ${realRoomId}`
        );
        this.isConnecting = false;
        return false;
      }

      // Connect WebSocket
      return await this.connectWebSocket(realRoomId, wsInfo);
    } catch (err) {
      log.error(`(BLiveClient) Connection error:`, err);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Connect to WebSocket server
   * @param {number} realRoomId Real room ID
   * @param {Object} wsInfo WebSocket connection info
   * @returns {Promise<boolean>} Success status
   */
  async connectWebSocket(realRoomId, wsInfo) {
    return new Promise((resolve) => {
      try {
        // Close existing connection first
        this.close();

        // Create WebSocket connection
        const wsUrl = `wss://${wsInfo.host}/sub`;
        log.debug(`(BLiveClient) Connecting WebSocket: ${wsUrl}`);

        this.ws = new WebSocket(wsUrl);

        this.ws.on("open", () => {
          this.isConnecting = false;
          log.info(
            `(BLiveClient) WebSocket connection established to room ${this.roomId}`
          );

          // Send auth packet
          const authPacket = this.makeAuthPacket(realRoomId, wsInfo.token);
          this.ws.send(authPacket);

          // Start heartbeat
          this.startHeartbeat();

          if (this.onOpen) this.onOpen(this.roomId);
          resolve(true);
        });

        this.ws.on("message", (data) => {
          this.handleMessage(data);
        });

        this.ws.on("error", (err) => {
          log.error(`(BLiveClient) WebSocket error:`, err);
          this.isConnecting = false;
          if (this.onError) this.onError(err);
          resolve(false);
        });

        this.ws.on("close", (code, reason) => {
          this.isConnecting = false;
          if (!this.isClosing) {
            log.warn(
              `(BLiveClient) WebSocket connection closed. Code: ${code}, Reason: ${reason}`
            );
            if (this.onClose) this.onClose(code, reason);
          }
          this.stopHeartbeat();
          this.ws = null;
          resolve(false);
        });
      } catch (err) {
        log.error(`(BLiveClient) WebSocket connection error:`, err);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  /**
   * Close connection
   */
  close() {
    if (this.isClosing || !this.ws) {
      return;
    }

    this.isClosing = true;
    log.info(
      `(BLiveClient) Closing WebSocket connection to room ${this.roomId}`
    );

    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isClosing = false;
  }

  /**
   * Start heartbeat timer
   */
  startHeartbeat() {
    this.stopHeartbeat();
    log.debug(
      `(BLiveClient) Starting heartbeat with interval: ${this.options.heartbeatInterval}ms`
    );

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          const heartbeatPacket = this.makeHeartbeatPacket();
          this.ws.send(heartbeatPacket);
          log.debug(`(BLiveClient) Heartbeat sent`);
        } catch (err) {
          log.error(`(BLiveClient) Failed to send heartbeat:`, err);
          this.close();
        }
      } else {
        log.warn(`(BLiveClient) WebSocket not open, stopping heartbeat`);
        this.stopHeartbeat();
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      log.debug(`(BLiveClient) Heartbeat stopped`);
    }
  }

  /**
   * Get real room ID
   * @param {number} shortRoomId Short room ID
   * @returns {Promise<number|null>} Real room ID or null
   */
  async getRealRoomId(shortRoomId) {
    try {
      const url = `https://api.live.bilibili.com/room/v1/Room/room_init?id=${shortRoomId}`;
      const response = await axios.get(url, { timeout: 5000 });
      if (response.data.code === 0) {
        return response.data.data.room_id;
      } else {
        log.error(
          `(BLiveClient) Failed to get real room ID for ${shortRoomId}:`,
          response.data.message
        );
        return null;
      }
    } catch (err) {
      log.error(
        `(BLiveClient) Error getting real room ID for ${shortRoomId}:`,
        err
      );
      return null;
    }
  }

  /**
   * Get WebSocket connection info
   * @param {number} realRoomId Real room ID
   * @returns {Promise<Object|null>} WebSocket info or null
   */
  async getWebSocketInfo(realRoomId) {
    try {
      // Set headers (with optional SESSDATA for authentication)
      const headers = {};
      if (this.options.SESSDATA) {
        headers.Cookie = `SESSDATA=${this.options.SESSDATA}`;
        log.info(
          `(BLiveClient) Using SESSDATA for authentication, length: ${this.options.SESSDATA.length}`
        );
      } else {
        log.warn(
          `(BLiveClient) No SESSDATA provided, danmaku usernames may be masked`
        );
      }

      const url = `https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${realRoomId}`;
      const response = await axios.get(url, { headers, timeout: 5000 });

      if (response.data.code === 0) {
        // Prefer wss hosts
        const hostInfo = response.data.data.host_list.find(
          (h) => h.host && h.wss_port === 443
        );

        if (hostInfo) {
          return {
            host: hostInfo.host,
            port: hostInfo.wss_port,
            token: response.data.data.token,
          };
        } else if (response.data.data.host_list.length > 0) {
          // Fallback to first host
          log.warn(
            `(BLiveClient) No WSS host found for room ${realRoomId}, using fallback`
          );
          const firstHost = response.data.data.host_list[0];
          return {
            host: firstHost.host,
            port: firstHost.wss_port || firstHost.ws_port,
            token: response.data.data.token,
          };
        }
      } else {
        log.error(
          `(BLiveClient) Failed to get WebSocket info for ${realRoomId}:`,
          response.data.message
        );
      }
      return null;
    } catch (err) {
      log.error(
        `(BLiveClient) Error getting WebSocket info for ${realRoomId}:`,
        err
      );
      return null;
    }
  }

  /**
   * Make authentication packet
   * @param {number} roomId Room ID
   * @param {string} token Authentication token
   * @returns {Buffer} Packet data
   */
  makeAuthPacket(roomId, token) {
    // Create auth params matching the Python implementation structure
    const authParams = {
      uid: this._uid || 0,
      roomid: roomId,
      protover: 3, // Support Brotli compression (critical!)
      platform: "web",
      type: 2,
      buvid: this._getBuvid() || "", // Include buvid if available
      key: token, // The token parameter
    };

    const authBody = JSON.stringify(authParams);

    log.debug(`(BLiveClient) Auth packet body: ${authBody}`);
    return this.makePacket(Operation.AUTH, Buffer.from(authBody));
  }

  /**
   * Get buvid from cookies if available
   * @returns {string} buvid value
   * @private
   */
  _getBuvid() {
    // First try stored cookies
    if (this._cookies && this._cookies.buvid3) {
      return this._cookies.buvid3;
    }

    // Then try options
    try {
      if (this.options.cookies && this.options.cookies.buvid3) {
        return this.options.cookies.buvid3;
      }
    } catch (err) {
      log.debug(`(BLiveClient) Error accessing buvid cookie: ${err.message}`);
    }
    return "";
  }

  /**
   * Make heartbeat packet
   * @returns {Buffer} Packet data
   */
  makeHeartbeatPacket() {
    return this.makePacket(Operation.HEARTBEAT, Buffer.from(""));
  }

  /**
   * Make packet
   * @param {number} operation Operation code
   * @param {Buffer} body Packet body
   * @returns {Buffer} Complete packet
   */
  makePacket(operation, body) {
    const headerLength = 16;
    const packetLength = headerLength + body.length;
    const header = Buffer.alloc(headerLength);

    header.writeUInt32BE(packetLength, 0); // Packet Length
    header.writeUInt16BE(headerLength, 4); // Header Length

    // Protocol version depends on operation
    const protocolVersion =
      operation === Operation.HEARTBEAT ? ProtoVer.HEARTBEAT : ProtoVer.NORMAL;
    header.writeUInt16BE(protocolVersion, 6);

    header.writeUInt32BE(operation, 8); // Operation
    header.writeUInt32BE(1, 12); // Sequence ID

    return Buffer.concat([header, body]);
  }

  /**
   * Handle message data
   * @param {Buffer} data Received data
   */
  async handleMessage(data) {
    // log.debug(
    //   `(BLiveClient) Received data packet, length: ${data.length} bytes`
    // );

    const reader = new BufferReader(data);
    while (reader.hasMore()) {
      try {
        const packetLen = reader.readUInt32BE();
        const headerLen = reader.readUInt16BE();
        const protoVer = reader.readUInt16BE();
        const op = reader.readUInt32BE();
        reader.readUInt32BE(); // Sequence (ignored)

        const bodyLen = packetLen - headerLen;
        if (bodyLen < 0) {
          log.error(
            `(BLiveClient) Invalid packet length: packetLen=${packetLen}, headerLen=${headerLen}`
          );
          break;
        }

        const body = reader.readBuffer(bodyLen);
        // log.debug(
        //   `(BLiveClient) Parsing packet: op=${op}, protoVer=${protoVer}, bodyLen=${bodyLen}`
        // );

        switch (op) {
          case Operation.HEARTBEAT_REPLY: // Popularity value
            const popularity = body.readUInt32BE(0);
            // log.debug(`(BLiveClient) Received popularity: ${popularity}`);
            if (this.onHeartbeat) this.onHeartbeat(popularity);
            break;

          case Operation.SEND_MSG_REPLY: // Commands/Notifications
            // log.debug(
            //   `(BLiveClient) Received SEND_MSG_REPLY packet, processing command...`
            // );
            await this.processCommand(protoVer, body);
            break;

          case Operation.AUTH_REPLY: // Auth response
            // log.info(`(BLiveClient) Authentication successful`);
            // Trigger message handler with auth success event
            this.messageHandler({ cmd: "CONNECTED" });
            break;

          default:
            log.warn(`(BLiveClient) Unhandled operation: ${op}`);
        }
      } catch (err) {
        log.error(`(BLiveClient) Error parsing packet:`, err);
        break;
      }
    }
  }

  /**
   * Process command message
   * @param {number} protoVer Protocol version
   * @param {Buffer} body Message body
   */
  async processCommand(protoVer, body) {
    try {
      // Process based on protocol version
      switch (protoVer) {
        case ProtoVer.NORMAL: // JSON
          // log.debug(`(BLiveClient) Processing JSON data`);
          try {
            const jsonStr = body.toString("utf8");
            // log.debug(
            //   `(BLiveClient) Parsed JSON data (first 200 chars): ${jsonStr.substring(
            //     0,
            //     200
            //   )}${jsonStr.length > 200 ? "..." : ""}`
            // );
            const jsonData = JSON.parse(jsonStr);
            this.handleCommandMessage(jsonData);
          } catch (jsonErr) {
            log.error(`(BLiveClient) JSON parsing failed:`, jsonErr);
            log.error(
              `(BLiveClient) Raw JSON data: ${body
                .toString("utf8")
                .substring(0, 200)}...`
            );
          }
          break;

        case ProtoVer.ZLIB: // ZLIB compressed
          log.debug(
            `(BLiveClient) Processing Zlib compressed data, size: ${body.length} bytes`
          );
          try {
            const decompressed = zlib.inflateSync(body);
            log.debug(
              `(BLiveClient) Zlib decompression successful, decompressed size: ${decompressed.length} bytes`
            );

            // Handle multiple messages in decompressed data (Python also does this)
            // See if we can parse as JSON first
            try {
              const jsonStr = decompressed.toString("utf8");
              const jsonData = JSON.parse(jsonStr);
              this.handleCommandMessage(jsonData);
            } catch (jsonErr) {
              // Not JSON, handle as binary packet
              await this.handleMessage(decompressed);
            }
          } catch (err) {
            log.error(`(BLiveClient) Zlib decompression failed:`, err);
            // Log some of the raw data for debugging
            log.error(
              `(BLiveClient) Raw Zlib data (hex, first 50 bytes): ${body
                .slice(0, 50)
                .toString("hex")}`
            );
          }
          break;

        case ProtoVer.BROTLI: // Brotli compressed
          log.debug(
            `(BLiveClient) Processing Brotli compressed data, size: ${body.length} bytes`
          );
          try {
            if (!brotli) {
              // Try to load brotli module
              try {
                brotli = require("brotli");
                log.debug(`(BLiveClient) Brotli module loaded successfully`);
              } catch (loadErr) {
                log.error(
                  `(BLiveClient) Failed to load brotli module:`,
                  loadErr
                );

                // Try to install brotli automatically
                log.info(
                  `(BLiveClient) Attempting to install brotli module...`
                );
                try {
                  const { execSync } = require("child_process");
                  execSync("npm install brotli", { stdio: "inherit" });
                  log.info(
                    `(BLiveClient) Brotli module installed successfully, reloading`
                  );
                  brotli = require("brotli");
                } catch (installErr) {
                  log.error(
                    `(BLiveClient) Failed to install brotli:`,
                    installErr
                  );
                  throw new Error(
                    "Failed to load brotli module. Please run: npm install brotli"
                  );
                }
              }
            }

            // Decompress data
            const decompressed = Buffer.from(brotli.decompress(body));
            log.debug(
              `(BLiveClient) Brotli decompression successful, decompressed size: ${decompressed.length} bytes`
            );

            // Handle multiple messages in decompressed data (Python also does this)
            // See if we can parse as JSON first
            try {
              const jsonStr = decompressed.toString("utf8");
              const jsonData = JSON.parse(jsonStr);
              this.handleCommandMessage(jsonData);
            } catch (jsonErr) {
              // Not JSON, handle as binary packet
              await this.handleMessage(decompressed);
            }
          } catch (err) {
            log.error(`(BLiveClient) Brotli decompression failed:`, err);
            // Log some of the raw data for debugging
            log.error(
              `(BLiveClient) Raw Brotli data (hex, first 50 bytes): ${body
                .slice(0, 50)
                .toString("hex")}`
            );
          }
          break;

        default:
          log.warn(`(BLiveClient) Unsupported protocol version: ${protoVer}`);
      }
    } catch (err) {
      log.error(`(BLiveClient) Error processing command message:`, err);
    }
  }

  /**
   * Handle command message
   * @param {Object} message Command message object
   */
  handleCommandMessage(message) {
    if (Array.isArray(message)) {
      // Multiple messages in array (rare but possible)
      message.forEach((msg) => this.handleSingleCommand(msg));
    } else {
      // Single message
      this.handleSingleCommand(message);
    }
  }

  /**
   * Handle single command
   * @param {Object} command Command object
   */
  handleSingleCommand(command) {
    // Extract command type
    const cmd = command.cmd || "";

    // LOG ALL MESSAGES (for debugging)
    try {
      // Log ALL message details (limited to avoid flooding)
      const stringifiedMsg = JSON.stringify(command);
      const logMsg =
        stringifiedMsg.length > 500
          ? stringifiedMsg.substring(0, 500) + "..."
          : stringifiedMsg;
      // log.info(`(BLiveClient) RAW MESSAGE: ${cmd}, Content: ${logMsg}`);

      // Store message to file in development mode
      if (process.env.NODE_ENV === "development") {
        try {
          const fs = require("fs");
          const path = require("path");
          const logDir = path.join(__dirname, "../../logs");
          if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
          }
          fs.appendFileSync(
            path.join(logDir, "bilibili_messages_debug.json"),
            stringifiedMsg + "\n"
          );
        } catch (fileErr) {
          log.error(
            `(BLiveClient) Failed to write debug log: ${fileErr.message}`
          );
        }
      }
    } catch (logErr) {
      log.error(`(BLiveClient) Error logging message: ${logErr.message}`);
    }

    // Process specific command types with detailed logging
    switch (cmd) {
      case "DANMU_MSG": // 弹幕消息 (Chat message)
        try {
          // Extract data in the format similar to Python's DanmakuMessage.from_command method
          const danmakuData = this.extractDanmakuData(command);
          log.info(
            `(BLiveClient) Received DANMU_MSG: [${danmakuData.uname}] ${danmakuData.msg}`
          );
        } catch (err) {
          log.error(`(BLiveClient) Error parsing DANMU_MSG:`, err);
        }
        break;
      case "SEND_GIFT": // 礼物消息 (Gift)
        log.info(
          `(BLiveClient) Received SEND_GIFT: ${JSON.stringify({
            user: command.data?.uname || "unknown",
            gift: command.data?.giftName || "unknown",
            num: command.data?.num || 0,
          }).substring(0, 200)}`
        );
        break;
      case "INTERACT_WORD": // 进入直播间 (User enter)
        log.info(
          `(BLiveClient) Received INTERACT_WORD: ${JSON.stringify({
            user: command.data?.uname || "unknown",
            type: command.data?.msg_type || "unknown",
          }).substring(0, 200)}`
        );
        break;
      case "LIKE_INFO_V3_CLICK": // 点赞 (Like)
        log.info(
          `(BLiveClient) Received LIKE_INFO_V3_CLICK: ${JSON.stringify({
            user: command.data?.uname || "unknown",
          }).substring(0, 200)}`
        );
        break;
      case "SUPER_CHAT_MESSAGE": // SC (Super Chat)
        log.info(
          `(BLiveClient) Received SUPER_CHAT_MESSAGE: ${JSON.stringify({
            user: command.data?.user_info?.uname || "unknown",
            message: command.data?.message || "unknown",
            price: command.data?.price || 0,
          }).substring(0, 200)}`
        );
        break;
      default:
        // For non-critical commands, only log at debug level
        log.debug(`(BLiveClient) Received other command: ${cmd}`);
    }

    // ALWAYS Pass ALL commands to message handler (for debugging)
    if (this.onMessageReceived) this.onMessageReceived(command);
    this.messageHandler(command);
  }

  /**
   * Extract danmaku message data from command (similar to Python's DanmakuMessage.from_command)
   * @param {Object} command DANMU_MSG command
   * @returns {Object} Extracted danmaku data
   */
  extractDanmakuData(command) {
    try {
      const info = command.info;
      if (!info || !Array.isArray(info) || info.length < 3) {
        throw new Error("Invalid DANMU_MSG format");
      }

      const msg = info[1]; // The actual message content
      const userInfo = info[2]; // User info array
      const uid = userInfo ? userInfo[0] : 0;
      const uname = userInfo ? userInfo[1] : "unknown";
      const isAdmin = userInfo && userInfo[2] === 1;
      const isVIP = userInfo && userInfo[3] === 1;
      const isSVIP = userInfo && userInfo[4] === 1;

      const medalInfo = info[3]; // Medal info array
      const medalLevel = medalInfo ? medalInfo[0] : 0;
      const medalName = medalInfo ? medalInfo[1] : "";
      const anchor = medalInfo ? medalInfo[2] : "";

      const userLevel = info[4] ? info[4][0] : 0;

      return {
        uid,
        uname,
        msg,
        isAdmin,
        isVIP,
        isSVIP,
        medal: {
          level: medalLevel,
          name: medalName,
          anchor,
        },
        userLevel,
      };
    } catch (err) {
      log.error(`(BLiveClient) Error extracting danmaku data:`, err);
      // Return basic information to avoid crashes
      return {
        uid: 0,
        uname: "unknown",
        msg:
          command.info && Array.isArray(command.info) && command.info.length > 1
            ? command.info[1]
            : "unknown message",
      };
    }
  }

  /**
   * Default message handler (override this or provide custom handler in constructor)
   * @param {Object} message Message object
   */
  defaultMessageHandler(message) {
    // Default implementation logs the command type
    log.debug(
      `(BLiveClient) Received message with cmd: ${message.cmd || "unknown"}`
    );
  }

  /**
   * Initialize UID from SESSDATA (similar to Python's _init_uid)
   * @returns {Promise<boolean>} Success status
   */
  async initUid() {
    if (!this.options.SESSDATA) {
      log.info(`(BLiveClient) No SESSDATA provided, setting uid to 0`);
      this._uid = 0;
      return true;
    }

    try {
      const url = "https://api.bilibili.com/x/web-interface/nav";
      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Cookie: `SESSDATA=${this.options.SESSDATA}`,
      };

      const response = await axios.get(url, { headers, timeout: 5000 });

      if (response.data.code === 0) {
        const data = response.data.data;

        if (!data.isLogin) {
          log.info(`(BLiveClient) User not logged in, setting uid to 0`);
          this._uid = 0;
        } else {
          this._uid = data.mid;
          log.info(`(BLiveClient) Successfully initialized uid: ${this._uid}`);
        }
        return true;
      } else if (response.data.code === -101) {
        // Not logged in
        log.info(
          `(BLiveClient) User not logged in (code -101), setting uid to 0`
        );
        this._uid = 0;
        return true;
      } else {
        log.error(`(BLiveClient) Failed to get uid: ${response.data.message}`);
        return false;
      }
    } catch (err) {
      log.error(`(BLiveClient) Error fetching uid:`, err);
      this._uid = 0; // Default to 0 on error
      return false;
    }
  }

  /**
   * Initialize BUVID cookie (similar to Python's _init_buvid)
   * @returns {Promise<boolean>} Success status
   */
  async initBuvid() {
    try {
      const url = "https://www.bilibili.com/";
      const headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      };

      const response = await axios.get(url, {
        headers,
        timeout: 5000,
        withCredentials: true,
        maxRedirects: 0,
      });

      // Get cookies from response
      const cookieHeader = response.headers["set-cookie"];
      if (cookieHeader && Array.isArray(cookieHeader)) {
        for (const cookie of cookieHeader) {
          if (cookie.includes("buvid3=")) {
            const match = cookie.match(/buvid3=([^;]+)/);
            if (match && match[1]) {
              this._cookies.buvid3 = match[1];
              log.info(
                `(BLiveClient) Successfully got buvid3: ${match[1].substring(
                  0,
                  8
                )}...`
              );
              return true;
            }
          }
        }
      }

      log.warn(`(BLiveClient) No buvid3 cookie found in response`);
      return false;
    } catch (err) {
      log.error(`(BLiveClient) Error getting buvid:`, err);
      return false;
    }
  }
}

module.exports = {
  BLiveClient,
  Operation,
  ProtoVer,
};
