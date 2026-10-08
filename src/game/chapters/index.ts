import { BarratoChapter } from './barrato';
import { BusChapter } from './bus';
import { CantinaChapter } from './cantina';
import { CasoChapter } from './caso';
import type { ChapterCtx, ChapterScript } from './ChapterScript';
import { NoChapter } from './ChapterScript';
import { CustodeChapter } from './custode';
import { MenteChapter } from './mente';
import { NucleoChapter } from './nucleo';
import { PerdutaChapter } from './perduta';
import { PiazzaChapter } from './piazza';
import { RicordiChapter } from './ricordi';
import { RioChapter } from './rio';
import { RuhraChapter } from './ruhra';
import { SantuarioChapter } from './santuario';
import { SorveglianzaChapter } from './sorveglianza';
import { StabilimentoChapter } from './stabilimento';
import { TanaChapter } from './tana';
import { TecnokillChapter } from './tecnokill';
import { TrenboloneChapter } from './trenbolone';
import { VoidChapter } from './void';
import { WalterChapter } from './walter';

/** la trama di ogni capitolo, per id del livello: un capitolo nuovo è una riga qui e un file accanto */
const CHAPTERS: Record<string, new (ctx: ChapterCtx) => ChapterScript> = {
    piazza: PiazzaChapter,
    perduta: PerdutaChapter,
    bus: BusChapter,
    galliate: WalterChapter,
    marcetti: WalterChapter,
    santuario: SantuarioChapter,
    tecnokill: TecnokillChapter,
    trenbolone: TrenboloneChapter,
    tana: TanaChapter,
    rio: RioChapter,
    stabilimento: StabilimentoChapter,
    ruhra: RuhraChapter,
    mente: MenteChapter,
    caso: CasoChapter,
    sorveglianza: SorveglianzaChapter,
    cantina: CantinaChapter,
    ricordi: RicordiChapter,
    void: VoidChapter,
    nucleo: NucleoChapter,
    barrato: BarratoChapter,
    custode: CustodeChapter,
};

export function createChapter(ctx: ChapterCtx, levelId: string): ChapterScript {
    const Script = CHAPTERS[levelId] ?? NoChapter;
    return new Script(ctx);
}

export type { ChapterScript, EndingId, Target } from './ChapterScript';
export { indiziRaccolti } from './caso';
