const { OpenAI } = require("openai");

/**
 * AI client for text analysis using OpenAI
 * @class AiClient
 */
class AiClient {
  /**
   * Create a new AiClient
   * @param {Object} config Configuration object
   * @param {string} config.apiKey OpenAI API key
   * @param {string} [config.model='gpt-4-turbo-preview'] The OpenAI model to use
   */
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model || "gpt-4-turbo-preview";
    this.prompt = this.createPrompt();
  }

  /**
   * Create the optimized prompt for text analysis
   * @returns {string} The prompt template
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
   * Analyze text to identify speakers and tone/mood
   * @param {string} text The text to analyze
   * @returns {Promise<Array>} The analysis results in JSON format
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
        temperature: 0.3, // Lower temperature for more consistent results
        response_format: { type: "json_object" }, // Ensure JSON response
      });

      const responseText = completion.choices[0].message.content;
      let responseData;

      try {
        // The response should be a JSON object with a single array property
        // We need to get the array from within this object
        const parsedResponse = JSON.parse(responseText);

        // Check if the response contains an array property
        const arrayKey = Object.keys(parsedResponse).find((key) =>
          Array.isArray(parsedResponse[key])
        );

        if (arrayKey) {
          responseData = parsedResponse[arrayKey];
        } else {
          // If no array property is found, use the entire response
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
   * Process a long text by breaking it into manageable chunks
   * @param {string} text The full text to analyze
   * @param {number} [chunkSize=4000] Maximum characters per chunk
   * @returns {Promise<Array>} Combined analysis results
   */
  async processLongText(text, chunkSize = 2000) {
    // If text is short enough, analyze directly
    if (text.length <= chunkSize) {
      return await this.analyzeText(text);
    }

    // Split the text into manageable chunks
    const chunks = this.splitTextIntoChunks(text, chunkSize);

    // Process each chunk and combine results
    const results = [];
    for (const chunk of chunks) {
      const chunkResults = await this.analyzeText(chunk);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Split text into chunks by maintaining paragraph integrity when possible
   * @param {string} text The text to split
   * @param {number} chunkSize Maximum characters per chunk
   * @returns {Array<string>} Array of text chunks
   */
  splitTextIntoChunks(text, chunkSize) {
    const paragraphs = text.split(/\n\s*\n/); // Split by paragraph breaks
    const chunks = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size and we already have content
      if (
        currentChunk.length + paragraph.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}

module.exports = AiClient;
