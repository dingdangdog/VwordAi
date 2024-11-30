const fetch = require("node-fetch");

class HttpClient {
  /**
   * 发送 HTTP 请求
   * @param {string} url 请求的 URL
   * @param {string} method 请求方法 ('GET', 'POST', 'PUT', 'DELETE', 等)
   * @param {Object} params 请求参数或 body
   * @param {Object} headers 请求头
   * @returns {Promise<Object>} 响应数据
   */
  static async request(url, method = "GET", params = null, headers = {}) {
    try {
      url = "http://localhost:9910" + url;
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      // 如果是 POST、PUT 等需要传递 body 的请求
      if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && params) {
        options.body = JSON.stringify(params);
      }

      // 如果是 GET 请求并有参数，将参数拼接到 URL
      if (method.toUpperCase() === "GET" && params) {
        const queryParams = new URLSearchParams(params).toString();
        url += `?${queryParams}`;
      }

      // 发起请求
      const response = await fetch(url, options);

      // 检查 HTTP 状态码
      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${response.statusText}`
        );
      }

      // 返回 JSON 数据
      return await response.json();
    } catch (error) {
      console.error("Request failed:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * GET 请求
   */
  static async get(url, params = {}, headers = {}) {
    return await HttpClient.request(url, "GET", params, headers);
  }

  /**
   * POST 请求
   */
  static async post(url, params = {}, headers = {}) {
    return await HttpClient.request(url, "POST", params, headers);
  }

  /**
   * PUT 请求
   */
  static async put(url, params = {}, headers = {}) {
    return await HttpClient.request(url, "PUT", params, headers);
  }

  /**
   * DELETE 请求
   */
  static async delete(url, params = {}, headers = {}) {
    return await HttpClient.request(url, "DELETE", params, headers);
  }
}

module.exports = HttpClient;
