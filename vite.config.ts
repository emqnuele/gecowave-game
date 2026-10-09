import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// base relativa: gli asset vanno caricati via file:// dentro electron
export default defineConfig({
    base: './',
    // due build diverse non giocano insieme: la versione entra nella stretta di mano del coop
    define: { __GAME_VERSION__: JSON.stringify(pkg.version) },
});
