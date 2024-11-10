const { test } = require("./server/test.js");
const { playTest, playSSML } = require("./server/play.js");
const {
  setConfigDir,
  getConfigApi,
  getModels,
  changeDataDir,
  saveConfig,
} = require("./server/config.js");
const { speech } = require("./server/azure.js");
const { dotts, saveProject, getProject } = require("./server/tts.js");

module.exports = {
  test,
  playTest,
  playSSML,

  setConfigDir,
  getConfigApi,
  getModels,
  changeDataDir,
  saveConfig,

  speech,
  dotts,
  saveProject,
  getProject,
};
