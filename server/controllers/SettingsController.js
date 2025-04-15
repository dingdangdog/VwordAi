/**
 * 设置控制器
 * 处理所有与应用设置相关的IPC通信
 */
const { ipcMain } = require('electron');
const Settings = require('../models/Settings');
const { success, error } = require('../utils/result');

/**
 * 初始化设置控制器
 */
function init() {
  // 获取所有设置
  ipcMain.handle('get-settings', async () => {
    try {
      const settings = Settings.getAllSettings();
      return success(settings);
    } catch (err) {
      console.error('获取设置失败:', err);
      return error(err.message);
    }
  });

  // 获取单个设置项
  ipcMain.handle('get-setting', async (event, key) => {
    try {
      return Settings.getSetting(key);
    } catch (err) {
      console.error('获取设置项失败:', err);
      return error(err.message);
    }
  });

  // 更新设置
  ipcMain.handle('update-settings', async (event, settingsData) => {
    try {
      return Settings.updateSettings(settingsData);
    } catch (err) {
      console.error('更新设置失败:', err);
      return error(err.message);
    }
  });

  // 获取默认导出路径
  ipcMain.handle('get-default-export-path', async () => {
    try {
      return Settings.getDefaultExportPath();
    } catch (err) {
      console.error('获取默认导出路径失败:', err);
      return error(err.message);
    }
  });

  // 设置默认导出路径
  ipcMain.handle('set-default-export-path', async (event, path) => {
    try {
      return Settings.setDefaultExportPath(path);
    } catch (err) {
      console.error('设置默认导出路径失败:', err);
      return error(err.message);
    }
  });

  // 重置所有设置为默认值
  ipcMain.handle('reset-settings', async () => {
    try {
      return Settings.resetToDefaults();
    } catch (err) {
      console.error('重置设置失败:', err);
      return error(err.message);
    }
  });
  
  // 获取服务商配置
  ipcMain.handle('get-provider-settings', async (event, provider) => {
    try {
      return Settings.getProviderSettings(provider);
    } catch (err) {
      console.error('获取服务商配置失败:', err);
      return error(err.message);
    }
  });

  // 更新服务商配置
  ipcMain.handle('update-provider-settings', async (event, provider, providerData) => {
    try {
      return Settings.updateProviderSettings(provider, providerData);
    } catch (err) {
      console.error('更新服务商配置失败:', err);
      return error(err.message);
    }
  });
}

module.exports = {
  init,
}; 