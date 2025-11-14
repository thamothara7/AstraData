/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_NETWORK: string;
  readonly VITE_MARKETPLACE_PACKAGE_ID: string;
  readonly VITE_MARKETPLACE_OBJECT_ID: string;
  readonly VITE_WALRUS_API_URL: string;
  readonly VITE_SEAL_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

