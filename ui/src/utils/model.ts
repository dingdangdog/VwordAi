export interface Result<T> {
  c: number;
  m: string;
  d: T;
}

export interface SystemConfig {
  dataPath: string;
  serviceProviders: SerivceProvider[];
  serviceConfig: {
    azure: AzureConfig;
    openai: {};
    aliyun: AliyunConfig;
    sovits: {};
  };
}

export interface SerivceProvider {
  name: string;
  code: string;
}
export interface AzureConfig {
  key: string;
  region: string;
  endpoint: string;
}

export interface AliyunConfig {
  appkey: string;
  token: string;
  endpoint: string;
}

export interface VoiceModel {
  lang: string;
  gender: string;
  name: string;
  code: string;
  level?: string;
  emotions: Emotion[];
}
export interface Emotion {
  name: string;
  code: string;
}

export interface SsmlText {
  provider: string; // 服务商：azure/aliyun
  type: "text" | "blank"; // 数据类型：text/blank 普通文本/空白间隔
  model: string; // 模型code
  speed: string; // 语速
  emotion: string; // 情感code
  emotionLevel: string; // 情感等级 azure默认1 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
  emotionRole: string; // 模仿角色 用指定模型模仿其他角色说话，如：女孩/男孩/年轻女性等等
  text: string; // 文本内容
}

export interface SsmlCommonConfig {
  startSpace: string; // 开始空白时长
  endSpace: string; // 结束空白时长
  sentenceSpace: string; // 句号空白时长
  semicolonSpace: string; // 分号空白时长
  commaSpace: string; // 逗号空白时长
  enumSpace: string; // 顿号空白时长
}
