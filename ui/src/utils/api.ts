import request from "./request";
import { playAudio } from "./common";

export const playSSML = (ssml: string) => {
  request("playSSML", ssml).then((res) => {
    playAudio(res);
  });
};
