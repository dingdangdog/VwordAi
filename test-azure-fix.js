/**
 * 测试 Azure TTS 配置修复
 * 这个脚本用于验证 Azure TTS 测试功能是否正常工作
 */

const { ipcRenderer } = require('electron');

// 模拟 Azure 配置数据
const testAzureConfig = {
  key: "your-azure-key-here",
  region: "eastus",
  endpoint: ""
};

// 测试数据
const testData = {
  text: "这是一个Azure TTS配置测试，如果您能听到这段话，说明配置正确。",
  voice: "zh-CN-XiaoxiaoNeural",
  speed: 1.0,
  emotion: "general"
};

async function testAzureTTSFix() {
  console.log("开始测试 Azure TTS 修复...");
  
  try {
    // 测试新的统一接口
    console.log("测试 tts:test-provider-connection 接口...");
    const result1 = await ipcRenderer.invoke("tts:test-provider-connection", "azure", {
      ...testAzureConfig,
      ...testData
    });
    
    console.log("新接口测试结果:", result1);
    
    // 测试旧的兼容接口
    console.log("测试 test-tts-provider-connection 接口...");
    const result2 = await ipcRenderer.invoke("test-tts-provider-connection", "azure", {
      ...testData
    });
    
    console.log("旧接口测试结果:", result2);
    
    // 检查状态是否正确保存
    console.log("检查配置状态...");
    const ttsSettings = await ipcRenderer.invoke("get-tts-settings");
    console.log("TTS设置:", ttsSettings);
    
    if (ttsSettings.success && ttsSettings.data.azure) {
      console.log("Azure 配置状态:", ttsSettings.data.azure.status);
    }
    
  } catch (error) {
    console.error("测试过程中出现错误:", error);
  }
}

// 如果在渲染进程中运行
if (typeof window !== 'undefined' && window.api) {
  // 使用 preload.js 提供的 API
  async function testWithPreloadAPI() {
    console.log("使用 preload API 测试...");
    
    try {
      const result = await window.api.tts.testProviderConnection("azure");
      console.log("Preload API 测试结果:", result);
    } catch (error) {
      console.error("Preload API 测试失败:", error);
    }
  }
  
  // 在页面加载完成后执行测试
  document.addEventListener('DOMContentLoaded', () => {
    testWithPreloadAPI();
  });
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testAzureTTSFix,
    testAzureConfig,
    testData
  };
}

console.log("Azure TTS 测试脚本已加载");
