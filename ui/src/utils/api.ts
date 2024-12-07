import { request, requestByToken } from "./request";
import { playAudio } from "./common";
import { GlobalUserInfo, GlobalUserLogin } from "./global.store";

export const playSSML = (ssml: string) => {
  request("playSSML", ssml).then((res) => {
    playAudio(res);
  });
};

export const logout = () => {
  GlobalUserLogin.value = undefined;
  GlobalUserInfo.value = undefined;
  requestByToken("logout")
    .then(() => {})
    .finally(() => {
      localStorage.removeItem("token");
    });
};
