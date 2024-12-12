import type { VoiceObject } from "./model";

// 用户信息
export interface UserInfo {
  token: string;
  userId?: number;
  name?: string;
  account?: string;
  phone?: string;
  email?: string;
  create_by?: string;
  balance?: number;
}
// 初始化登录返回信息
export interface UserInitInfo {
  token: string;
  userId?: number;
  name?: string;
  create_by?: string;
  account?: string;
  password?: string;
}
// 用户信息
export interface User {
  id?: number;
  username?: string;
  account?: string;
  password?: string;
  phone?: string;
  email?: string;
  balance?: number;
  wxOpenid?: string;
  githubKey?: string;
  googleKey?: string;
  wx_openid?: string;
  github_key?: string;
  google_key?: string;
  create_by?: string;
}
// 消费记录（文-使用记录）
export interface Used {
  id?: number;
  userId?: number;
  projectId?: number;
  projectName?: string;
  amount: number;
  time: string;
}

// 订单记录（文-充值记录）
export interface Order {
  id?: number;
  userId?: string | number;
  comboId?: string | number;
  no?: string; // 本平台订单号
  price?: string;
  words?: number;
  status?: string; // 0 创建；1 成功；2 失败；3 退款； -1 取消
  orderNo?: string; // 支付机构内部订单号
  payType?: string;
  payTime?: string;
  create_by?: string;
  update_by?: string;
  // 数据库原生字段
  user_id?: string | number;
  combo_id?: string | number;
  order_no?: string; // 支付机构内部订单号
  pay_type?: string;
  pay_time?: string;
}

export interface FundLog {
  id?: number;
  time?: string;
  type?: string;
  num?: string;
}

export interface AliyunOrderCode {
  code?: string; // 10000 成功
  msg?: string;
  out_trade_no?: string;
  qr_code?: string;
}

export interface Combo {
  id?: number;
  name?: string;
  price?: string;
  words?: number;
}
