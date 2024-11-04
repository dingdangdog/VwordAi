const fs = require("fs");
const path = require("path");

// 读取JSON文件
const readJsonFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
};

const copyFiles = (srcDir, destDir, excludedFiles = []) => {
  // 检查目标文件夹是否存在，如果不存在则创建它
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 读取源目录的内容
  const files = fs.readdirSync(srcDir);

  files.forEach((file) => {
    // Skip excluded files like 'server_config.json'
    if (excludedFiles.includes(file)) {
      return;
    }
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);

    // 检查是文件还是文件夹
    if (fs.statSync(srcFile).isFile()) {
      // 将文件复制到目标目录
      fs.copyFileSync(srcFile, destFile);
    } else {
      // 如果是文件夹，则递归移动
      copyFiles(srcFile, path.join(destDir, file), excludedFiles);
    }
  });
};

// Helper function to move files from one folder to another, excluding specific files
const moveFiles = (srcDir, destDir, excludedFiles = []) => {
  // Check if destination folder exists, if not create it
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Read the contents of the source directory
  const files = fs.readdirSync(srcDir);

  files.forEach((file) => {
    // Skip excluded files like 'server_config.json'
    if (excludedFiles.includes(file)) {
      return;
    }

    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);

    // Check if it's a file or directory
    if (fs.statSync(srcFile).isFile()) {
      // Copy the file to the destination directory
      fs.copyFileSync(srcFile, destFile);
      // Delete the original file after copying
      fs.unlinkSync(srcFile);
    } else {
      // If it's a directory, move recursively
      moveFiles(srcFile, path.join(destDir, file), excludedFiles);
      // Optionally, remove the empty directory after moving its contents
      fs.rmdirSync(srcFile);
    }
  });
};

const success = (data, message) => {
  return {
    c: 200,
    m: message,
    d: data,
  };
};

const error = (data, message) => {
  return {
    c: 500,
    m: message,
    d: data,
  };
};

module.exports = {
  readJsonFile,
  success,
  error,
  moveFiles,
};
