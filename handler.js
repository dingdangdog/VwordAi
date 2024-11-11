const { test } = require("./server/test.js");
const { playTest, playSSML } = require("./server/play.js");
const {
  setBaseDir,
  getConfigApi,
  changeDataDir,
  saveConfig,
} = require("./server/config.js");
const { getModels, saveModel } = require("./server/model.js");
const { speech } = require("./server/azure.js");
const { dotts, saveProject, getProject } = require("./server/tts.js");

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

  speech,
  dotts,
  saveProject,
  getProject,
};
