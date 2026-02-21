const say = require("say");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const { success, error } = require("../utils/result");

const isWindows = process.platform === "win32";

/** 检测文本是否包含中文/CJK 字符 */
function hasChinese(text) {
  if (!text || typeof text !== "string") return false;
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text);
}

/** 从语音列表中选取支持中文的语音名称（用于 Windows SAPI） */
function pickChineseVoice(voiceNames) {
  if (!Array.isArray(voiceNames) || voiceNames.length === 0) return null;
  const chinesePatterns = [
    /huihui/i,
    /chinese/i,
    /zh[-_]?cn/i,
    /zh[-_]?tw/i,
    /mandarin/i,
    /simplified\s*chinese/i,
    /traditional\s*chinese/i,
  ];
  for (const name of voiceNames) {
    if (chinesePatterns.some((p) => p.test(name))) return name;
  }
  return null;
}

/** Windows 下将速度比转换为 SAPI Rate (-10..10) */
function win32SpeedToRate(speed) {
  const s = Number(speed) || 1.0;
  return Math.max(-10, Math.min(Math.round(9.0686 * Math.log(s) - 0.1806), 10));
}

/**
 * Windows 下使用 UTF-8 编码通过 PowerShell 调用 SAPI 播报，避免 say 包 ascii 编码导致中文乱码
 */
function playWin32Utf8(text, voice, speed, callback) {
  const rate = win32SpeedToRate(speed);
  let psCommand =
    "[Console]::InputEncoding = [System.Text.Encoding]::UTF8;";
  psCommand += "Add-Type -AssemblyName System.speech;";
  psCommand += "$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer;";
  if (voice) {
    psCommand += `$speak.SelectVoice('${voice.replace(/'/g, "''")}');`;
  }
  psCommand += `$speak.Rate = ${rate};`;
  psCommand += "$speak.Speak([Console]::In.ReadToEnd())";

  const child = childProcess.spawn("powershell", [psCommand], { shell: true });
  child.stdin.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdin.end(text, "utf8");

  child.stderr.once("data", (data) => callback(new Error(String(data))));
  child.on("exit", (code, signal) => {
    if (code !== null || signal !== null) {
      return callback(new Error(`PowerShell exit code: ${code}, signal: ${signal}`));
    }
    callback(null);
  });
}

/**
 * 使用本地TTS引擎播放文本
 * @param {string} text 要播放的文本
 * @param {Object} settings 播放设置
 * @returns {Promise} 操作结果
 */
const play = (text, settings = {}) => {
  if (!text) {
    return Promise.reject(error("文本内容为空"));
  }

  return new Promise(async (resolve, reject) => {
    try {
      const speed = settings.speed || 1.0;
      let voiceToUse = settings.voice || null;

      if (isWindows) {
        const useUtf8Path = hasChinese(text);
        if (useUtf8Path) {
          if (!voiceToUse) {
            const voices = await getAvailableVoices().catch(() => []);
            voiceToUse = pickChineseVoice(voices) || null;
          }
          playWin32Utf8(text, voiceToUse, speed, (err) => {
            if (err) {
              console.error("[LocalTTS] Playback error:", err);
              reject(error(err.message || "本地TTS播放失败"));
            } else {
              console.log("[LocalTTS] Playback completed");
              resolve(success({}, "本地TTS播放成功"));
            }
          });
          return;
        }
      }

      say.speak(text, voiceToUse, speed, (err) => {
        if (err) {
          console.error("[LocalTTS] Playback error:", err);
          reject(error(err.message || "本地TTS播放失败"));
        } else {
          console.log("[LocalTTS] Playback completed");
          resolve(success({}, "本地TTS播放成功"));
        }
      });
    } catch (err) {
      console.error("[LocalTTS] Setup error:", err);
      reject(error(err.message || "本地TTS初始化失败"));
    }
  });
};

/**
 * Windows 下使用 UTF-8 通过 PowerShell 导出 WAV
 */
