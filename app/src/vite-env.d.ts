/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: (code?: string) => void;
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

interface Window {
  turnstile?: TurnstileApi;
}
