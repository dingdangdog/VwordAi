/**
 * 文件服务
 * 处理文件的读写操作
 */
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class FileService {
  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'novels');
    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'audio'),
      path.join(this.dataDir, 'covers'),
      path.join(this.dataDir, 'temp')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 保存文件
   * @param {Buffer|string} data 文件数据
   * @param {string} filePath 文件路径
   * @returns {Promise<string>} 保存后的文件路径
   */
  async saveFile(data, filePath) {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(filePath, data);
      return filePath;
    } catch (error) {
      console.error(`保存文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 读取文件
   * @param {string} filePath 文件路径
   * @returns {Promise<Buffer>} 文件数据
   */
  async readFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error(`读取文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} filePath 文件路径
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (error) {
      console.error(`删除文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 获取文件URL
   * @param {string} filePath 文件路径
   * @returns {string} 文件URL
   */
  getFileUrl(filePath) {
    return `file://${filePath.replace(/\\/g, '/')}`;
  }
}

module.exports = {
  FileService
};
