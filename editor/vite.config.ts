import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { levelFileIo } from './src/plugins/fileIo';

const here = dirname(fileURLToPath(import.meta.url));
const gameRoot = resolve(here, '..');

export default defineConfig({
    root: here,
    // gli asset dipinti del gioco vivono in ../public e vanno serviti a /
    publicDir: resolve(gameRoot, 'public'),
    plugins: [react(), tailwind(), levelFileIo(gameRoot)],
    resolve: {
        alias: {
            '@': resolve(here, 'src'),
            '@game': resolve(gameRoot, 'src'),
        },
    },
    server: {
        // permette a vite di leggere i sorgenti del gioco fuori dalla root editor
        fs: { allow: [gameRoot] },
    },
});
