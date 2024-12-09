const axios = require("axios");

class HttpClient {
  static CLOUD_URL = "https://vow.oldmoon.top";
  // static CLOUD_URL = "http://localhost:9910";
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
      url = HttpClient.CLOUD_URL + url;

      const options = {
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      // 如果是 POST、PUT、PATCH 等需要传递 body 的请求
      if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && params) {
        options.data = params; // axios 使用 `data` 字段传递请求体
      }

      // 如果是 GET 请求并有参数，axios 自动处理 query 参数
      if (method.toUpperCase() === "GET" && params) {
        options.params = params; // axios 使用 `params` 字段传递 query 参数
      }

      // 发起请求
      const response = await axios(options);
      // console.log(response.headers);
      // 检查 Content-Type
      const contentType = response.headers["content-type"]?.toLowerCase();
      if (contentType === "audio/wav") {
        return response;
      }

      // 返回数据
      return response.data;
    } catch (error) {
      console.error("Cloud Api Error:", error.message);
      // 处理 axios 错误格式
      if (error.response) {
        return {
          c: 500,
          m: error.response.statusText,
          d: error.response.status,
        };
      } else if (error.request) {
        return {
          c: 500,
          m: "无法连接到服务器",
        };
      } else {
        return {
          c: 500,
          m: error.message,
        };
      }
    }
  }

  static async download(url, method = "GET", params = null, headers = {}) {
    try {
      url = HttpClient.CLOUD_URL + url;

      const options = {
        method,
        url,
        responseType: "stream",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      // 如果是 POST、PUT、PATCH 等需要传递 body 的请求
      if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && params) {
        options.data = params; // axios 使用 `data` 字段传递请求体
      }

      // 如果是 GET 请求并有参数，axios 自动处理 query 参数
      if (method.toUpperCase() === "GET" && params) {
        options.params = params; // axios 使用 `params` 字段传递 query 参数
      }

      // 发起请求
      const response = await axios(options);
      return response;
    } catch (error) {
      console.error("Cloud Api Error:", error.message);
      // 处理 axios 错误格式
      if (error.response) {
        return {
          c: 500,
          m: error.response.statusText,
          d: error.response.status,
        };
      } else if (error.request) {
        return {
          c: 500,
          m: "无法连接到服务器",
        };
      } else {
        return {
          c: 500,
          m: error.message,
        };
      }
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
