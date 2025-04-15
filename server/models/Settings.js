/**
 * 设置模型
 * 管理应用的全局设置
 */
const path = require('path');
const os = require('os');
const storage = require('../utils/storage');
const { success, error } = require('../utils/result');

// 设置存储键
const SETTINGS_KEY = 'settings';

// 默认设置
const DEFAULT_SETTINGS = {
  theme: 'light',
  defaultExportPath: path.join(os.homedir(), 'Documents', 'DOTTS'),
  language: 'zh_CN',
  outputFormat: 'mp3',
  defaultVoiceSettings: {
    serviceProvider: null,
    voice: null,
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0
  },
  autoSave: true,
  autoSaveInterval: 5, // 分钟
  maxConcurrentTasks: 2
};

/**
 * 设置类
 */
class Settings {
  /**
   * 获取所有设置
   * @returns {Object} 所有设置
   */
  static getAllSettings() {
    const settings = storage.readConfig(SETTINGS_KEY, {});
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  /**
   * 获取单个设置项
   * @param {string} key 设置键
   * @returns {any} 设置值
   */
  static getSetting(key) {
    const settings = this.getAllSettings();
    const value = settings[key];
    
    return success({
      key,
      value: value !== undefined ? value : DEFAULT_SETTINGS[key]
    });
  }

  /**
   * 更新设置
   * @param {Object} settingsData 更新的设置数据
   * @returns {Object} 更新后的所有设置
   */
  static updateSettings(settingsData) {
    try {
      // 获取当前设置并合并新设置
      const currentSettings = this.getAllSettings();
      const updatedSettings = { ...currentSettings, ...settingsData };
      
      // 保存合并后的设置
      storage.saveConfig(SETTINGS_KEY, updatedSettings);
      
      return success(updatedSettings);
    } catch (err) {
      console.error('更新设置失败:', err);
      return error(err.message);
    }
  }

  /**
   * 重置所有设置为默认值
   * @returns {Object} 默认设置
   */
  static resetToDefaults() {
    try {
      storage.saveConfig(SETTINGS_KEY, DEFAULT_SETTINGS);
      return success(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('重置设置失败:', err);
      return error(err.message);
    }
  }

  /**
   * 获取默认导出路径
   * @returns {Object} 包含导出路径的结果对象
   */
  static getDefaultExportPath() {
    const settings = this.getAllSettings();
    return success({ path: settings.defaultExportPath });
  }

  /**
   * 设置默认导出路径
   * @param {string} path 导出路径
   * @returns {Object} 结果对象
   */
  static setDefaultExportPath(path) {
    try {
      const settings = this.getAllSettings();
      settings.defaultExportPath = path;
      
      storage.saveConfig(SETTINGS_KEY, settings);
      return success({ path });
    } catch (err) {
      console.error('设置导出路径失败:', err);
      return error(err.message);
    }
  }
}

module.exports = Settings; 
module.exports = settingsInstance; 