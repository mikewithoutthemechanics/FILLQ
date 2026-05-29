/// <reference types="vite/client" />

declare module 'gsap' {
  export * from 'gsap/all'
}

declare module 'gsap/ScrollTrigger' {
  import { gsap } from 'gsap'
  export = gsap
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
