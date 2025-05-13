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
    this.prompt = this.createPrompt();
  }

  /**
   * 创建用于文本分析的优化提示
   * @returns {string} 提示模板
   */
  createPrompt() {
    return `### 指令 ###
分析以下小说文本，识别每句话的说话者和语气或情绪。请按照以下要求进行分析：

1. 将文本分解为单独的句子。
2. 对于每个句子，确定：
   - 说话者是谁（如果是对话，'dft'表示旁白叙述）
   - 特殊语气或情绪（从以下选项中选择：快乐、悲伤、愤怒、恐惧、好奇、紧张、平静、兴奋、惊讶、失望、羞愧、嫌恶、喜爱、骄傲、讽刺、严肃、轻松、'dft'表示默认无特殊情感）
   - 特殊模仿声音（从以下选项中选择：女孩、男孩、年轻女性、年轻男性、年长女性、年长男性、年老女性、年老男性、'dft'表示默认无特殊模仿）
   
3. 如果说话者没有明确提及，请从上下文中推断。'dft'表示旁白叙述。如果确实无法确定，请使用"未知"。

4. 仅输出JSON格式的结果，不要包含任何其他解释或附加文本。

### 文本 ###
{{text}}

### 输出格式 ###
请以有效的JSON格式输出分析结果，格式为句子对象的数组。每个对象应包含以下字段：
- "t": 原始句子文本
- "s": 已识别的说话者，'dft'表示旁白叙述
- "e": 已识别的语气或情绪，'dft'表示默认
- "m": 已识别的模仿声音，'dft'表示默认

### 示例输出 ###
[
  {
    "t": "在风和日丽的下午，小明和小红在公园里散步。",
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
    "t": "我很好，谢谢。",
    "s": "小明",
    "e": "中性",
    "m": "dft"
  }
]`;
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
              "You are an expert at literary analysis. Your task is to identify speakers and tone/mood in narrative text and output results in valid JSON format only.",
          },
          {
            role: "user",
            content: this.prompt.replace("{{text}}", text),
          },
        ],
        temperature: 0.3, // 较低的温度以获得更一致的结果
        response_format: { type: "json_object" }, // 确保返回JSON格式
      });

      const responseText = completion.choices[0].message.content;
      let responseData;

      try {
        // 响应应该是一个包含单个数组属性的JSON对象
        // 我们需要从对象中获取数组
        const parsedResponse = JSON.parse(responseText);

        // 检查响应是否包含数组属性
        const arrayKey = Object.keys(parsedResponse).find((key) =>
          Array.isArray(parsedResponse[key])
        );

        if (arrayKey) {
          responseData = parsedResponse[arrayKey];
        } else {
          // 如果找不到数组属性，使用整个响应
          responseData = parsedResponse;
        }
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid JSON response from AI service");
      }

      return responseData;
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

module.exports = OpenAIClient;
