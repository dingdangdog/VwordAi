/**
 * 服务商控制器
 * 处理所有与服务商配置相关的IPC通信
 */
const { ipcMain } = require('electron');
const ServiceProvider = require('../models/ServiceProvider');
const { success, error } = require('../utils/result');

/**
 * 初始化服务商控制器
 */
function init() {
  // 获取所有服务商配置
  ipcMain.handle('service-provider:get-all', async () => {
    try {
      const providers = ServiceProvider.getAllServiceProviders();
      return success(providers);
    } catch (err) {
      return error(`获取服务商配置失败: ${err.message}`);
    }
  });

  // 根据ID获取服务商配置
  ipcMain.handle('service-provider:get', async (event, id) => {
    try {
      const provider = ServiceProvider.getServiceProviderById(id);
      if (!provider) {
        return error('服务商配置不存在');
      }
      return success(provider);
    } catch (err) {
      return error(`获取服务商配置失败: ${err.message}`);
    }
  });

  // 创建服务商配置
  ipcMain.handle('service-provider:create', async (event, providerData) => {
    try {
      const newProvider = ServiceProvider.createServiceProvider(providerData);
      return success(newProvider);
    } catch (err) {
      return error(`创建服务商配置失败: ${err.message}`);
    }
  });

  // 更新服务商配置
  ipcMain.handle('service-provider:update', async (event, id, providerData) => {
    try {
      const updatedProvider = ServiceProvider.updateServiceProvider(id, providerData);
      if (!updatedProvider) {
        return error('服务商配置不存在');
      }
      return success(updatedProvider);
    } catch (err) {
      return error(`更新服务商配置失败: ${err.message}`);
    }
  });

  // 删除服务商配置
  ipcMain.handle('service-provider:delete', async (event, id) => {
    try {
      const result = ServiceProvider.deleteServiceProvider(id);
      if (!result) {
        return error('服务商配置不存在');
      }
      return success(null, '服务商配置已删除');
    } catch (err) {
      return error(`删除服务商配置失败: ${err.message}`);
    }
  });

  // 测试服务商连接
  ipcMain.handle('service-provider:test-connection', async (event, id) => {
    try {
      const result = await ServiceProvider.testConnection(id);
      return success(result);
    } catch (err) {
      return error(`测试连接失败: ${err.message}`);
    }
  });
}

module.exports = {
  init
}; 