/**
 * 测试音频合并功能
 */
const path = require("path");
const fs = require("fs-extra");
const { mergeAudioFiles } = require("./utils/audioUtils");

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

// 执行测试
testMergeAudioFiles()
  .then(() => console.log("测试完成!"))
  .catch(err => console.error("测试过程中发生错误:", err.message));
