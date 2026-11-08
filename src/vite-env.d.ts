/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  /** Optional override for the API Gateway base URL (defaults to the M1 flight-api). */
  readonly VITE_FLIGHT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
