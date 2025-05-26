/**
 * 测试TTS合成和音频合并功能
 */
const path = require("path");
const fs = require("fs-extra");
const { mergeAudioFiles, getAudioDuration } = require("./utils/audioUtils");
const TTSService = require("./services/TTSService");
const Settings = require("./models/Settings");

// 测试目录和文件路径
const testDir = "E:/A_output/temp/62ccf28d-bf3e-46f1-8180-4eb8aa56d134";
const outputDir = "E:/A_output/temp/62ccf28d-bf3e-46f1-8180-4eb8aa56d134";

// 确保测试目录存在
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 测试文件路径
const inputFile1 = path.join(testDir, "part1_1744953633684.wav");
const inputFile2 = path.join(testDir, "part2_1744953654519.wav");
const outputFile = path.join(outputDir, "merged.wav");

// 主测试函数
async function testMergeAudioFiles() {
  console.log("开始测试音频合并功能...");

  try {
    // 检查测试文件是否存在
    if (!fs.existsSync(inputFile1) || !fs.existsSync(inputFile2)) {
      console.log("测试文件不存在，请确保以下文件存在:");
      console.log(`- ${inputFile1}`);
      console.log(`- ${inputFile2}`);
      return;
    }

    // 合并音频文件
    console.log(`合并文件: ${inputFile1} 和 ${inputFile2}`);
    const result = await mergeAudioFiles([inputFile1, inputFile2], outputFile);

    console.log(`合并成功! 输出文件: ${result}`);

    // 检查输出文件
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`输出文件大小: ${stats.size} 字节`);
    } else {
      console.log(`警告: 输出文件不存在: ${outputFile}`);
    }

  } catch (error) {
    console.error("测试失败:", error.message);
  }
}

// 测试段落TTS合成
async function testSegmentTTS() {
  console.log("\n=== 测试段落TTS合成 ===");

  try {
    // 获取TTS设置
    const ttsSettings = Settings.getTTSSettings();
    if (!ttsSettings.azure || !ttsSettings.azure.key) {
      console.log("❌ Azure TTS未配置，跳过测试");
      return { success: false, message: "Azure TTS未配置" };
    }

    // 模拟段落数据
    const segmentData = {
      text: "这是一个测试段落，用于验证TTS合成功能。",
      voice: "zh-CN-XiaoxiaoNeural",
      tone: "平静",
      ttsConfig: {
        provider: "azure",
        model: "zh-CN-XiaoxiaoNeural",
        speed: 0,
        pitch: 0,
        volume: 100,
        emotion: "",
        style: ""
      }
    };

    console.log("段落数据:", JSON.stringify(segmentData, null, 2));

    // 确保临时目录存在
    const tempDir = path.join(__dirname, "temp");
    fs.ensureDirSync(tempDir);

    // 调用段落TTS合成
    const outputPath = path.join(tempDir, `test_segment_${Date.now()}.wav`);
    const result = await TTSService.synthesizeWithProvider(
      segmentData.text,
      {
        voice: segmentData.voice,
        tone: segmentData.tone,
        volume: segmentData.ttsConfig.volume,
        speed: segmentData.ttsConfig.speed,
        pitch: segmentData.ttsConfig.pitch,
        emotion: segmentData.ttsConfig.emotion,
        style: segmentData.ttsConfig.style,
        model: segmentData.ttsConfig.model
      },
      outputPath,
      ttsSettings.azure,
      "azure"
    );

    if (result.success) {
      console.log("✅ 段落TTS合成成功");
      console.log("音频文件路径:", result.data.filePath);

      // 验证文件是否存在
      if (fs.existsSync(result.data.filePath)) {
        const stats = fs.statSync(result.data.filePath);
        console.log("文件大小:", stats.size, "字节");
      }
    } else {
      console.log("❌ 段落TTS合成失败:", result.message);
    }

    return result;
  } catch (error) {
    console.error("❌ 段落TTS合成测试失败:", error.message);
    return { success: false, message: error.message };
  }
}

