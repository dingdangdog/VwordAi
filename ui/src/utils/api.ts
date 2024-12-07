import { request, requestByToken } from "./request";
import { playAudio } from "./common";
import { GlobalUserInfo, GlobalUserLogin } from "./global.store";

export const playSSML = (ssml: string) => {
  request("playSSML", ssml).then((res) => {
    playAudio(res);
  });
};

export const logout = () => {
  requestByToken("logout").then(() => {
    GlobalUserLogin.value = undefined;
    GlobalUserInfo.value = undefined;
    localStorage.removeItem("token");
  });
};
