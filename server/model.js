const path = require("path");
const fs = require("fs");

const { readJsonFile, success } = require("./util");
const { getConfigDir } = require("./config");

const MODEL_FILE = "models.json";

const getModels = (provider) => {
  const configDir = getConfigDir();
  let models = readJsonFile(path.join(configDir, MODEL_FILE));
  // console.log(models);
  if (provider) {
    if (provider !== "collect") {
      models = models.filter((m) => m.provider === provider);
    } else {
      models = models.filter((m) => m.collect === true);
    }
  }
  // console.log(models);
  return success(models, "success");
};

// export interface VoiceModel {
//   provider: string;
//   code: string;
//   collect: boolean;
//   lang: string;
//   gender: string;
//   name: string;
//   level?: string;
//   emotions: Emotion[];
// }
const saveModel = (model) => {
  const configDir = getConfigDir();
  const modelFilePath = path.join(configDir, MODEL_FILE);
  let models = readJsonFile(modelFilePath);

  models.forEach((m) => {
    if (m.code === model.code && m.provider === model.provider) {
      m.name = model.name;
      m.lang = model.lang;
      m.gender = model.gender;
      m.level = model.level;
      m.emotions = model.emotions;
      m.collect = model.collect;
      return;
    }
  });

  fs.writeFileSync(modelFilePath, JSON.stringify(models));
  return success(model, "success");
};

module.exports = {
  getModels,
  saveModel,
};
