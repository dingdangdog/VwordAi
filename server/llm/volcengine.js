const { OpenAI } = require("openai");

/**
 * 火山引擎大语言模型客户端
 * @class VolcengineClient
 */
class VolcengineClient {
  /**
   * 创建火山引擎大语言模型客户端
   * @param {Object} config 配置对象
   * @param {string} config.key 火山引擎API密钥
   * @param {string} config.endpoint 火山引擎API端点
   * @param {string} [config.model] 要使用的模型，默认为'doubao-1.5-pro-32k-250115' doubao-1.5-lite-32k-250115
   */
  constructor(config) {
    this.client = new OpenAI({
      apiKey: config.key,
      baseURL: config.endpoint || "https://ark.cn-beijing.volces.com/api/v3/",
    });
    this.model = config.model || "doubao-1.5-pro-32k-250115";
    this.temperature = config.temperature != null ? Number(config.temperature) : 0.3;
    this.maxTokens = config.maxTokens != null ? Number(config.maxTokens) : 4096;
    this.topP = config.topP != null ? Number(config.topP) : 0.95;
    console.log("LLM Model:", this.model);
    this.prompt = this.createPrompt();
  }

  /**
   * 创建用于文本分析的优化提示
   * @returns {string} 提示模板
   */
  createPrompt() {
    return `### 指令 ###
分析指定的小说文本，将其拆解为有声小说文稿，识别每句话的说话者和语气或情绪。**必须覆盖输入文本的每一句，不得只输出第一句或摘要。**请按照以下要求进行分析：

1. 将文本分解为单独的句子（按句号、问号、感叹号、省略号、换行、引号内对话等切分）。
2. 对于**每一句**都输出一个对象，确定：
   - 说话者是谁（旁白用'dft'，对话从上下文推断人名）
   - 特殊语气或情绪（快乐、悲伤、愤怒、恐惧、好奇、紧张、平静、兴奋、惊讶、失望、羞愧、嫌恶、喜爱、骄傲、讽刺、严肃、轻松、'dft'表示默认）
   - 特殊模仿声音（女孩、男孩、年轻女性、年轻男性、年长女性、年长男性、年老女性、年老男性、'dft'表示默认）

3. 仅输出一个合法的 JSON 数组，不要任何解释或 markdown。数组长度必须等于输入文本的句子数量。

### 输出格式 ###
一个 JSON 数组，每个元素包含： "t"(原文)、"s"(说话者)、"e"(语气)、"m"(模仿声音)。

### 示例（多句对应多个元素） ###
[
  {"t": "在风和日丽的下午，小明和小红在公园里散步。", "s": "dft", "e": "dft", "m": "dft"},
  {"t": "小红问小明：\"你好吗？\"", "s": "dft", "e": "dft", "m": "dft"},
  {"t": "小明回答说：\"我很好，谢谢。\"", "s": "dft", "e": "dft", "m": "dft"}
]

### 输入文本（请对其中每一句都输出一个对象） ###
{{text}}
`;
  }

  /**
   * 调用火山引擎API分析文本
   * @param {string} text 要分析的文本
   * @returns {Promise<Array>} 以JSON格式返回分析结果
   */
  async analyzeText(text) {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at literary analysis. Your task is to identify speakers and tone/mood in narrative text and output results in valid JSON format only.",
          },
          {
            role: "user",
            content: this.prompt.replace("{{text}}", text),
          },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
        stream: false,
      });

      const responseText = completion.choices[0].message.content;
      let responseData;

      try {
        // Try to parse as direct JSON array first
        responseData = JSON.parse(responseText);

        // If it's an object with array properties, extract the array
        if (typeof responseData === "object" && !Array.isArray(responseData)) {
          const arrayKeys = ["segments", "items", "data", "result"];
          const arrayKey = arrayKeys.find((k) => Array.isArray(responseData[k]))
            || Object.keys(responseData).find((key) =>
              Array.isArray(responseData[key])
            );
          if (arrayKey) {
            responseData = responseData[arrayKey];
          } else if (
            "t" in responseData ||
            ("s" in responseData && "e" in responseData)
          ) {
            // 单句对象时包装成单元素数组，保证 processLongText 收到数组
            responseData = [responseData];
          }
        }

        return Array.isArray(responseData) ? responseData : [responseData];
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid JSON response from AI service");
      }
    } catch (error) {
      console.error("Error calling Volcengine API:", error);
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
      results.push(...chunkResults);
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

module.exports = VolcengineClient;