// 测试多段落TTS合成和音频合并
async function testMultiSegmentTTS() {
  console.log("\n=== 测试多段落TTS合成和音频合并 ===");

  try {
    // 获取TTS设置
    const ttsSettings = Settings.getTTSSettings();
    if (!ttsSettings.azure || !ttsSettings.azure.key) {
      console.log("❌ Azure TTS未配置，跳过测试");
      return { success: false, message: "Azure TTS未配置" };
    }

    const segments = [
      {
        text: "第一段：这是小说的开头，主人公刚刚踏上了冒险的旅程。",
        voice: "zh-CN-XiaoxiaoNeural",
        character: "旁白"
      },
      {
        text: "我一定要找到传说中的宝藏！",
        voice: "zh-CN-YunxiNeural",
        character: "主人公"
      },
      {
        text: "第二段：突然，一个神秘的声音从远处传来。",
        voice: "zh-CN-XiaoxiaoNeural",
        character: "旁白"
      }
    ];

    const audioFiles = [];
    const tempDir = path.join(__dirname, "temp");
    fs.ensureDirSync(tempDir);

    // 为每个段落生成TTS
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`\n生成段落 ${i + 1} 的TTS...`);
      console.log(`角色: ${segment.character}, 文本: ${segment.text}`);

      const outputPath = path.join(tempDir, `segment_${i + 1}_${Date.now()}.wav`);

      const result = await TTSService.synthesizeWithProvider(
        segment.text,
        {
          voice: segment.voice,
          tone: "平静",
          volume: 100,
          speed: 0,
          pitch: 0,
          emotion: "",
          style: "",
          model: segment.voice
        },
        outputPath,
        ttsSettings.azure,
        "azure"
      );

      if (result.success && fs.existsSync(result.data.filePath)) {
        audioFiles.push(result.data.filePath);
        const stats = fs.statSync(result.data.filePath);
        console.log(`✅ 段落 ${i + 1} TTS生成成功，文件大小: ${stats.size} 字节`);
      } else {
        console.log(`❌ 段落 ${i + 1} TTS生成失败:`, result.message);
        return { success: false, message: `段落 ${i + 1} TTS生成失败` };
      }
    }

    // 合并所有音频文件
    if (audioFiles.length > 0) {
      console.log(`\n开始合并 ${audioFiles.length} 个音频文件...`);

      const mergedOutputPath = path.join(tempDir, `merged_chapter_${Date.now()}.wav`);

      const mergedPath = mergeAudioFiles(audioFiles, mergedOutputPath);

      if (fs.existsSync(mergedPath)) {
        const stats = fs.statSync(mergedPath);
        console.log("✅ 音频合并成功");
        console.log("合并后文件路径:", mergedPath);
        console.log("合并后文件大小:", stats.size, "字节");

        // 获取音频时长
        try {
          const duration = await getAudioDuration(mergedPath);
          console.log("音频时长:", duration, "秒");
        } catch (err) {
          console.log("获取音频时长失败:", err.message);
        }

        return { success: true, data: { filePath: mergedPath, audioFiles } };
      } else {
        console.log("❌ 音频合并失败：合并后的文件不存在");
        return { success: false, message: "音频合并失败" };
      }
    } else {
      console.log("❌ 没有有效的音频文件可合并");
      return { success: false, message: "没有有效的音频文件" };
    }

  } catch (error) {
    console.error("❌ 多段落TTS合成测试失败:", error.message);
    return { success: false, message: error.message };
  }
}

// 主测试函数
async function runAllTests() {
  console.log("开始运行所有TTS测试...\n");

  try {
    // 测试1: 音频合并功能
    await testMergeAudioFiles();

    // 测试2: 段落TTS合成
    await testSegmentTTS();

    // 测试3: 多段落TTS合成和音频合并
    await testMultiSegmentTTS();

    console.log("\n🎉 所有测试完成!");
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error.message);
  }
}

// 执行测试
if (require.main === module) {
  runAllTests()
    .then(() => console.log("测试程序结束"))
    .catch(err => console.error("测试程序异常:", err.message));
}
