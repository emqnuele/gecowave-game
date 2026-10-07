import { defineConfig } from 'vitest/config';

// i test di unità provano la logica pura: phaser e il dom restano fuori, li prova l'harness
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node',
    },
});
