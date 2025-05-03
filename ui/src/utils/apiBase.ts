/**
 * API通信基础模块
 * 提供与Electron主进程通信的基础方法
 */
import type { Result } from "@/types";

/**
 * 通用请求方法
 * @param channel IPC通道名称
 * @param args 参数
 * @returns 处理结果
 */
export async function invoke<T>(channel: string, ...args: any[]): Promise<T> {
  try {
    // @ts-ignore - window.electron由preload.js提供
    const result = await window.electron.invoke(channel, ...args);
    return result;
  } catch (error) {
    console.error(`调用[${channel}]失败:`, error);
    throw error;
  }
}

/**
 * 通用处理器调用方法
 * @param functionName 处理器函数名
 * @param args 参数
 * @returns 处理结果
 */
export async function invokeHandler<T>(
  functionName: string,
  ...args: any[]
): Promise<T> {
  try {
    // 将参数转为字符串数组
    const stringArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return arg;
      }
      return JSON.stringify(arg);
    });
    // @ts-ignore - window.api由preload.js提供
    const result = await window.api.invokeHandler(functionName, stringArgs);
    return result;
  } catch (error) {
    console.error(`调用处理器[${functionName}]失败:`, error);
    throw error;
  }
}

/**
 * 创建错误处理函数
 * @param serviceName 服务名称
 * @returns 错误处理函数
 */
export function createErrorHandler(serviceName: string) {
  return (error: unknown, defaultMessage: string): Result<null> => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    console.error(`${serviceName} Error: ${defaultMessage}`, error);
    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  };
} 