/**
 * LLM服务
 * 只负责LLM处理的核心逻辑，调用底层client
 * 不涉及配置管理和连接测试
 */
const Settings = require("../models/Settings");
const { success, error } = require("../utils/result");
const log = require("electron-log");

/**
 * 解析文本内容
 * @param {string} text 要解析的文本
 * @param {string} providerType LLM提供商类型
 * @param {object} providerConfig 提供商配置
 * @returns {Promise<Object>} 解析结果
 */
async function parseText(
  text,
  providerType = "volcengine",
  providerConfig = null
) {
  try {
    // 如果没有提供配置，从设置中获取
    if (!providerConfig) {
      const llmSettings = Settings.getLLMSettings();
      providerConfig = llmSettings[providerType];

      if (!providerConfig || !providerConfig.key) {
        return error(`LLM提供商 ${providerType} 未配置或密钥缺失`);
      }
    }

    log.info(`[LLMService] 使用 ${providerType} 解析文本`);

    // 根据提供商类型创建对应的客户端
    const llmClient = createLLMClient(providerType, providerConfig);
    if (!llmClient.success) {
      return error(llmClient.error);
    }

    // 处理文本
    const results = await llmClient.client.processLongText(text);

    // 将结果转换为标准格式
    const parsedResults = {
      segments: formatResults(results, providerType),
      processedAt: new Date().toISOString(),
      provider: providerType,
    };

    return success(parsedResults);
  } catch (err) {
    log.error(`[LLMService] 解析文本失败: ${err.message}`, err);
    return error("解析文本失败: " + err.message);
  }
}

/**
 * 解析章节文本（业务逻辑层调用）
 * @param {string} chapterId 章节ID
 * @returns {Promise<Object>} 解析结果
 */
async function parseChapter(chapterId) {
  try {
    // 这里需要从业务逻辑层传入章节数据，而不是直接访问模型
    // 这个函数应该被ChapterProcessingController调用
    log.warn(
      `[LLMService] parseChapter(${chapterId})应该被业务逻辑层调用，而不是直接调用`
    );
    return error("parseChapter应该通过业务逻辑层调用");
  } catch (err) {
    log.error(`[LLMService] 解析章节失败: ${err.message}`, err);
    return error("解析章节失败: " + err.message);
  }
}

/**
 * 创建LLM客户端
 * @param {string} providerType 提供商类型
 * @param {object} providerConfig 提供商配置
 * @returns {object} 客户端创建结果
 */
function createLLMClient(providerType, providerConfig) {
  try {
    let ClientClass;

    switch (providerType) {
      case "openai":
        ClientClass = require("../llm/openai");
        break;
      case "aliyun":
        ClientClass = require("../llm/aliyun");
        break;
      case "volcengine":
        ClientClass = require("../llm/volcengine");
        break;
      default:
        return {
          success: false,
          error: `不支持的LLM提供商: ${providerType}`,
        };
    }

    const client = new ClientClass(providerConfig);
    return {
      success: true,
      client,
    };
  } catch (err) {
    return {
      success: false,
      error: `创建LLM客户端失败: ${err.message}`,
    };
  }
}

/**
 * 格式化LLM解析结果
 * @param {Array} results LLM解析结果
 * @param {string} providerType LLM提供商类型
 * @returns {Array} 格式化后的结果
 */
function formatResults(results, providerType = "volcengine") {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.map((item) => {
    // 处理不同LLM提供商的不同响应格式
    // OpenAI格式: { text, character, tone }
    // Aliyun格式: { t (text), s (speaker), e (emotion), m (mimicry) }
    // Volcengine格式: { t (text), s (speaker), e (emotion), m (mimicry) }

    let text,
      character,
      tone,
      voice = "";

    // 根据提供商类型处理不同的响应格式
    switch (providerType) {
      case "openai":
        text = item.text || "";
        character = item.character || "";
        tone = item.tone || "";
        // OpenAI没有模仿声音字段，根据角色性别推断
        if (character) {
          if (
            character.includes("女") ||
            character.includes("妹") ||
            character.includes("姐")
          ) {
            voice = "female-youth";
          } else if (
            character.includes("男") ||
            character.includes("哥") ||
            character.includes("弟")
          ) {
            voice = "male-youth";
          }
        }
        break;

      case "aliyun":
      case "volcengine":
      default:
        // 火山引擎和阿里云使用相似的格式
        text = item.t || "";
        character = item.s || "";
        tone = item.e || "";

        // 根据模仿声音选择合适的声音
        if (item.m && item.m !== "dft") {
          // 将模仿声音映射到声音
          switch (item.m) {
            case "女孩":
              voice = "female-child";
              break;
            case "男孩":
              voice = "male-child";
              break;
            case "年轻女性":
              voice = "female-youth";
              break;
            case "年轻男性":
              voice = "male-youth";
              break;
            case "年长女性":
              voice = "female-middle";
              break;
            case "年长男性":
              voice = "male-middle";
              break;
            case "年老女性":
              voice = "female-elder";
              break;
            case "年老男性":
              voice = "male-elder";
              break;
          }
        }
        break;
    }

    // 如果没有指定声音，根据角色名称推断
    if (!voice && character) {
      // 简单的性别推断
      if (
        character.includes("女") ||
        character.includes("妹") ||
        character.includes("姐")
      ) {
        voice = "female-youth";
      } else if (
        character.includes("男") ||
        character.includes("哥") ||
        character.includes("弟")
      ) {
        voice = "male-youth";
      } else if (character === "旁白" || !character) {
        voice = "narrator-1";
      }
    }

    return {
      text,
      character,
      tone,
      voice,
    };
  });
}

module.exports = {
  parseText,
  parseChapter,
  createLLMClient,
  formatResults,
};
