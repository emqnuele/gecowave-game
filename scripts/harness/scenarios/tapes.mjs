// nastri di tasti veri generati dal geco simulato (scripts/world/run.sh tapes): la fisica del controllo per intero.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { botState, prepareSave } from '../lib.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../data/tapes');

const abilities = (ab) => [...(ab.dash ? ['scivolata'] : []), ...(ab.double ? ['rimbalzo'] : []), ...(ab.wall ? ['aggrappo'] : [])];

export default existsSync(DIR)
    ? readdirSync(DIR).filter((f) => f.endsWith('.json')).sort().map((f) => {
        const tape = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
        return {
            id: `nastro-${tape.region}`,
            level: tape.region,
            // il nastro è fisica pura: niente dialoghi d'ingresso che fermano la scena
            ...prepareSave({ abilities: abilities(tape.abilities), stats: { forza: 0, costituzione: 20, flusso: 0 }, seen: ['tana-risveglio', 'mente-ingresso', 'tommaso-benvenuto', 'tommaso-benvenuto-estraneo', 'ricordi-ingresso', 'void-intro', 'barrato-ingresso', 'custode-ingresso', 'galliate-intro', 'marcetti-intro', 'piazza-arrivo'] }),
            async run(ctx) {
                await ctx.wait(30);
                await ctx.tape(tape.events, 30);
                const s = await botState(ctx);
                // dove arriva il geco vero rispetto al simulato: solo un'annotazione, non un controllo
                ctx.mark(`fine nastro ${Math.round(s.p?.x ?? -1)},${Math.round(s.p?.y ?? -1)} atteso ${tape.expect.x},${tape.expect.y}`);
                if (process.env.VERBOSE) console.log(`[${tape.region}] geco vero ${Math.round(s.p?.x)},${Math.round(s.p?.y)} simulato ${tape.expect.x},${tape.expect.y}`);
            },
        };
    })
    : [];
