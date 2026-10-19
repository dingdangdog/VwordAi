import { computed, onScopeDispose, ref } from "vue";

const playingUrl = ref("");
const failedUrl = ref("");
let owner = 0;
let serial = 0;
let audio: HTMLAudioElement | null = null;

function stopAudio() {
  audio?.pause();
  audio = null;
  playingUrl.value = "";
  owner = 0;
}

/** 同一时间只播放一条音色试听。 */
export function useVoicePreview() {
  const id = ++serial;
  const playing = computed(() => owner === id && playingUrl.value !== "");

  function toggle(url: string) {
    if (!url) return;
    if (owner === id && playingUrl.value === url) {
      stopAudio();
      return;
    }
    stopAudio();
    failedUrl.value = "";
    const next = new Audio(url);
    audio = next;
    owner = id;
    playingUrl.value = url;
    next.onended = () => {
      if (audio === next) stopAudio();
    };
    next.onerror = () => {
      if (audio !== next) return;
      failedUrl.value = url;
      stopAudio();
    };
    void next.play().catch(() => {
      if (audio !== next) return;
      failedUrl.value = url;
      stopAudio();
    });
  }

  onScopeDispose(() => {
    if (owner === id) stopAudio();
  });

  return { playing, toggle, failedUrl };
}
