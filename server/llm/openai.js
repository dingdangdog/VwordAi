const { OpenAI } = require("openai");

/**
 * OpenAI客户端，用于文本分析
 * @class OpenAIClient
 */
class OpenAIClient {
  /**
   * 创建新的OpenAI客户端
   * @param {Object} config 配置对象
   * @param {string} config.key OpenAI API密钥
   * @param {string} [config.endpoint] 可选的自定义端点
   * @param {string} [config.model='gpt-4o'] 要使用的OpenAI模型
   */
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: config.key,
      baseURL: config.endpoint,
    });
    this.model = config.model || "gpt-4o";
    this.temperature = config.temperature != null ? Number(config.temperature) : 0.3;
    this.maxTokens = config.maxTokens != null ? Number(config.maxTokens) : 4096;
    this.prompt = this.createPrompt();
  }

  /**
   * 创建用于文本分析的优化提示
   * @returns {string} 提示模板
   */
  createPrompt() {
    return `你是一个小说文本分析助手，目标是将整段文字转成「按句拆分、并标注说话角色与语气」的结构化结果，用于后续为不同角色配音，制作有声书。

## 必须遵守的规则
1. **逐句拆分**：对下面「待分析文本」中的**每一句话**都输出一个独立对象，**不能漏句、不能多句合并为一个对象**。
2. **分句方式**：按句号、问号、感叹号、省略号、换行等切分；对话中每个引号内的话单独成一句；旁白与对话交替时，每段旁白、每句对话各占一个对象。
3. **只输出一个合法 JSON 数组**：不要输出任何解释、markdown 代码块标记或其它文字，仅输出一个 JSON 数组。

## 每个对象字段说明
- **t**：该句的原文（一字不改）
- **s**：说话者。旁白/叙述用 "dft"，对话从上下文推断人名
- **e**：语气/情绪。可选：快乐、悲伤、愤怒、恐惧、好奇、紧张、平静、兴奋、惊讶、失望、羞愧、嫌恶、喜爱、骄傲、讽刺、严肃、轻松 等，无特殊用 "dft"
- **m**：模仿声音。可选：女孩、男孩、年轻女性、年轻男性、年长女性、年长男性、年老女性、年老男性，默认用 "dft"

## 待分析文本
{{text}}

## 输出要求
请直接输出一个 JSON 数组，数组长度 = 上述文本中的句子数量，每个元素形如：{"t":"句子原文","s":"说话者","e":"语气","m":"模仿声音"}。确保覆盖原文中的每一句。`;
  }

  /**
   * 从 API 返回的 message.content 中取出纯文本（兼容 string / array / object）
   * 部分端点如 NVIDIA 返回 content 为数组 [{ type: 'text', text: '...' }] 或对象
   */
  _normalizeContent(content) {
    if (typeof content === "string" && content.length > 0) return content;
    if (Array.isArray(content)) {
      const part = content.find((p) => p && (p.text || p.type === "text"));
      return part ? (part.text || part.content || "") : "";
    }
    if (content && typeof content === "object") {
      return content.text || content.content || "";
    }
    return "";
  }

  /**
   * 从 completion 的 choice 中提取回复文本（兼容多种 OpenAI 兼容端点的返回结构）
   */
  _getReplyText(completion) {
    const choice = completion?.choices?.[0];
    if (!choice) return "";

    // 1. 标准: message.content
    let raw = choice.message?.content;
    let text = this._normalizeContent(raw);
    if (text) return text;

    // 2. 带“思考”的模型（如 DeepSeek）可能只把回复放在 reasoning_content
    const reasoning = choice.message?.reasoning_content;
    if (typeof reasoning === "string" && reasoning.length > 0) return reasoning;

    // 3. 部分端点: message.parts 或 content 为数组但放在 message 下
    const msg = choice.message;
    if (msg?.parts && Array.isArray(msg.parts)) {
      text = this._normalizeContent(msg.parts);
      if (text) return text;
    }

    // 4. 旧版或部分实现: choice.text
    if (typeof choice.text === "string" && choice.text.length > 0) return choice.text;

    // 5. 整段 message 再试一次（可能 content 为嵌套对象）
    if (msg && typeof msg === "object") {
      text = this._normalizeContent(msg);
      if (text) return text;
    }

    return "";
  }

  /**
   * 测试连接：仅发送简单请求，收到任意有效回复即视为成功（兼容各兼容 OpenAI 的端点如 NVIDIA）
   * @param {string} [text] 可选测试文案
   * @returns {Promise<boolean>} 是否连接成功
   */
  async testConnection(text) {
    const log = require("electron-log");
    const testMessage = text || "Please reply with the word OK to confirm connection.";
    let completion;
    try {
      completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: testMessage }],
        max_tokens: 50,
      });
    } catch (err) {
      log.warn("[OpenAIClient] testConnection request failed:", err?.message || err);
      return false;
    }

    const content = this._getReplyText(completion);
    const ok = typeof content === "string" && content.length > 0;

    if (!ok) {
      // 失败时只打印字段摘要（ASCII），避免 UTF-8 在终端/日志里乱码
      const choice = completion?.choices?.[0];
      let summary = "choices[0] missing";
      if (choice) {
        const msg = choice.message || {};
        const keys = Object.keys(msg).join(", ");
        const parts = [];
        if (msg.content != null) parts.push("content=" + (typeof msg.content === "string" ? "string(" + msg.content.length + ")" : typeof msg.content));
        if (msg.reasoning_content != null) parts.push("reasoning_content=string(" + String(msg.reasoning_content).length + ")");
        summary = "message keys: " + keys + "; " + parts.join("; ") + "; finish_reason=" + (choice.finish_reason ?? "n/a");
      }
      log.warn("[OpenAIClient] testConnection no valid text.", summary);
    }
    return ok;
  }

  /**
   * 分析文本识别说话者和语气/情绪
   * @param {string} text 要分析的文本
   * @returns {Promise<Array>} 以JSON格式返回分析结果
   */
  async analyzeText(text) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "你只输出一个合法的 JSON 数组，用于有声书分句与角色标注。数组中每个元素对应输入中的一句话，包含 t(原文)、s(说话者)、e(语气)、m(模仿声音)。不要输出任何非 JSON 内容。",
          },
          {
            role: "user",
            content: this.prompt.replace("{{text}}", text),
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: { type: "json_object" },
      });

      const responseText = this._getReplyText(completion);
      if (typeof responseText !== "string" || !responseText.trim()) {
        throw new Error("Empty or invalid response from AI service");
      }

      let responseData;

      try {
        // 响应应该是一个包含单个数组属性的JSON对象，或直接为数组
        const parsedResponse = JSON.parse(responseText);

        if (Array.isArray(parsedResponse)) {
          responseData = parsedResponse;
        } else {
          // 检查响应是否包含数组属性
          const arrayKey = Object.keys(parsedResponse).find((key) =>
            Array.isArray(parsedResponse[key])
          );

          if (arrayKey) {
            responseData = parsedResponse[arrayKey];
          } else {
            responseData = parsedResponse;
          }
        }

        // 保证始终返回数组，避免 processLongText 中 ...chunkResults 报错
        return Array.isArray(responseData) ? responseData : [responseData];
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid JSON response from AI service");
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  }

  /**
   * 处理长文本，将其分成可管理的块
   * @param {string} text 要处理的完整文本
   * @param {number} [chunkSize=2000] 每个块的最大字符数
   * @returns {Promise<Array>} 合并的分析结果
   */
  async processLongText(text, chunkSize = 2000) {
    // 如果文本足够短，直接分析
    if (text.length <= chunkSize) {
      return await this.analyzeText(text);
    }

    // 将文本分成可管理的块
    const chunks = this.splitTextIntoChunks(text, chunkSize);

    // 处理每个块并合并结果
    const results = [];
    for (const chunk of chunks) {
      const chunkResults = await this.analyzeText(chunk);
      const list = Array.isArray(chunkResults) ? chunkResults : [chunkResults];
      results.push(...list);
    }

    return results;
  }

  /**
   * 将文本拆分成块，尽可能保持段落的完整性
   * @param {string} text 要拆分的文本
   * @param {number} chunkSize 每个块的最大字符数
   * @returns {Array<string>} 文本块的数组
   */
  splitTextIntoChunks(text, chunkSize) {
    const paragraphs = text.split(/\n\s*\n/); // 按段落分隔符分割
    const chunks = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // 如果添加这个段落会超出块大小且我们已经有内容
      if (
        currentChunk.length + paragraph.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        // 将段落添加到当前块
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }

    // 添加最后一个块（如果有内容）
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}

module.exports = OpenAIClient;
