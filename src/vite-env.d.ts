/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `demo` (default) or `api`; any other value is a configuration error. */
  readonly VITE_DATA_MODE?: string
  /** Neutral environment badge: staging or production. */
  readonly VITE_APP_ENV?: string
}
