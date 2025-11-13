declare module "*.tsx" { const content: any; export default content; }
interface ImportMetaEnv {
  VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
