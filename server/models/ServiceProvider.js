/**
 * 服务商配置模型
 */
const { v4: uuidv4 } = require('uuid');
const storage = require('../utils/storage');

// 存储文件名
const STORAGE_FILE = 'service_providers';

/**
 * 获取所有服务商配置
 * @returns {Array} 服务商配置列表
 */
function getAllServiceProviders() {
  return storage.readData(STORAGE_FILE, []);
}

/**
 * 根据ID获取服务商配置
 * @param {string} id 服务商配置ID
 * @returns {Object|null} 服务商配置对象或null
 */
function getServiceProviderById(id) {
  const providers = getAllServiceProviders();
  return providers.find(provider => provider.id === id) || null;
}

/**
 * 创建新的服务商配置
 * @param {Object} providerData 服务商配置数据
 * @returns {Object} 创建的服务商配置
 */
function createServiceProvider(providerData) {
  const providers = getAllServiceProviders();
  
  // 检查是否有同名服务商
  if (providers.some(p => p.name === providerData.name)) {
    throw new Error('服务商名称已存在');
  }
  
  const now = new Date();
  const newProvider = {
    id: uuidv4(),
    name: providerData.name,
    apiKey: providerData.apiKey,
    secretKey: providerData.secretKey || '',
    createdAt: now,
    updatedAt: now,
    // 添加其他自定义字段
    ...Object.keys(providerData)
      .filter(key => !['id', 'name', 'apiKey', 'secretKey', 'createdAt', 'updatedAt'].includes(key))
      .reduce((obj, key) => {
        obj[key] = providerData[key];
        return obj;
      }, {})
  };
  
  providers.push(newProvider);
  storage.saveData(STORAGE_FILE, providers);
  
  return newProvider;
}

/**
 * 更新服务商配置
 * @param {string} id 服务商配置ID
 * @param {Object} providerData 更新的服务商配置数据
 * @returns {Object|null} 更新后的服务商配置或null
 */
function updateServiceProvider(id, providerData) {
  const providers = getAllServiceProviders();
  const index = providers.findIndex(provider => provider.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // 如果更改了名称，检查是否与其他服务商重名
  if (providerData.name && providerData.name !== providers[index].name) {
    const nameExists = providers.some(p => p.id !== id && p.name === providerData.name);
    if (nameExists) {
      throw new Error('服务商名称已存在');
    }
  }
  
  const updatedProvider = {
    ...providers[index],
    name: providerData.name || providers[index].name,
    apiKey: providerData.apiKey !== undefined ? providerData.apiKey : providers[index].apiKey,
    secretKey: providerData.secretKey !== undefined ? providerData.secretKey : providers[index].secretKey,
    updatedAt: new Date()
  };
  
  // 添加其他自定义字段
  Object.keys(providerData)
    .filter(key => !['id', 'name', 'apiKey', 'secretKey', 'createdAt', 'updatedAt'].includes(key))
    .forEach(key => {
      updatedProvider[key] = providerData[key];
    });
  
  providers[index] = updatedProvider;
  storage.saveData(STORAGE_FILE, providers);
  
  return updatedProvider;
}

/**
 * 删除服务商配置
 * @param {string} id 服务商配置ID
 * @returns {boolean} 是否删除成功
 */
function deleteServiceProvider(id) {
  const providers = getAllServiceProviders();
  const initialLength = providers.length;
  
  const filteredProviders = providers.filter(provider => provider.id !== id);
  
  if (filteredProviders.length === initialLength) {
    return false; // 没有删除任何服务商
  }
  
  storage.saveData(STORAGE_FILE, filteredProviders);
  return true;
}

/**
 * 测试服务商连接
 * @param {string} id 服务商配置ID
 * @returns {Promise<boolean>} 是否连接成功
 */
async function testConnection(id) {
  const provider = getServiceProviderById(id);
  
  if (!provider) {
    throw new Error('服务商配置不存在');
  }
  
  // TODO: 根据不同的服务商类型，调用不同的测试连接方法
  // 这里只是一个测试的实现，实际应该根据不同的服务商类型调用对应的API测试
  try {
    // 模拟异步测试
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error('测试连接失败:', error);
    return false;
  }
}

module.exports = {
  getAllServiceProviders,
  getServiceProviderById,
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
  testConnection
}; 