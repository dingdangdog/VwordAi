const { test } = require("./server/test.js");
const { playTest, playSSML } = require("./server/play.js");
const { setConfigDir, getConfigApi, getModels } = require("./server/config.js");
const { speech } = require("./server/azure.js");
const { dotts } = require("./server/tts.js");

module.exports = {
  test,
  playTest,
  playSSML,

  setConfigDir,
  getConfigApi,
  getModels,

  speech,
  dotts,
};
