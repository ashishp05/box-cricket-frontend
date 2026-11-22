import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type UserConfig } from 'vite';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Both apps share src/shared and read VITE_* variables from the project root .env files.
export const appConfig = (app: 'web', port: number): UserConfig =>
  defineConfig({
    root: here(`./src/${app}`),
    envDir: here('.'),
    publicDir: here('./public'),
    plugins: [react()],
    resolve: { alias: { '@shared': here('./src/shared') } },
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
    build: { outDir: here(`./dist/${app}`), emptyOutDir: true },
  });
