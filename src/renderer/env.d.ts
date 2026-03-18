/// <reference types="vite/client" />
/// <reference types="chrome" />
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

interface EyeDropper {
  open(options?: { signal: AbortSignal }): Promise<{ sRGBHex: string }>;
}

interface Window {
  EyeDropper: {
    new (): EyeDropper;
  };
}