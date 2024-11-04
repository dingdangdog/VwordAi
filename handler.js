const { test } = require("./server/test.js");
const { setConfigDir, getConfigApi, getModels } = require("./server/config.js");
const { speech } = require("./server/azure.js");

module.exports = {
  test,
  
  setConfigDir,
  getConfigApi,
  getModels,

  speech,
};
