// i finali al nucleo: le scelte di pedro e delle wave, e le strade della trama che li cambiano.
import { DEFAULT_CHOICES } from '../lib.mjs';
import { toMenu } from '../bot.mjs';
import { chapter } from './chapters.mjs';

const policy = (...rules) => [...rules, ...DEFAULT_CHOICES];
const fragile = { stats: { forza: 0, costituzione: 0, flusso: 0 } };
const end = { exit: false, after: (ctx) => toMenu(ctx) };

export default [
    chapter('finale-consegna', 'nucleo', { ...end }),
    chapter('finale-dei', 'nucleo', { ...end, choices: policy([/le wave tornano/, 1]) }),
    chapter('finale-sconfitta', 'nucleo', { ...end, patch: fragile, choices: policy([/le wave tornano/, 1]) }),
    chapter('finale-patto', 'nucleo', { ...end, patch: fragile, choices: policy([/pedro aspetta/, 0]) }),
    chapter('finale-riscatto', 'nucleo', { ...end, film: 'watch', patch: { flags: ['ricordi-visti', 'void-concluso', 'caso-risolto'], unflags: ['pensiero-cancellato'] }, choices: policy([/pedro aspetta/, 2], [/le wave tornano/, 2]) }),
    chapter('finale-riscatto-solo', 'nucleo', { ...end, patch: { flags: ['ricordi-visti', 'void-concluso', 'caso-risolto', 'pensiero-cancellato'] }, choices: policy([/pedro aspetta/, 2], [/le wave tornano/, 2]) }),
    chapter('finale-riscatto-senza-caso', 'nucleo', { ...end, patch: { flags: ['ricordi-visti', 'void-concluso'], unflags: ['caso-risolto'] }, choices: policy([/pedro aspetta/, 2], [/le wave tornano/, 0]) }),
    chapter('finale-giorno30-vuoto', 'nucleo', { ...end, patch: { flags: ['ricordi-visti'], unflags: ['void-concluso'] }, choices: policy([/pedro aspetta/, 2]) }),
    chapter('finale-quaderno', 'nucleo', { ...end, film: 'watch', patch: { flags: ['quaderno-completo'] } }),
];
