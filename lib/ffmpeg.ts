// The package exposes its binary path through CommonJS and does not ship type
// declarations. Keep that boundary here so downloader code remains typed.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require("@ffmpeg-installer/ffmpeg") as { path: string };

export const bundledFfmpegPath = ffmpeg.path;
