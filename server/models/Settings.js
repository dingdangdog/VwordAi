/**
 * 设置模型
 */
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

class Settings {
  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'settings.json');
    this.settings = this.loadSettings();
  }

  /**
   * 加载设置文件
   * @returns {Object} 设置对象
   */
  loadSettings() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
      return this.getDefaultSettings();
    } catch (error) {
      console.error('加载设置文件失败:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 保存设置到文件
   */
  saveSettings() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (error) {
      console.error('保存设置文件失败:', error);
    }
  }

  /**
   * 获取默认设置
   * @returns {Object} 默认设置对象
   */
  getDefaultSettings() {
    return {
      theme: 'light',
      fontSize: 16,
      fontFamily: 'Arial',
      autoSave: true,
      autoSaveInterval: 5, // 分钟
      defaultExportPath: path.join(os.homedir(), 'Documents'),
      showLineNumbers: true,
      checkSpelling: true,
      language: 'zh-CN',
      editorIndentSize: 2,
      wordWrap: true
    };
  }

  /**
   * 获取所有设置
   * @returns {Object} 所有设置
   */
  getAllSettings() {
    return this.settings;
  }

  /**
   * 获取特定设置项
   * @param {string} key 设置键名
   * @returns {any} 设置值
   */
  getSetting(key) {
    if (key in this.settings) {
      return this.settings[key];
    }
    const defaults = this.getDefaultSettings();
    return key in defaults ? defaults[key] : null;
  }

  /**
   * 更新设置
   * @param {Object} settingsData 要更新的设置
   * @returns {Object} 更新后的所有设置
   */
  updateSettings(settingsData) {
    this.settings = { ...this.settings, ...settingsData };
    this.saveSettings();
    return this.settings;
  }

  /**
   * 获取默认导出路径
   * @returns {string} 导出路径
   */
  getDefaultExportPath() {
    return this.settings.defaultExportPath || path.join(os.homedir(), 'Documents');
  }

  /**
   * 设置默认导出路径
   * @param {string} path 导出路径
   */
  setDefaultExportPath(exportPath) {
    this.settings.defaultExportPath = exportPath;
    this.saveSettings();
  }

  /**
   * 重置所有设置为默认值
   * @returns {Object} 默认设置
   */
  resetToDefaults() {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    return this.settings;
  }
}

// 创建单例
const settingsInstance = new Settings();

module.exports = settingsInstance; 