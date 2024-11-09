import local from "./local";
import { playAudio } from "./common";

export const playSSML = (ssml: string) => {
  local("playSSML", ssml).then((res) => {
    playAudio(res);
  });
};
