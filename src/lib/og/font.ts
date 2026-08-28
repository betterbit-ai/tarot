import { readFile } from "node:fs/promises";
import { join } from "node:path";

let fontPromise: Promise<ArrayBuffer> | undefined;

export function loadKoreanOgFont(): Promise<ArrayBuffer> {
  fontPromise ??= readFile(join(process.cwd(), "public/fonts/NanumGothic-Regular.ttf")).then((font) =>
    font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer,
  );
  return fontPromise;
}
