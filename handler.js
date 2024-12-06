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
const { dotts, saveProject, getProject } = require("./server/project.js");
const {
  login,
  logout,
  register,
  getCombos,
  userInit,
  userInfo,
  userOrder,
  userProject,
  userUsed,
  getProjectDetail,
  uploadProject,
  deleteProject,
  createOrder,
  queryOrder,
  cancelOrder,
  cloudDotts,
  downloadAudio,
  pullProject,
} = require("./server/cloud.js");

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
  logout,
  register,
  getCombos,
  userInit,
  userInfo,
  userOrder,
  userProject,
  userUsed,
  uploadProject,
  getProjectDetail,
  deleteProject,
  createOrder,
  queryOrder,
  cancelOrder,
  cloudDotts,
  downloadAudio,
  pullProject,
};