function exportWin32Utf8(text, voice, speed, fileName, callback) {
  const rate = win32SpeedToRate(speed);
  const safePath = fileName.replace(/'/g, "''");
  let psCommand =
    "[Console]::InputEncoding = [System.Text.Encoding]::UTF8;";
  psCommand += "Add-Type -AssemblyName System.speech;";
  psCommand += "$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer;";
  if (voice) {
    psCommand += `$speak.SelectVoice('${voice.replace(/'/g, "''")}');`;
  }
  psCommand += `$speak.Rate = ${rate};`;
  psCommand += `$speak.SetOutputToWaveFile('${safePath}');`;
  psCommand += "$speak.Speak([Console]::In.ReadToEnd());$speak.Dispose()";

  const child = childProcess.spawn("powershell", [psCommand], { shell: true });
  child.stdin.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdin.end(text, "utf8");

  child.stderr.once("data", (data) => callback(new Error(String(data))));
  child.on("exit", (code, signal) => {
    if (code !== null || signal !== null) {
      return callback(new Error(`PowerShell exit code: ${code}, signal: ${signal}`));
    }
    callback(null);
  });
}

/**
 * 使用本地TTS引擎将文本合成为音频文件
 * @param {string} text 要合成的文本
 * @param {string} fileName 输出文件路径
 * @param {Object} settings 合成设置
 * @returns {Promise} 操作结果
 */
const synthesize = (text, fileName, settings = {}) => {
  if (!text) {
    return Promise.reject(error("文本内容为空"));
  }

  if (!fileName) {
    return Promise.reject(error("输出文件路径未指定"));
  }

  return new Promise(async (resolve, reject) => {
    try {
      const outputDir = path.dirname(fileName);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const speed = settings.speed || 1.0;
      let voiceToUse = settings.voice || null;

      if (isWindows && hasChinese(text)) {
        if (!voiceToUse) {
          const voices = await getAvailableVoices().catch(() => []);
          voiceToUse = pickChineseVoice(voices) || null;
        }
        exportWin32Utf8(text, voiceToUse, speed, fileName, (err) => {
          if (err) {
            console.error("[LocalTTS] Export error:", err);
            reject(error(err.message || "本地TTS导出失败"));
          } else {
            console.log(`[LocalTTS] Export completed to: ${fileName}`);
            resolve(success({ filePath: fileName }, "本地TTS导出成功"));
          }
        });
        return;
      }

      say.export(text, voiceToUse, speed, fileName, (err) => {
        if (err) {
          console.error("[LocalTTS] Export error:", err);
          reject(error(err.message || "本地TTS导出失败"));
        } else {
          console.log(`[LocalTTS] Export completed to: ${fileName}`);
          resolve(success({ filePath: fileName }, "本地TTS导出成功"));
        }
      });
    } catch (err) {
      console.error("[LocalTTS] Export setup error:", err);
      reject(error(err.message || "本地TTS导出初始化失败"));
    }
  });
};

/**
 * 获取系统已安装的 TTS 语音列表（用于检测是否支持中文等）
 * @returns {Promise<string[]>} 语音名称数组
 */
function getAvailableVoices() {
  return new Promise((resolve, reject) => {
    say.getInstalledVoices((err, voices) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(Array.isArray(voices) ? voices : []);
    });
  });
}

/**
 * 检测当前系统是否具备中文 TTS 能力（仅 Windows 有意义，用于 UI 提示）
 * @returns {Promise<{ supported: boolean, voiceName?: string }>}
 */
async function checkChineseSupport() {
  if (!isWindows) {
    return { supported: true };
  }
  const voices = await getAvailableVoices().catch(() => []);
  const chineseVoice = pickChineseVoice(voices);
  return {
    supported: !!chineseVoice,
    voiceName: chineseVoice || undefined,
  };
}

module.exports = {
  play,
  synthesize,
  getAvailableVoices,
  checkChineseSupport,
  hasChinese,
  pickChineseVoice,
};
