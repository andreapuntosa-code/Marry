import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setOverwriteOutput(true);
Config.setEntryPoint('./src/index.ts');

// Facoltativo: usa un Chrome/Chromium già installato invece di quello che Remotion scarica.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
