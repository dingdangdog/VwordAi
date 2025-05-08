/**
 * TTS (Text-to-Speech) 工具函数
 */
import { ttsApi } from "@/api";

/**
 * 将文本分割成适合TTS合成的片段
 * 通常API有单次请求文本长度限制，需要分段处理
 */
export function splitTextForTTS(
  text: string,
  maxLength: number = 5000
): string[] {
  if (!text) return [];
  if (text.length <= maxLength) return [text];

  // 尝试在句号、问号、感叹号等处分割
  const segments: string[] = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLength) {
      segments.push(remainingText);
      break;
    }

    // 在maxLength位置前找最近的句子结束标记
    let endPos = remainingText.substring(0, maxLength).lastIndexOf("。");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf("！");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf("？");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf(".");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf("!");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf("?");

    // 如果没找到句子结束标记，则寻找逗号、分号等
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf("，");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf("；");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf(",");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf(";");

    // 如果还是没找到，就按空格或换行符分割
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf(" ");
    if (endPos === -1)
      endPos = remainingText.substring(0, maxLength).lastIndexOf("\n");

    // 如果所有分隔符都没找到，就在最大长度处截断
    if (endPos === -1) endPos = maxLength - 1;

    // 添加当前段落，并更新剩余文本
    segments.push(remainingText.substring(0, endPos + 1));
    remainingText = remainingText.substring(endPos + 1);
  }

  return segments;
}

/**
 * 计算语音合成的预估时长（秒）
 * 这只是一个粗略估计，实际时长会受到语速、停顿等因素影响
 */
export function estimateTTSDuration(text: string, speed: number = 1): number {
  if (!text) return 0;

  // 假设平均说话速度为每分钟200字，转换为每秒约3.33字
  // 语速调整会影响最终时长
  const charsPerSecond = 3.33 / speed;

  // 计算汉字、英文单词和标点符号的数量
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const words = text.match(/[a-zA-Z]+/g)?.length || 0;
  const punctuations = text.match(/[，。！？；：、,.!?;:]/g)?.length || 0;

  // 假设每个汉字算1个单位，每个英文单词算0.5个单位，每个标点符号带来0.5秒停顿
  const textUnits = chineseChars + words * 0.5;
  const pauseDuration = punctuations * 0.5;

  return Math.ceil(textUnits / charsPerSecond + pauseDuration);
}

/**
 * 合并多个音频文件
 * 这个函数在实际应用中需要使用Web Audio API或其他方法实现
 * 此处仅为示例
 */
export function concatenateAudioUrls(audioUrls: string[]): Promise<string> {
  return new Promise((resolve) => {
    // 这是一个模拟函数，实际情况应使用 AudioContext 等进行合并
    // 但由于这需要复杂的音频处理，这里只返回第一个URL作为示例
    console.log("合并音频文件:", audioUrls.length);

    if (audioUrls.length === 0) {
      resolve("");
    } else if (audioUrls.length === 1) {
      resolve(audioUrls[0]);
    } else {
      // 在实际应用中，这里应该使用Web Audio API合并音频
      // 由于只是示例，我们直接返回第一个URL
      setTimeout(() => {
        resolve(audioUrls[0]);
      }, 1000);
    }
  });
}

/**
 * 批量合成多个章节的语音
 * @param chapters 章节数组
 * @param progressCallback 进度回调函数
 * @returns 成功合成的章节ID到音频URL的映射
 */
export async function batchSynthesizeChapters(
  chapters: any[], 
  progressCallback?: (progress: number, chapterIndex: number) => void
): Promise<Record<string, {outputPath: string, audioUrl: string}>> {
  const result: Record<string, {outputPath: string, audioUrl: string}> = {};
  
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    
    try {
      console.log(`Synthesizing chapter ${i+1}/${chapters.length}: ${chapter.id} (${chapter.name})`);
      
      // 调用单个章节合成API
      const response = await ttsApi.synthesize(chapter.id);
      
      if (response.success && response.data && response.data.outputPath) {
        // 正确编码文件路径中的特殊字符
        const outputPath = response.data.outputPath;
        
        // 如果服务器已经提供了audioUrl，则直接使用
        let audioUrl = response.data.audioUrl;
        
        // 如果没有提供audioUrl，则从输出路径生成
        if (!audioUrl) {
          const encodedPath = outputPath
            .replace(/\\/g, '/')
            .replace(/#/g, '%23')
            .replace(/\?/g, '%3F')
            .replace(/\s/g, '%20');
          
          audioUrl = `file://${encodedPath}`;
        }
        
        result[chapter.id] = {
          outputPath: outputPath,
          audioUrl: audioUrl
        };
        
        console.log(`Successfully synthesized chapter: ${chapter.name}`);
      } else {
        const errorMsg = response.error || "Unknown error";
        console.error(`Failed to synthesize chapter ${chapter.id} (${chapter.name}): ${errorMsg}`);
      }
    } catch (error) {
      console.error(
        `Error synthesizing chapter ${chapter.id} (${chapter.name}):`, 
        error instanceof Error ? error.message : String(error)
      );
    }
    
    // 回调进度
    if (progressCallback) {
      const progress = Math.round(((i + 1) / chapters.length) * 100);
      progressCallback(progress, i);
    }
  }
  
  console.log(`Batch synthesis completed. Success: ${Object.keys(result).length}/${chapters.length}`);
  return result;
}

/**
 * 将Base64编码的音频数据转换为Blob对象
 */
export function base64ToBlob(
  base64: string,
  mimeType: string = "audio/mp3"
): Blob {
  // 从data URL中提取base64部分
  const base64Data = base64.split(",")[1] || base64;

  // 将base64解码为二进制
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}
