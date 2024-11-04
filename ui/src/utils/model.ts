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

export interface Model {
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
  model: string;
  speed: string;
  emotion: string;
  emotionLevel: string; // 情感等级 azure默认1 参考：https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice
  emotionRole: string; // 模仿角色 用指定模型模仿其他角色说话，如：女孩/男孩/年轻女性等等
  text: string;
  startSpace: string; // 开始空白时长
  endSpace: string; // 结束空白时长
  sentenceSpace: string; // 句号空白时长
  semicolonSpace: string; // 分号空白时长
  commaSpace: string; // 逗号空白时长
  enumSpace: string; // 顿号空白时长
}
