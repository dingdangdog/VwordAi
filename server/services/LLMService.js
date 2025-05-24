/**
 * LLM服务
 * 处理章节文本的LLM解析
 */
const Settings = require('../models/Settings');
const Chapter = require('../models/Chapter');
const OpenAIClient = require('../llm/openai');
const AliyunClient = require('../llm/aliyun');
const VolcengineClient = require('../llm/volcengine');
const log = require("electron-log");

/**
 * 解析章节文本
 * @param {string} chapterId 章节ID
 * @returns {Promise<Object>} 解析结果
 */
async function parseChapter(chapterId) {
  try {
    // 获取章节
    const chapter = Chapter.getChapterById(chapterId);
    if (!chapter) {
      return { success: false, error: '章节不存在' };
    }

    // 获取LLM设置
    const llmSettings = Settings.getLLMSettings();

    // 获取章节指定的LLM提供商
    const providerType = chapter.llmProvider || 'openai'; // 默认使用OpenAI

    // 获取对应提供商的配置
    const providerConfig = llmSettings[providerType];
    if (!providerConfig || !providerConfig.key) {
      return {
        success: false,
        error: `LLM提供商 ${providerType} 未配置或密钥缺失`
      };
    }

    log.info(`[LLMService] 使用 ${providerType} 解析章节 ${chapterId}`);

    // 根据提供商类型创建对应的客户端
    let llmClient;
    switch (providerType) {
      case 'openai':
        llmClient = new OpenAIClient(providerConfig);
        break;
      case 'aliyun':
        llmClient = new AliyunClient(providerConfig);
        break;
      case 'volcengine':
        llmClient = new VolcengineClient(providerConfig);
        break;
      default:
        return {
          success: false,
          error: `不支持的LLM提供商: ${providerType}`
        };
    }

    // 处理章节文本
    const results = await llmClient.processLongText(chapter.text);

    // 将结果转换为标准格式
    const parsedResults = {
      chapterId,
      title: chapter.title || chapter.name,
      segments: formatResults(results, providerType),
      processedAt: new Date().toISOString()
    };

    // 更新章节状态
    Chapter.updateChapter(chapterId, { processed: true });

    return { success: true, data: parsedResults };
  } catch (error) {
    log.error(`[LLMService] 解析章节失败: ${error.message}`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 格式化LLM解析结果
 * @param {Array} results LLM解析结果
 * @param {string} providerType LLM提供商类型
 * @returns {Array} 格式化后的结果
 */
function formatResults(results, providerType = 'volcengine') {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.map(item => {
    // 处理不同LLM提供商的不同响应格式
    // OpenAI格式: { text, character, tone }
    // Aliyun格式: { t (text), s (speaker), e (emotion), m (mimicry) }
    // Volcengine格式: { t (text), s (speaker), e (emotion), m (mimicry) }

    let text, character, tone, voice = '';

    // 根据提供商类型处理不同的响应格式
    switch (providerType) {
      case 'openai':
        text = item.text || '';
        character = item.character || '';
        tone = item.tone || '';
        // OpenAI没有模仿声音字段，根据角色性别推断
        if (character) {
          if (character.includes('女') || character.includes('妹') || character.includes('姐')) {
            voice = 'female-youth';
          } else if (character.includes('男') || character.includes('哥') || character.includes('弟')) {
            voice = 'male-youth';
          }
        }
        break;

      case 'aliyun':
      case 'volcengine':
      default:
        // 火山引擎和阿里云使用相似的格式
        text = item.t || '';
        character = item.s || '';
        tone = item.e || '';

        // 根据模仿声音选择合适的声音
        if (item.m && item.m !== 'dft') {
          // 将模仿声音映射到声音
          switch(item.m) {
            case '女孩':
              voice = 'female-child';
              break;
            case '男孩':
              voice = 'male-child';
              break;
            case '年轻女性':
              voice = 'female-youth';
              break;
            case '年轻男性':
              voice = 'male-youth';
              break;
            case '年长女性':
              voice = 'female-middle';
              break;
            case '年长男性':
              voice = 'male-middle';
              break;
            case '年老女性':
              voice = 'female-elder';
              break;
            case '年老男性':
              voice = 'male-elder';
              break;
          }
        }
        break;
    }

    // 如果没有指定声音，根据角色名称推断
    if (!voice && character) {
      // 简单的性别推断
      if (character.includes('女') || character.includes('妹') || character.includes('姐')) {
        voice = 'female-youth';
      } else if (character.includes('男') || character.includes('哥') || character.includes('弟')) {
        voice = 'male-youth';
      } else if (character === '旁白' || !character) {
        voice = 'narrator-1';
      }
    }

    return {
      text,
      character,
      tone,
      voice
    };
  });
}

module.exports = {
  parseChapter
};
