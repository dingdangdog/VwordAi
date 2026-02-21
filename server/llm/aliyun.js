const { default: axios } = require("axios");

/**
 * 阿里云大语言模型客户端
 * @class AliyunClient
 */
class AliyunClient {
  /**
   * 创建阿里云大语言模型客户端
   * @param {Object} config 配置对象
   * @param {string} config.appkey 阿里云AppKey
   * @param {string} config.token 阿里云访问Token
   * @param {string} [config.endpoint] 阿里云API端点
   * @param {string} [config.model] 要使用的模型，默认为'qwen-max'
   */
  constructor(config) {
    this.appkey = config.appkey;
    this.token = config.token;
    this.endpoint =
      config.endpoint ||
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
    this.model = config.model || "qwen-max";
    this.prompt = this.createPrompt();
  }

  /**
   * 创建用于文本分析的优化提示
   * @returns {string} 提示模板
   */
  createPrompt() {
    return `### 指令 ###
分析以下小说文本，识别每句话的说话者和语气或情绪。**必须覆盖输入文本的每一句，不得只输出第一句或摘要。**请按照以下要求进行分析：

1. 将文本分解为单独的句子（按句号、问号、感叹号、省略号、换行、引号内对话等切分）。
2. 对于**每一句**都输出一个对象，确定：说话者(s)、语气(e)、模仿声音(m)。旁白用'dft'。
3. 仅输出一个合法的 JSON 数组，不要任何解释。数组长度必须等于输入文本的句子数量。

### 文本 ###
{{text}}

### 输出格式 ###
一个 JSON 数组，每个元素包含： "t"(原文)、"s"(说话者)、"e"(语气)、"m"(模仿声音)。必须覆盖原文每一句。

### 示例 ###
[{"t":"在风和日丽的下午，小明和小红在公园里散步。","s":"dft","e":"dft","m":"dft"},{"t":"你好吗？","s":"小红","e":"友好","m":"dft"},{"t":"我很好，谢谢。","s":"小明","e":"中性","m":"dft"}]`;
  }

  /**
   * 调用阿里云API分析文本
   * @param {string} text 要分析的文本
   * @returns {Promise<Array>} 以JSON格式返回分析结果
   */
  async analyzeText(text) {
    try {
      const requestData = {
        model: this.model,
        input: {
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
        },
        parameters: {
          temperature: 0.3,
          top_p: 0.95,
          result_format: "json",
        },
      };

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        "X-DashScope-AppKey": this.appkey,
      };

      const response = await axios.post(this.endpoint, requestData, {
        headers,
      });
      const responseData = response.data;

      if (responseData.output && responseData.output.text) {
        try {
          const content = responseData.output.text;
          const parsedContent = JSON.parse(content);
          if (Array.isArray(parsedContent)) return parsedContent;
          if (parsedContent && typeof parsedContent === "object") {
            const arr = parsedContent.segments || parsedContent.items || parsedContent.data || parsedContent.result;
            if (Array.isArray(arr)) return arr;
            if ("t" in parsedContent || ("s" in parsedContent && "e" in parsedContent))
              return [parsedContent];
          }
          return [parsedContent];
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
          throw new Error("Invalid JSON response from AI service");
        }
      } else {
        throw new Error("Unexpected response format from API");
      }
    } catch (error) {
      console.error("Error calling Aliyun API:", error.message);
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

module.exports = AliyunClient;
