import { ref } from "vue";
import type {
  BaseSelector,
  MessageModel,
  Project,
  SerivceProvider,
} from "./model";

// 是否打开项目标识符
export const openProjectFlag = ref(false);
// 是否已保存项目标识符，一般用于判断项目是否可以关闭
export const saveProjectFlag = ref(true);
// 当前打开的项目信息
export const project = ref<Project>({});

// 全局消息缓存
export const messages = ref<MessageModel[]>([]);

export const ModelCategoryItems = ref<BaseSelector[]>([
  { name: "我的收藏", code: "collect" },
  { name: "Azure", code: "azure" },
  // { name: "阿里云", code: "aliyun" },
]);

export const ServiceProviderItems = ref<SerivceProvider[]>([
  { name: "Azure", code: "azure" },
  // { name: "阿里云", code: "aliyun" },
]);
