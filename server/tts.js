const fs = require("fs");
const path = require("path");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

const { getConfig } = require("./config");
const { success, error, readJsonFile } = require("./util");

const dotts = (ssml, fileName) => {
  if (!ssml) {
    return;
  }
  const config = getConfig();
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.serviceConfig.azure.key,
    config.serviceConfig.azure.region
  );

  // 判断fileName的父文件夹是否存在

  if (!fs.existsSync(path.dirname(fileName))) {
    fs.mkdirSync(path.dirname(fileName), { recursive: true });
  }

  console.log(fileName);
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(fileName);

  const speechSynthesizer = new sdk.SpeechSynthesizer(
    speechConfig,
    audioConfig
  );
  speechSynthesizer.speakSsmlAsync(
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
    xmlns:mstts="https://www.w3.org/2001/mstts" 
    xmlns:emo="http://www.w3.org/2009/10/emotionml" 
    xml:lang="zh-CN"> 
    ${ssml}
    </speak>
    `,
    (result) => {
      speechSynthesizer.close();
      if (result) {
        // return result as stream
        return fs.createReadStream(fileName);
      }
    },
    (error) => {
      console.log(error);
      speechSynthesizer.close();
    }
  );
  return success(fileName, "success");
};

// export interface Project {
//   path?: string;
//   name?: string;
//   content?: string;
//   createTime?: number;
//   updateTime?: number;
// }

const saveProject = (project) => {
  // console.log(project);
  // 项目名不存在，默认为创建时间
  if (!project.name) {
    project.name = project.createTime;
  }
  // 项目路径不存在，默认为数据路径 + 项目名
  if (!project.path) {
    const config = getConfig();
    project.path = path.join(config.dataPath, String(project.name));
  }
  // 项目数据文件路径
  const configPath = path.join(project.path, "project.json");
  // 判断项目文件夹是否存在
  if (!fs.existsSync(project.path)) {
    fs.mkdirSync(project.path, { recursive: true });
  }
  // 保存项目配置和数据
  fs.writeFileSync(configPath, JSON.stringify(project));

  return success(project, "success");
};

const getProject = (projectPath) => {
  const configPath = path.join(projectPath, "project.json");
  if (fs.existsSync(configPath)) {
    return success(readJsonFile(configPath), "success");
  } else {
    return error("", "项目文件不存在");
  }
};

module.exports = { dotts, saveProject, getProject };
