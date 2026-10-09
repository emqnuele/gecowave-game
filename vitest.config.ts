import { defineConfig } from 'vitest/config';

// i test di unità provano la logica pura: phaser e il dom restano fuori, li prova l'harness
export default defineConfig({
    define: { __GAME_VERSION__: JSON.stringify('test') },
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node',
    },
});
