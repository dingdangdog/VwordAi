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

const moveFiles = (srcDir, destDir, excludedFiles = []) => {
  const rollbackStack = [];

  try {
    // Check if destination folder exists, if not create it
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Read the contents of the source directory
    const files = fs.readdirSync(srcDir);

    files.forEach((file) => {
      if (excludedFiles.includes(file)) {
        return;
      }

      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);

      if (fs.statSync(srcFile).isFile()) {
        // Copy the file to the destination directory
        fs.copyFileSync(srcFile, destFile);
        // Record this operation for potential rollback
        rollbackStack.push({ type: "file", src: srcFile, dest: destFile });
        // Delete the original file after copying
        fs.unlinkSync(srcFile);
      } else {
        // If it's a directory, move recursively
        moveFiles(srcFile, path.join(destDir, file), excludedFiles);
        // Record this operation for potential rollback
        rollbackStack.push({ type: "directory", src: srcFile });
        // Remove the empty source directory
        fs.rmdirSync(srcFile);
      }
    });
  } catch (error) {
    // If an error occurs, rollback changes
    console.error(
      "Error occurred during file move. Rolling back changes:",
      error
    );
    rollbackStack.forEach((action) => {
      if (action.type === "file") {
        // Move file back to its original location
        if (fs.existsSync(action.dest)) {
          fs.copyFileSync(action.dest, action.src);
          fs.unlinkSync(action.dest);
        }
      } else if (action.type === "directory") {
        // Recreate the original directory if needed
        if (!fs.existsSync(action.src)) {
          fs.mkdirSync(action.src, { recursive: true });
        }
      }
    });
    throw error; // Rethrow the error after rollback
  }
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
  copyFiles,
};
