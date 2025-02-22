import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
export const createFFmpegInstance = async () => {
  const ffmpeg = new FFmpeg();
 
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  const result = await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  console.log("ffmpeg ready", result);
  return ffmpeg;
};
