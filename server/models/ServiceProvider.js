/**
 * 服务商模型
 * 管理TTS服务提供商的配置信息
 */
const { v4: uuidv4 } = require('uuid');
const storage = require('../utils/storage');

const PROVIDER_STORAGE_KEY = 'service_providers';

/**
 * 服务商类
 */
class ServiceProvider {
  /**
   * 获取所有服务商配置
   * @returns {Array} 服务商配置列表
   */
  static getAllServiceProviders() {
    return storage.read(PROVIDER_STORAGE_KEY, []);
  }

  /**
   * 通过ID获取服务商配置
   * @param {string} id 服务商ID
   * @returns {Object|null} 服务商配置或null
   */
  static getServiceProviderById(id) {
    const providers = this.getAllServiceProviders();
    return providers.find(provider => provider.id === id) || null;
  }

  /**
   * 创建新的服务商配置
   * @param {Object} providerData 服务商数据
   * @returns {Object} 新创建的服务商配置
   */
  static createServiceProvider(providerData) {
    if (!providerData.name || !providerData.type) {
      throw new Error('服务商名称和类型为必填项');
    }

    const providers = this.getAllServiceProviders();
    
    const newProvider = {
      id: uuidv4(),
      name: providerData.name,
      type: providerData.type,
      apiKey: providerData.apiKey || '',
      apiSecret: providerData.apiSecret || '',
      region: providerData.region || '',
      endpoint: providerData.endpoint || '',
      enabled: providerData.enabled !== undefined ? providerData.enabled : true,
      createBy: new Date().toISOString(),
      updateBy: new Date().toISOString(),
      config: providerData.config || {}
    };
    
    providers.push(newProvider);
    storage.save(PROVIDER_STORAGE_KEY, providers);
    
    return newProvider;
  }

  /**
   * 更新服务商配置
   * @param {string} id 服务商ID
   * @param {Object} providerData 更新数据
   * @returns {Object} 更新后的服务商配置
   */
  static updateServiceProvider(id, providerData) {
    const providers = this.getAllServiceProviders();
    const index = providers.findIndex(provider => provider.id === id);
    
    if (index === -1) {
      throw new Error('服务商配置不存在');
    }
    
    const updatedProvider = {
      ...providers[index],
      ...providerData,
      updateBy: new Date().toISOString()
    };
    
    // 确保ID不被覆盖
    updatedProvider.id = id;
    
    providers[index] = updatedProvider;
    storage.save(PROVIDER_STORAGE_KEY, providers);
    
    return updatedProvider;
  }

  /**
   * 删除服务商配置
   * @param {string} id 服务商ID
   * @returns {boolean} 是否成功删除
   */
  static deleteServiceProvider(id) {
    const providers = this.getAllServiceProviders();
    const filteredProviders = providers.filter(provider => provider.id !== id);
    
    if (filteredProviders.length === providers.length) {
      throw new Error('服务商配置不存在');
    }
    
    storage.save(PROVIDER_STORAGE_KEY, filteredProviders);
    return true;
  }

  /**
   * 测试服务商连接
   * @param {string} id 服务商ID
   * @returns {Promise<Object>} 测试结果
   */
  static async testConnection(id) {
    const provider = this.getServiceProviderById(id);
    if (!provider) {
      throw new Error('服务商配置不存在');
    }
    
    // 根据不同类型服务商实现不同的测试逻辑
    try {
      switch (provider.type.toLowerCase()) {
        case 'azure':
          // 模拟Azure测试
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true, message: 'Azure服务连接成功' };
          
        case 'baidu':
          // 模拟百度测试
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true, message: '百度服务连接成功' };
          
        case 'aliyun':
          // 模拟阿里云测试
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true, message: '阿里云服务连接成功' };
          
        case 'tencent':
          // 模拟腾讯云测试
          await new Promise(resolve => setTimeout(resolve, 500));
          return { success: true, message: '腾讯云服务连接成功' };
          
        default:
          throw new Error(`不支持的服务商类型: ${provider.type}`);
      }
    } catch (error) {
      throw new Error(`测试连接失败: ${error.message}`);
    }
  }

  /**
   * 获取服务商支持的声音角色
   * @param {string} id 服务商ID
   * @returns {Array} 声音角色列表
   */
  static async getVoiceRoles(id) {
    const provider = this.getServiceProviderById(id);
    if (!provider) {
      throw new Error('服务商配置不存在');
    }
    
    // 根据不同服务商类型返回对应的声音角色列表
    const voiceRoles = {
      azure: [
        { id: 'az-xiaoxiao', name: '晓晓', gender: 'female', language: 'zh-CN' },
        { id: 'az-yunxi', name: '云希', gender: 'female', language: 'zh-CN' },
        { id: 'az-yunyang', name: '云扬', gender: 'male', language: 'zh-CN' }
      ],
      baidu: [
        { id: 'bd-woman', name: '女声', gender: 'female', language: 'zh' },
        { id: 'bd-man', name: '男声', gender: 'male', language: 'zh' }
      ],
      aliyun: [
        { id: 'ali-xiaoyun', name: '小云', gender: 'female', language: 'zh' },
        { id: 'ali-xiaogang', name: '小刚', gender: 'male', language: 'zh' }
      ],
      tencent: [
        { id: 'tencent-woman', name: '女声', gender: 'female', language: 'zh' },
        { id: 'tencent-man', name: '男声', gender: 'male', language: 'zh' }
      ]
    };
    
    return voiceRoles[provider.type.toLowerCase()] || [];
  }
}

module.exports = ServiceProvider; 