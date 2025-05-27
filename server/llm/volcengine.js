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
    console.log("LLM Model:", this.model);
    this.prompt = this.createPrompt();
  }

  /**
   * 创建用于文本分析的优化提示
   * @returns {string} 提示模板
   */
  createPrompt() {
    return `### 指令 ###
分析指定的小说文本，将其拆解为有声小说文稿，识别每句话的说话者和语气或情绪，并且尽量不要省略任何一段文字。请按照以下要求进行分析：

1. 将文本分解为单独的句子。
2. 对于每个句子，确定：
   - 说话者是谁（明确区分如果是有声小说，每句话应该是谁说的，'dft'表示旁白叙述）
   - 特殊语气或情绪（从以下选项中选择：快乐、悲伤、愤怒、恐惧、好奇、紧张、平静、兴奋、惊讶、失望、羞愧、嫌恶、喜爱、骄傲、讽刺、严肃、轻松、'dft'表示默认无特殊情感）
   - 特殊模仿声音（从以下选项中选择：女孩、男孩、年轻女性、年轻男性、年长女性、年长男性、年老女性、年老男性、'dft'表示默认无特殊模仿）

3. 如果说话者没有明确提及，请从上下文中推断。'dft'表示旁白叙述。如果确实无法确定，请使用"未知"。

4. 仅输出JSON格式的结果，不要包含任何其他解释或附加文本。

### 输出格式 ###
请以有效的JSON格式输出分析结果，格式为句子对象的数组。每个对象应包含以下字段：
- "t": 原始句子文本
- "s": 已识别的说话者，'dft'表示旁白叙述
- "e": 已识别的语气或情绪，'dft'表示默认
- "m": 已识别的模仿声音，'dft'表示默认

### 示例输入 ###
在风和日丽的下午，小明和小红在公园里散步。
小红问小明：“你好吗？”
小明回答说：“我很好，谢谢。”

### 示例输出 ###
[
  {
    "t": "在风和日丽的下午，小明和小红在公园里散步。",
    "s": "dft",
    "e": "dft",
    "m": "dft"
  },
  {
    "t": "小红问小明",
    "s": "dft",
    "e": "dft",
    "m": "dft"
  },
  {
    "t": "你好吗？",
    "s": "小红",
    "e": "友好",
    "m": "dft"
  },
  {
    "t": "小明回答说",
    "s": "dft",
    "e": "dft",
    "m": "dft"
  },
  {
    "t": "我很好，谢谢。",
    "s": "小明",
    "e": "中性",
    "m": "dft"
  }
]

### 输入文本 ###
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
        temperature: 0.3,
        top_p: 0.95,
        stream: false,
      });

      const responseText = completion.choices[0].message.content;
      let responseData;

      try {
        // Try to parse as direct JSON array first
        responseData = JSON.parse(responseText);

        // If it's an object with array properties, extract the array
        if (typeof responseData === "object" && !Array.isArray(responseData)) {
          const arrayKey = Object.keys(responseData).find((key) =>
            Array.isArray(responseData[key])
          );

          if (arrayKey) {
            responseData = responseData[arrayKey];
          }
        }

        return responseData;
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
