import { defineConfig } from 'vite';

// base relativa: gli asset vanno caricati via file:// dentro electron
export default defineConfig({
    base: './',
});
