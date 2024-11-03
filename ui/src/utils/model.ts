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

export interface AzureConfig {
  key: string;
  models: Model[];
  region: string;
  endpoint: string;
}

export interface AliyunConfig {
  appkey: string;
  token: string;
  models: Model[];
  endpoint: string;
}

export interface Model {
  name: string;
  code: string;
  emotions: Emotion[];
}
export interface Emotion {
  name: string;
  code: string;
}

export interface SerivceProvider {
  name: string;
  code: string;
}
