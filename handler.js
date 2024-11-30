const { test } = require("./server/test.js");
const { playTest, playSSML } = require("./server/play.js");
const {
  setBaseDir,
  getConfigApi,
  changeDataDir,
  saveConfig,
} = require("./server/config.js");
const { getModels, saveModel, getEmotions } = require("./server/model.js");
const { speech } = require("./server/azure.js");
const { dotts, saveProject, getProject } = require("./server/tts.js");
const { login, register } = require("./server/cloud.js");

module.exports = {
  test,
  playTest,
  playSSML,

  setBaseDir,
  getConfigApi,
  changeDataDir,
  saveConfig,

  getModels,
  saveModel,
  getEmotions,

  speech,
  dotts,
  saveProject,
  getProject,

  login,
  register,
};
