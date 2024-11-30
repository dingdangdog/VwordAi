/**
 * 封装http请求工具
 */
import type { Result } from "@/utils/model";
import { alertError } from "./common";
// import { errorAlert } from "@/utils/alert";
// import { cleanLoginInfo } from '@/utils/common'

// 创建api调用者
const local = async (functionName: string, ...args: any) => {
  // console.log(request)
  let serializedArgs =
    args.length > 0 ? args.map((arg: any) => JSON.stringify(arg)) : undefined;
  // console.log(functionName, serializedArgs)
  // @ts-ignore
  const res: Result<any> = await window.api.invokeHandler(
    functionName,
    serializedArgs
  );
  // console.log('res', res)
  if (!res) {
    // errorAlert('res Undefined')
    alertError("未知异常，请提交反馈");
    throw Error("res undefined");
  }
  if (res.c == 200) {
    return res.d;
  } else if (res.c == 500) {
    // 500 服务异常
    alertError(res.m);
    throw Error(res.m);
  } else if (res.c == 400) {
    // 登录异常
    alertError("请先登录");
    throw Error(res.m);
  } else {
    // 未知异常
    alertError("服务异常，请联系管理员");
    throw Error(JSON.stringify(res));
  }
};

export default local;
