const AiClient = require("./aiclient");
require("dotenv").config(); // Load environment variables

/**
 * Test the AiClient text analysis functionality
 */
async function testTextAnalysis() {
  try {
    // Initialize the AI client with OpenAI API key
    const aiClient = new AiClient({
      apiKey: process.env.OPENAI_API_KEY,
      model: "doubao-1-5-pro-32k-250115",
      baseURL: "https://ark.cn-beijing.volces.com/api/v3/",
      // Optionally specify a different model if needed
      // model: 'gpt-3.5-turbo'
    });

    // Sample novel excerpt for testing
    const sampleText = `"我不知道该怎么办了，"小明叹了口气说道，眼里满是忧虑。
    
小红安慰地拍了拍他的肩膀。"别担心，我们会一起想办法的。"

"但是时间不多了！"小明猛地站起来，语气急促。"如果我们不能在明天之前解决这个问题，后果将会很严重。"

小红沉思了一会儿。她抬起头，眼中闪烁着决心的光芒。"我有个主意，虽然有点冒险，但值得一试。"

"什么主意？"小明好奇地问道。

小红压低了声音："我们可以联系李教授，他在这方面是专家。"

小明震惊地看着她。"你疯了吗？李教授从不接受学生的突然拜访！"

"但这是紧急情况，"小红坚定地说，"我相信他会理解的。"

小明摇了摇头，但随后露出一丝微笑。"好吧，反正我们也没有更好的选择了。"

窗外，一阵冷风吹过，树叶沙沙作响，仿佛在为即将到来的冒险伴奏。`;

    console.log("开始分析文本...");
    const longTextResults = await aiClient.processLongText(sampleText, 500);
    console.log("分析结果：");
    console.log(JSON.stringify(longTextResults, null, 2));
  } catch (error) {
    console.error("测试过程中出错：", error);
  }
}

// Run the test
testTextAnalysis();

/*
使用方法：
1. 确保已安装所需依赖：
   npm install openai dotenv

2. 创建.env文件，包含OpenAI API密钥：
   OPENAI_API_KEY=your_api_key_here

3. 运行测试脚本：
   node server/ai/test.js
*/
