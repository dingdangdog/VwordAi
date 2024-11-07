const { test } = require("./server/test.js");
const { playTest } = require("./server/play.js");
const { setConfigDir, getConfigApi, getModels } = require("./server/config.js");
const { speech } = require("./server/azure.js");

module.exports = {
  test,
  playTest,

  setConfigDir,
  getConfigApi,
  getModels,

  speech,
};
