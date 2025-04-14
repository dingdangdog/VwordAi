/**
 * 设置控制器
 * 处理所有与应用设置相关的IPC通信
 */
const { ipcMain } = require('electron');
const Settings = require('../models/Settings');

/**
 * 初始化设置控制器
 */
function init() {
  // 获取所有设置
  ipcMain.handle('get-settings', async () => {
    return Settings.getAllSettings();
  });

  // 获取单个设置项
  ipcMain.handle('get-setting', async (event, key) => {
    return Settings.getSetting(key);
  });

  // 更新设置
  ipcMain.handle('update-settings', async (event, settingsData) => {
    return Settings.updateSettings(settingsData);
  });

  // 获取默认导出路径
  ipcMain.handle('get-default-export-path', async () => {
    return Settings.getDefaultExportPath();
  });

  // 设置默认导出路径
  ipcMain.handle('set-default-export-path', async (event, path) => {
    Settings.setDefaultExportPath(path);
    return true;
  });

  // 重置所有设置为默认值
  ipcMain.handle('reset-settings', async () => {
    return Settings.resetToDefaults();
  });
}

module.exports = {
  init
}; 