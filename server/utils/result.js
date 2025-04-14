/**
 * 统一结果格式工具
 */

/**
 * 成功结果
 * @param {any} data 返回数据
 * @param {string} message 成功消息
 * @returns {object} 格式化的成功结果
 */
function success(data, message = '操作成功') {
  return { c: 200, m: message, d: data };
}

/**
 * 错误结果 
 * @param {string} message 错误消息
 * @param {any} data 错误数据
 * @returns {object} 格式化的错误结果
 */
function error(message = '操作失败', data = null) {
  return { c: 500, m: message, d: data };
}

/**
 * 未授权响应
 * @param {string} message 错误消息
 * @returns {Object} 标准未授权响应对象
 */
const unauthorized = (message = '未授权，请先登录') => {
  return {
    c: 400,
    m: message,
    d: null
  };
};

module.exports = {
  success,
  error,
  unauthorized
}; 